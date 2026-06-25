/**
 * __tests__/corte-caja.service.test.js
 *
 * Pruebas de integración — módulo Corte de Caja
 * Escenarios cubiertos del spec.md:
 *   HU-010 · Realizar corte de caja  (E1, E2, E3)
 *   HU-011 · Consultar historial      (E1)
 *
 * Convenciones (skill-ith-backend.md):
 *   - Variables y funciones: inglés camelCase
 *   - Comentarios: español
 */

// ─── Mock de Supabase ──────────────────────────────────────────────────────────
const mockSingle      = jest.fn();
const mockMaybeSingle = jest.fn();

const chain = {
  select:      jest.fn().mockReturnThis(),
  eq:          jest.fn().mockReturnThis(),
  in:          jest.fn().mockReturnThis(),
  gte:         jest.fn().mockReturnThis(),
  lte:         jest.fn().mockReturnThis(),
  is:          jest.fn().mockReturnThis(),
  order:       jest.fn().mockReturnThis(),
  insert:      jest.fn().mockReturnThis(),
  update:      jest.fn().mockReturnThis(),
  single:      mockSingle,
  maybeSingle: mockMaybeSingle,
  then:  (fn) => Promise.resolve(mockSingle()).then(fn),
  catch: (fn) => Promise.resolve(mockSingle()).catch(fn),
};

const mockFrom = jest.fn().mockReturnValue(chain);

jest.mock('../src/config/supabase.js', () => ({
  supabase: { from: (...args) => mockFrom(...args) },
}));

// ─── Import del módulo bajo prueba ────────────────────────────────────────────
const {
  abrirCorte,
  cerrarCorte,
  listarCortes,
  obtenerCorte,
} = require('../src/modules/corte-caja/corte-caja.service.js');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const HOY = new Date().toISOString().slice(0, 10);

const CORTE_ABIERTO = {
  id_corte:       1,
  fecha_corte:    HOY,
  fecha_apertura: `${HOY}T08:00:00.000Z`,
  id_usuario:     1,
  estado:         'abierto',
};

// Mezcla representativa de ventas del día:
//   Completadas efectivo : 350 + 100 = 450
//   Completadas tarjeta  : 200
//   Total ventas sistema : 650
//   Devoluciones         : 80  (→ total_devoluciones)
//   Canceladas           : 50  (→ num_canceladas, no suman a ventas)
const VENTAS_DIA = [
  { total: '350', estado: 'completada', metodo_pago: 'efectivo' },
  { total: '200', estado: 'completada', metodo_pago: 'tarjeta'  },
  { total: '100', estado: 'completada', metodo_pago: 'efectivo' },
  { total: '50',  estado: 'cancelada',  metodo_pago: 'efectivo' },
  { total: '80',  estado: 'devolucion', metodo_pago: 'efectivo' },
];

const ID_ADMIN = 1;

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// abrirCorte
// =============================================================================
describe('abrirCorte', () => {

  // ---------------------------------------------------------------------------
  // HU-010 · Escenario 1 — Apertura exitosa
  //
  // Given: no hay ningún corte registrado para hoy (fecha_corte es UNIQUE)
  // When:  el administrador abre el corte del día
  // Then:  se crea con estado 'abierto' y la fecha de hoy
  // ---------------------------------------------------------------------------
  test('HU-010-E1 · crea el corte del día cuando no existe corte previo', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null }); // no hay corte hoy
    mockSingle.mockResolvedValueOnce({ data: CORTE_ABIERTO, error: null }); // insert exitoso

    const resultado = await abrirCorte(ID_ADMIN);

    expect(resultado.estado).toBe('abierto');
    expect(resultado.fecha_corte).toBe(HOY);
    expect(resultado.id_usuario).toBe(ID_ADMIN);
    // El insert nunca debe incluir 'monto_inicial' (columna inexistente en schema)
    expect(chain.insert).not.toHaveBeenCalledWith(
      expect.objectContaining({ monto_inicial: expect.anything() })
    );
  });

  // ---------------------------------------------------------------------------
  // HU-010 · Escenario 3 — Corte duplicado (ya existe para hoy)
  //
  // Given: ya se abrió un corte de caja hoy
  // When:  otro usuario intenta abrir un segundo corte
  // Then:  error "Ya existe un corte para hoy" con status 400;
  //        el insert nunca se ejecuta
  // ---------------------------------------------------------------------------
  test('HU-010-E3 · rechaza abrir un segundo corte el mismo día', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id_corte: 1 }, error: null });

    const err = await abrirCorte(ID_ADMIN).catch((e) => e);

    expect(err.message).toBe('Ya existe un corte para hoy');
    expect(err.status).toBe(400);
    // El insert nunca debe haberse ejecutado
    expect(chain.insert).not.toHaveBeenCalled();
  });
});

