/**
 * __tests__/ventas.service.test.js
 *
 * Pruebas de integración — módulo Ventas
 * Escenarios cubiertos del spec.md:
 *   HU-004 · Registrar una venta     (E1, E2, E3)
 *   HU-005 · Aplicar descuento       (E1, E2)
 *   HU-006 · Cancelar / devolver     (E1, E2)
 *
 * Convenciones (skill-ith-backend.md):
 *   - Variables y funciones: inglés camelCase
 *   - Comentarios: español
 *   - Sin conexión real a Supabase: todo interceptado con jest.mock()
 *
 * Cómo funciona el mock con ESM + Babel:
 *   Babel transforma import → require antes de que Jest ejecute el archivo.
 *   jest.mock() registra la sustitución ANTES de que se cargue el módulo
 *   bajo prueba, por lo que supabase.js ya llega mockeado al service.
 */

// ─── Mock de Supabase ──────────────────────────────────────────────────────────
// Debe declararse ANTES del require del módulo bajo prueba.
// jest.mock() hace hoisting automático al tope del archivo.

// Funciones terminales que cada prueba configura con mockResolvedValueOnce
const mockSingle      = jest.fn();
const mockMaybeSingle = jest.fn();
const mockRpc         = jest.fn();

// Cadena encadenable que replica la API del cliente real de Supabase.
// Todos los métodos intermedios (select, eq, in, …) devuelven 'chain'
// para soportar cualquier filtro que use el service.
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
  // Terminales: resuelven la promesa con el resultado configurado por el test
  single:      mockSingle,
  maybeSingle: mockMaybeSingle,
  // Permite await directo sobre la cadena (sin .single()) cuando el service
  // no termina con .single() — p.ej. insert de detalle o movimientos
  then:  (fn) => Promise.resolve(mockSingle()).then(fn),
  catch: (fn) => Promise.resolve(mockSingle()).catch(fn),
};

const mockFrom = jest.fn().mockReturnValue(chain);

jest.mock('../src/config/supabase.js', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    rpc:  (...args) => mockRpc(...args),
  },
}));

// El generador de folio es determinista en tests
jest.mock('../src/utils/folio.generator.js', () => ({
  generarFolio: jest.fn().mockResolvedValue('VTA-20260624-0001'),
}));

// ─── Import del módulo bajo prueba ────────────────────────────────────────────
// Babel ya transformó los import del service a require, por lo que los mocks
// declarados arriba están activos cuando este require se ejecuta.
const {
  crearVenta,
  cancelarVenta,
  procesarDevolucion,
} = require('../src/modules/ventas/ventas.service.js');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PRODUCTO_OK = {
  id_producto:  1,
  nombre:       'Cuaderno universitario',
  precio_venta: 35.00,
  stock_actual: 10,
};

const PRODUCTO_AGOTADO = {
  id_producto:  2,
  nombre:       'Bolígrafo azul',
  precio_venta: 8.50,
  stock_actual: 0,
};

const PRODUCTO_STOCK_2 = {
  id_producto:  3,
  nombre:       'Lápiz HB',
  precio_venta: 5.00,
  stock_actual: 2,
};

const ID_CAJERO = 1;

const CABECERA_VENTA = {
  id_venta:       100,
  folio:          'VTA-20260624-0001',
  subtotal:       70.00,
  descuento:      0,
  total:          70.00,
  cambio:         30.00,
  metodo_pago:    'efectivo',
  monto_recibido: 100,
  estado:         'completada',
};

// Limpia contadores entre pruebas (clearMocks: true en jest.config.js también lo hace)
beforeEach(() => {
  jest.clearAllMocks();
  mockRpc.mockResolvedValue({ data: null, error: null });
});

// =============================================================================
// crearVenta
// =============================================================================
describe('crearVenta', () => {

  // ---------------------------------------------------------------------------
  // HU-004 · Escenario 1 — Venta completada con éxito
  //
  // Given: cajero tiene en el carrito 2 cuadernos con stock disponible (10)
  // When:  confirma la venta con pago en efectivo y monto_recibido = $100
  // Then:  la venta queda registrada con folio, total $70 y cambio $30,
  //        y se invoca el RPC decrementar_stock con los parámetros correctos
  // ---------------------------------------------------------------------------
  test('HU-004-E1 · registra venta con stock disponible y devuelve folio y cambio', async () => {
    // Secuencia de respuestas de Supabase que el service consume en orden:
    mockSingle
      // 1ª → select de productos para verificar stock
      .mockResolvedValueOnce({ data: [PRODUCTO_OK], error: null })
      // 2ª → insert cabecera de venta
      .mockResolvedValueOnce({ data: CABECERA_VENTA, error: null })
      // 3ª → insert detalle_venta (resuelto vía .then)
      .mockResolvedValueOnce({ data: null, error: null });

    const resultado = await crearVenta(
      { items: [{ id_producto: 1, cantidad: 2 }], metodo_pago: 'efectivo', monto_recibido: 100, descuento: 0 },
      ID_CAJERO
    );

    expect(resultado.folio).toBe('VTA-20260624-0001');
    expect(resultado.total).toBe(70.00);
    expect(resultado.cambio).toBe(30.00);
    expect(resultado.estado).toBe('completada');

    // El RPC debe haberse llamado con los parámetros exactos del schema
    expect(mockRpc).toHaveBeenCalledWith('decrementar_stock', {
      p_id_producto: 1,
      p_cantidad:    2,
    });
  });

  // ---------------------------------------------------------------------------
  // HU-004 · Escenario 3 — Producto con stock en cero
  //
  // Given: bolígrafo con stock_actual = 0 en catálogo
  // When:  cajero intenta agregar 1 unidad a la venta
  // Then:  el service lanza error con el mensaje exacto que incluye el nombre
  //        del producto y el stock disponible; el RPC nunca se invoca
  // ---------------------------------------------------------------------------
  test('HU-004-E3 · lanza error cuando el stock del producto es 0', async () => {
    mockSingle.mockResolvedValueOnce({ data: [PRODUCTO_AGOTADO], error: null });

    await expect(
      crearVenta({ items: [{ id_producto: 2, cantidad: 1 }], metodo_pago: 'efectivo' }, ID_CAJERO)
    ).rejects.toThrow('Stock insuficiente para "Bolígrafo azul": disponible 0');

    // No se debe intentar decrementar stock si no hay existencias
    expect(mockRpc).not.toHaveBeenCalledWith('decrementar_stock', expect.anything());
  });

  // ---------------------------------------------------------------------------
  // HU-004 · Escenario 3 variante — Cantidad solicitada supera el stock
  //
  // Given: lápiz con stock_actual = 2
  // When:  cajero solicita 5 unidades
  // Then:  error con el disponible exacto (2); la venta no se registra
  // ---------------------------------------------------------------------------
  test('HU-004-E3b · lanza error cuando la cantidad pedida supera el stock disponible', async () => {
    mockSingle.mockResolvedValueOnce({ data: [PRODUCTO_STOCK_2], error: null });

    await expect(
      crearVenta({ items: [{ id_producto: 3, cantidad: 5 }], metodo_pago: 'tarjeta' }, ID_CAJERO)
    ).rejects.toThrow('Stock insuficiente para "Lápiz HB": disponible 2');

    expect(mockRpc).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // HU-004 · Cálculo de totales con múltiples productos
  //
  // Given: carrito con cuaderno (35×2=70) y lápiz (5×3=15) → subtotal=85
  // When:  cajero paga $100 en efectivo
  // Then:  cambio = $15.00 calculado al centavo
  // ---------------------------------------------------------------------------
  test('HU-004-E1b · calcula subtotal y cambio correctamente con múltiples líneas', async () => {
    const productos = [
      { id_producto: 1, nombre: 'Cuaderno', precio_venta: 35, stock_actual: 10 },
      { id_producto: 3, nombre: 'Lápiz',    precio_venta: 5,  stock_actual: 10 },
    ];

    mockSingle
      .mockResolvedValueOnce({ data: productos, error: null })
      .mockResolvedValueOnce({
        data: { ...CABECERA_VENTA, subtotal: 85, total: 85, cambio: 15 },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const resultado = await crearVenta(
      {
        items: [{ id_producto: 1, cantidad: 2 }, { id_producto: 3, cantidad: 3 }],
        metodo_pago:    'efectivo',
        monto_recibido: 100,
        descuento:      0,
      },
      ID_CAJERO
    );

    // toBeCloseTo evita errores de punto flotante (p.ej. 85.00000001)
    expect(resultado.subtotal).toBeCloseTo(85, 2);
    expect(resultado.cambio).toBeCloseTo(15, 2);
  });

  // ---------------------------------------------------------------------------
  // HU-004 · Escenario 2 — Monto de pago insuficiente
  //
  // Given: total de la venta = $35, monto_recibido = $20
  // When:  se confirma la venta en efectivo
  // Then:  cambio = 0 (el service no bloquea; la validación de suficiencia
  //        es responsabilidad del frontend — el service registra cambio = 0)
  // ---------------------------------------------------------------------------
  test('HU-004-E2 · cambio es 0 cuando monto_recibido es menor al total', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: [PRODUCTO_OK], error: null })
      .mockResolvedValueOnce({
        data: { ...CABECERA_VENTA, total: 35, cambio: 0, monto_recibido: 20 },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const resultado = await crearVenta(
      { items: [{ id_producto: 1, cantidad: 1 }], metodo_pago: 'efectivo', monto_recibido: 20 },
      ID_CAJERO
    );

    expect(resultado.cambio).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // HU-005 · Escenario 1 — Descuento ≤ 20% sin autorizador
  //
  // Given: subtotal = $100, descuento = $15 (15%)
  // When:  cajero aplica el descuento sin id_autorizador
  // Then:  la venta se procesa; total = $85
  // ---------------------------------------------------------------------------
  test('HU-005-E1 · aplica descuento ≤20% sin requerir id_autorizador', async () => {
    const prod = { id_producto: 1, nombre: 'P', precio_venta: 100, stock_actual: 5 };

    mockSingle
      .mockResolvedValueOnce({ data: [prod], error: null })
      .mockResolvedValueOnce({
        data: { ...CABECERA_VENTA, subtotal: 100, descuento: 15, total: 85 },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const resultado = await crearVenta(
      { items: [{ id_producto: 1, cantidad: 1 }], metodo_pago: 'efectivo', monto_recibido: 100, descuento: 15 },
      ID_CAJERO
    );

    expect(resultado.total).toBe(85);
  });

  // ---------------------------------------------------------------------------
  // HU-005 · Escenario 2 — Descuento > 20% sin autorizador → error
  //
  // Given: subtotal = $100, descuento = $25 (25%)
  // When:  cajero intenta aplicarlo sin id_autorizador
  // Then:  error con el mensaje exacto del spec
  // ---------------------------------------------------------------------------
  test('HU-005-E2 · rechaza descuento >20% cuando no hay id_autorizador', async () => {
    const prod = { id_producto: 1, nombre: 'P', precio_venta: 100, stock_actual: 5 };
    mockSingle.mockResolvedValueOnce({ data: [prod], error: null });

    await expect(
      crearVenta(
        { items: [{ id_producto: 1, cantidad: 1 }], metodo_pago: 'efectivo', descuento: 25 },
        ID_CAJERO
      )
    ).rejects.toThrow('Descuentos mayores al 20% requieren id_autorizador con rol administrador');
  });

  // ---------------------------------------------------------------------------
  // HU-005 · Autorizador con rol incorrecto → error
  //
  // Given: id_autorizador = 99, usuario 99 tiene rol 'cajero'
  // When:  se intenta aplicar descuento >20% con ese autorizador
  // Then:  error "El autorizador debe tener rol administrador"
  // ---------------------------------------------------------------------------
  test('HU-005-E2b · rechaza autorizador cuyo rol no es administrador', async () => {
    const prod = { id_producto: 1, nombre: 'P', precio_venta: 100, stock_actual: 5 };
    mockSingle
      .mockResolvedValueOnce({ data: [prod], error: null })        // select productos
      .mockResolvedValueOnce({ data: { rol: 'cajero' }, error: null }); // select autorizador

    await expect(
      crearVenta(
        { items: [{ id_producto: 1, cantidad: 1 }], metodo_pago: 'efectivo', descuento: 25, id_autorizador: 99 },
        ID_CAJERO
      )
    ).rejects.toThrow('El autorizador debe tener rol administrador');
  });
});

// =============================================================================
// cancelarVenta — HU-006 · Escenario 1
// =============================================================================
describe('cancelarVenta', () => {

  // ---------------------------------------------------------------------------
  // HU-006 · Escenario 1 — Cancelación exitosa
  //
  // Given: administrador localiza venta con estado 'completada'
  // When:  ejecuta cancelarVenta
  // Then:  estado pasa a 'cancelada', el RPC incrementa el stock y se
  //        registra el movimiento de tipo 'ajuste'
  // ---------------------------------------------------------------------------
  test('HU-006-E1 · cancela venta completada y reintegra el stock vía RPC', async () => {
    const ventaOriginal = {
      id_venta:      100,
      folio:         'VTA-20260624-0001',
      estado:        'completada',
      detalle_venta: [{ id_producto: 1, cantidad: 2 }],
    };

    mockSingle
      // obtenerVenta
      .mockResolvedValueOnce({ data: ventaOriginal, error: null })
      // obtenerStockActual (stock antes del reintegro)
      .mockResolvedValueOnce({ data: { stock_actual: 8 }, error: null })
      // insert movimiento_inventario
      .mockResolvedValueOnce({ data: null, error: null })
      // update ventas → 'cancelada'
      .mockResolvedValueOnce({ data: { ...ventaOriginal, estado: 'cancelada' }, error: null });

    const resultado = await cancelarVenta(100, ID_CAJERO);

    expect(resultado.estado).toBe('cancelada');
    expect(mockRpc).toHaveBeenCalledWith('incrementar_stock', {
      p_id_producto: 1,
      p_cantidad:    2,
    });
  });

  // ---------------------------------------------------------------------------
  // HU-006 · Cancelar una venta ya cancelada → error
  //
  // Given: venta con estado = 'cancelada'
  // When:  se intenta cancelar de nuevo
  // Then:  error "La venta ya está cancelada"; el RPC nunca se llama
  // ---------------------------------------------------------------------------
  test('HU-006-E1b · rechaza cancelar una venta que ya está cancelada', async () => {
    const ventaCancelada = {
      id_venta: 200, folio: 'VTA-20260624-0002',
      estado: 'cancelada', detalle_venta: [],
    };
    mockSingle.mockResolvedValueOnce({ data: ventaCancelada, error: null });

    await expect(cancelarVenta(200, ID_CAJERO)).rejects.toThrow('La venta ya está cancelada');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Venta inexistente → 404
  // ---------------------------------------------------------------------------
  test('lanza error 404 si la venta no existe en la base de datos', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'no rows' } });

    const err = await cancelarVenta(999, ID_CAJERO).catch((e) => e);
    expect(err.message).toBe('Venta no encontrada');
    expect(err.status).toBe(404);
  });
});

// =============================================================================
// procesarDevolucion — HU-006 · Escenario 2
// =============================================================================
describe('procesarDevolucion', () => {

  // ---------------------------------------------------------------------------
  // HU-006 · Escenario 2 — Devolución parcial exitosa
  //
  // Given: venta con 3 cuadernos y 2 bolígrafos; cliente devuelve 1 cuaderno
  // When:  administrador procesa la devolución
  // Then:  solo el stock del cuaderno se reintegra; bolígrafo no se toca;
  //        estado de la venta queda 'devolucion'
  // ---------------------------------------------------------------------------
  test('HU-006-E2 · reintegra solo los artículos devueltos en devolución parcial', async () => {
    const ventaOriginal = {
      id_venta: 100, folio: 'VTA-20260624-0001', estado: 'completada',
      detalle_venta: [
        { id_producto: 1, cantidad: 3, precio_unitario: 35 },
        { id_producto: 2, cantidad: 2, precio_unitario: 8.50 },
      ],
    };

    mockSingle
      .mockResolvedValueOnce({ data: ventaOriginal,                          error: null }) // obtenerVenta
      .mockResolvedValueOnce({ data: { stock_actual: 7 },                    error: null }) // obtenerStockActual prod 1
      .mockResolvedValueOnce({ data: null,                                   error: null }) // insert movimiento
      .mockResolvedValueOnce({ data: { ...ventaOriginal, estado: 'devolucion' }, error: null }); // update

    const resultado = await procesarDevolucion(100, [{ id_producto: 1, cantidad: 1 }], ID_CAJERO);

    expect(resultado.estado).toBe('devolucion');
    // Solo el producto 1 debe haber incrementado stock
    expect(mockRpc).toHaveBeenCalledWith('incrementar_stock', { p_id_producto: 1, p_cantidad: 1 });
    expect(mockRpc).not.toHaveBeenCalledWith('incrementar_stock', {
      p_id_producto: 2, p_cantidad: expect.anything(),
    });
  });

  // ---------------------------------------------------------------------------
  // Devolver más unidades de las compradas → error
  // ---------------------------------------------------------------------------
  test('HU-006-E2b · rechaza devolver más unidades que las que figuran en la venta', async () => {
    const ventaOriginal = {
      id_venta: 100, folio: 'VTA-20260624-0001', estado: 'completada',
      detalle_venta: [{ id_producto: 1, cantidad: 2, precio_unitario: 35 }],
    };
    mockSingle.mockResolvedValueOnce({ data: ventaOriginal, error: null });

    await expect(
      procesarDevolucion(100, [{ id_producto: 1, cantidad: 5 }], ID_CAJERO)
    ).rejects.toThrow('Cantidad a devolver (5) supera la vendida (2)');
  });

  // ---------------------------------------------------------------------------
  // Producto que no está en la venta → error
  // ---------------------------------------------------------------------------
  test('rechaza devolver un producto que no pertenece a la venta original', async () => {
    const ventaOriginal = {
      id_venta: 100, folio: 'VTA-20260624-0001', estado: 'completada',
      detalle_venta: [{ id_producto: 1, cantidad: 2, precio_unitario: 35 }],
    };
    mockSingle.mockResolvedValueOnce({ data: ventaOriginal, error: null });

    await expect(
      procesarDevolucion(100, [{ id_producto: 99, cantidad: 1 }], ID_CAJERO)
    ).rejects.toThrow('Producto 99 no pertenece a esta venta');
  });

  // ---------------------------------------------------------------------------
  // No se puede devolver una venta cancelada
  // ---------------------------------------------------------------------------
  test('rechaza devolución sobre una venta en estado cancelada', async () => {
    const ventaCancelada = {
      id_venta: 100, folio: 'VTA-20260624-0001', estado: 'cancelada', detalle_venta: [],
    };
    mockSingle.mockResolvedValueOnce({ data: ventaCancelada, error: null });

    await expect(
      procesarDevolucion(100, [{ id_producto: 1, cantidad: 1 }], ID_CAJERO)
    ).rejects.toThrow('No se puede devolver una venta cancelada');
  });
});