// =============================================================================
// cerrarCorte
// =============================================================================
describe('cerrarCorte', () => {

  // ---------------------------------------------------------------------------
  // HU-010 · Escenario 1 — Cierre exitoso con cálculo de totales
  //
  // Given: corte abierto, ventas del día con efectivo y tarjeta
  // When:  administrador ingresa monto_contado_fisico = 450
  // Then:  total_efectivo = 450, total_tarjeta = 200, total_ventas = 650,
  //        total_devoluciones = 80, num_ventas = 3, num_canceladas = 1
  // ---------------------------------------------------------------------------
  test('HU-010-E1 · cierra el corte y calcula totales por método de pago', async () => {
    const corteCerrado = {
      ...CORTE_ABIERTO,
      estado:                 'cerrado',
      monto_contado_fisico:   450,
      total_ventas_sistema:   650,
      total_efectivo_sistema: 450,
      total_tarjeta_sistema:  200,
      total_devoluciones:     80,
      usuarios:               { nombre: 'Admin' },
    };

    mockSingle
      // 1ª → select corte para verificar que existe y está abierto
      .mockResolvedValueOnce({ data: CORTE_ABIERTO,  error: null })
      // 2ª → select ventas del período
      .mockResolvedValueOnce({ data: VENTAS_DIA,     error: null })
      // 3ª → update ventas.id_corte (asignación masiva — resuelto vía .then)
      .mockResolvedValueOnce({ data: null,           error: null })
      // 4ª → update corte_caja + select final
      .mockResolvedValueOnce({ data: corteCerrado,   error: null });

    const resultado = await cerrarCorte(1, { monto_contado_fisico: 450, observaciones: 'OK' });

    expect(resultado.estado).toBe('cerrado');
    expect(resultado.total_ventas_sistema).toBe(650);
    expect(resultado.total_efectivo_sistema).toBe(450);
    expect(resultado.total_tarjeta_sistema).toBe(200);
    expect(resultado.total_devoluciones).toBe(80);
    // Calculados por el service, no persistidos en DB
    expect(resultado.num_ventas).toBe(3);
    expect(resultado.num_canceladas).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // HU-010 · Escenario 2 — Diferencia de caja
  //
  // Given: total_efectivo_sistema = 450, monto_contado_fisico = 400
  // When:  el corte se cierra
  // Then:  'diferencia' = −50 viene del select post-update (columna GENERATED
  //        ALWAYS AS en PostgreSQL); el service NO la incluye en el UPDATE
  // ---------------------------------------------------------------------------
  test('HU-010-E2 · la diferencia viene del DB (GENERATED) y el update no la incluye', async () => {
    const corteCerradoConDif = {
      ...CORTE_ABIERTO,
      estado:                 'cerrado',
      monto_contado_fisico:   400,
      total_efectivo_sistema: 450,
      diferencia:             -50,  // PostgreSQL: 400 − 450 = −50
      usuarios:               { nombre: 'Admin' },
    };

    mockSingle
      .mockResolvedValueOnce({ data: CORTE_ABIERTO,        error: null })
      .mockResolvedValueOnce({ data: VENTAS_DIA,           error: null })
      .mockResolvedValueOnce({ data: null,                 error: null })
      .mockResolvedValueOnce({ data: corteCerradoConDif,   error: null });

    const resultado = await cerrarCorte(1, { monto_contado_fisico: 400 });

    // La diferencia llega del DB, no la calcula el service
    expect(resultado.diferencia).toBe(-50);

    // Verificar que 'diferencia' NUNCA se incluyó en el payload del update
    // (insertarla causaría error en PostgreSQL: "cannot insert into a generated column")
    expect(chain.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ diferencia: expect.anything() })
    );
  });

  // ---------------------------------------------------------------------------
  // HU-010 · Escenario 3 — Cierre duplicado (corte ya cerrado)
  //
  // Given: corte con estado = 'cerrado'
  // When:  se intenta cerrarlo de nuevo
  // Then:  error "El corte ya está cerrado" con status 400;
  //        el update nunca se ejecuta
  // ---------------------------------------------------------------------------
  test('HU-010-E3 · rechaza cerrar un corte que ya está cerrado', async () => {
    const corteCerrado = { ...CORTE_ABIERTO, estado: 'cerrado' };
    mockSingle.mockResolvedValueOnce({ data: corteCerrado, error: null });

    const err = await cerrarCorte(1, { monto_contado_fisico: 500 }).catch((e) => e);

    expect(err.message).toBe('El corte ya está cerrado');
    expect(err.status).toBe(400);
    // No debe ejecutarse ningún cálculo ni actualización
    expect(chain.update).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Corte no encontrado → 404
  // ---------------------------------------------------------------------------
  test('lanza 404 si el id_corte no existe en la base de datos', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'no rows' } });

    const err = await cerrarCorte(999, { monto_contado_fisico: 0 }).catch((e) => e);

    expect(err.message).toBe('Corte no encontrado');
    expect(err.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // Corte sin ventas en el período → todos los totales en 0
  // ---------------------------------------------------------------------------
  test('HU-010-E1b · cierra correctamente un corte sin ventas registradas', async () => {
    const corteSinVentas = {
      ...CORTE_ABIERTO,
      estado: 'cerrado',
      total_ventas_sistema: 0, total_efectivo_sistema: 0,
      total_tarjeta_sistema: 0, total_devoluciones: 0,
      usuarios: { nombre: 'Admin' },
    };

    mockSingle
      .mockResolvedValueOnce({ data: CORTE_ABIERTO,  error: null })
      .mockResolvedValueOnce({ data: [],             error: null }) // sin ventas
      .mockResolvedValueOnce({ data: null,           error: null })
      .mockResolvedValueOnce({ data: corteSinVentas, error: null });

    const resultado = await cerrarCorte(1, { monto_contado_fisico: 0 });

    expect(resultado.total_ventas_sistema).toBe(0);
    expect(resultado.num_ventas).toBe(0);
    expect(resultado.num_canceladas).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // test.each — tabla de combinaciones de métodos de pago
  // Verifica los tres escenarios principales de distribución del efectivo
  // ---------------------------------------------------------------------------
  const casosMetodoPago = [
    {
      desc:         'solo ventas en efectivo',
      ventas:       [
        { total: '100', estado: 'completada', metodo_pago: 'efectivo' },
        { total: '200', estado: 'completada', metodo_pago: 'efectivo' },
      ],
      espEfectivo:  300,
      espTarjeta:   0,
      espTotal:     300,
    },
    {
      desc:         'solo ventas en tarjeta',
      ventas:       [
        { total: '500', estado: 'completada', metodo_pago: 'tarjeta' },
      ],
      espEfectivo:  0,
      espTarjeta:   500,
      espTotal:     500,
    },
    {
      desc:         'devoluciones no suman al total de ventas',
      ventas:       [
        { total: '300', estado: 'completada', metodo_pago: 'efectivo' },
        { total: '100', estado: 'devolucion', metodo_pago: 'efectivo' },
      ],
      espEfectivo:  300,
      espTarjeta:   0,
      espTotal:     300,  // devoluciones van a total_devoluciones, no a ventas
    },
  ];

  test.each(casosMetodoPago)(
    'cálculo de totales — $desc',
    async ({ ventas, espEfectivo, espTarjeta, espTotal }) => {
      const corteCerrado = {
        ...CORTE_ABIERTO,
        estado: 'cerrado',
        total_ventas_sistema:   espTotal,
        total_efectivo_sistema: espEfectivo,
        total_tarjeta_sistema:  espTarjeta,
        usuarios:               { nombre: 'Admin' },
      };

      mockSingle
        .mockResolvedValueOnce({ data: CORTE_ABIERTO, error: null })
        .mockResolvedValueOnce({ data: ventas,        error: null })
        .mockResolvedValueOnce({ data: null,          error: null })
        .mockResolvedValueOnce({ data: corteCerrado,  error: null });

      const resultado = await cerrarCorte(1, { monto_contado_fisico: espEfectivo });

      expect(resultado.total_ventas_sistema).toBe(espTotal);
      expect(resultado.total_efectivo_sistema).toBe(espEfectivo);
      expect(resultado.total_tarjeta_sistema).toBe(espTarjeta);
    }
  );
});

// =============================================================================
// listarCortes — HU-011 · Escenario 1
// =============================================================================
describe('listarCortes', () => {

  // ---------------------------------------------------------------------------
  // HU-011 · Escenario 1 — Consulta por rango de fechas
  //
  // Given: existen cortes para distintos días del mes
  // When:  administrador filtra desde='2026-06-01' hasta='2026-06-30'
  // Then:  la query aplica gte y lte con las fechas correctas
  // ---------------------------------------------------------------------------
  test('HU-011-E1 · aplica filtros gte y lte al rango de fechas', async () => {
    const cortesJunio = [
      { id_corte: 1, fecha_corte: '2026-06-10', estado: 'cerrado' },
      { id_corte: 2, fecha_corte: '2026-06-20', estado: 'cerrado' },
    ];
    mockSingle.mockResolvedValueOnce({ data: cortesJunio, error: null });

    const resultado = await listarCortes({ desde: '2026-06-01', hasta: '2026-06-30' });

    expect(resultado).toHaveLength(2);
    expect(chain.gte).toHaveBeenCalledWith('fecha_apertura', '2026-06-01');
    expect(chain.lte).toHaveBeenCalledWith('fecha_apertura', '2026-06-30T23:59:59');
  });

  // ---------------------------------------------------------------------------
  // Sin filtros → devuelve todos sin gte/lte
  // ---------------------------------------------------------------------------
  test('HU-011-E1b · devuelve todos los cortes cuando no hay filtros de fecha', async () => {
    mockSingle.mockResolvedValueOnce({ data: [CORTE_ABIERTO], error: null });

    const resultado = await listarCortes();

    expect(resultado).toHaveLength(1);
    expect(chain.gte).not.toHaveBeenCalled();
    expect(chain.lte).not.toHaveBeenCalled();
  });
});

// =============================================================================
// obtenerCorte — HU-011 detalle
// =============================================================================
describe('obtenerCorte', () => {

  // ---------------------------------------------------------------------------
  // Corte existente → incluye array de ventas asociadas
  // ---------------------------------------------------------------------------
  test('retorna el corte con las ventas que tienen ese id_corte', async () => {
    const ventas = [
      { id_venta: 10, folio: 'VTA-20260624-0001', total: 350, estado: 'completada',
        metodo_pago: 'efectivo', fecha_hora: `${HOY}T09:00:00Z` },
    ];

    mockSingle
      .mockResolvedValueOnce({ data: CORTE_ABIERTO, error: null }) // select corte
      .mockResolvedValueOnce({ data: ventas,        error: null }); // select ventas

    const resultado = await obtenerCorte(1);

    expect(resultado.id_corte).toBe(1);
    expect(resultado.ventas).toHaveLength(1);
    expect(resultado.ventas[0].folio).toBe('VTA-20260624-0001');
  });

  // ---------------------------------------------------------------------------
  // Corte sin ventas → array vacío, no null
  // ---------------------------------------------------------------------------
  test('devuelve ventas como array vacío si el corte no tiene ventas', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: CORTE_ABIERTO, error: null })
      .mockResolvedValueOnce({ data: null,          error: null }); // sin filas

    const resultado = await obtenerCorte(1);
    expect(Array.isArray(resultado.ventas)).toBe(true);
    expect(resultado.ventas).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Corte inexistente → 404
  // ---------------------------------------------------------------------------
  test('lanza 404 si el id_corte no existe', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'no rows' } });

    const err = await obtenerCorte(999).catch((e) => e);
    expect(err.message).toBe('Corte no encontrado');
    expect(err.status).toBe(404);
  });
});
