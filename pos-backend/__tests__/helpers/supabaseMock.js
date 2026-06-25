/**
 * supabaseMock.js
 * Fábrica de mock encadenable para el cliente Supabase.
 *
 * El cliente real usa un patrón builder:
 *   supabase.from('tabla').select('*').eq('col', val).single()
 *
 * Esta fábrica reproduce esa interfaz de forma controlada.
 * Cada test configura la cola de respuestas con mockResolvedValueOnce,
 * lo que garantiza que las llamadas se consumen en orden y no hay
 * contaminación entre tests.
 *
 * Uso en cada archivo de test:
 *   const { mockSupabase, mockFrom, mockSingle, mockRpc } = crearMockSupabase();
 *   jest.unstable_mockModule('../../config/supabase.js', () => ({ supabase: mockSupabase }));
 */

import { jest } from '@jest/globals';

export function crearMockSupabase() {
  // Terminales — devuelven la promesa con el resultado configurado por el test
  const mockSingle      = jest.fn();
  const mockMaybeSingle = jest.fn();

  // Objeto encadenable — todos los métodos intermedios devuelven el mismo objeto
  // para soportar cualquier combinación de filtros del código real
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
    // Terminales
    single:      mockSingle,
    maybeSingle: mockMaybeSingle,
    // Permite que la cadena se resuelva como Promise directa
    // (cuando el código hace await supabase.from(...).update(...).is(...))
    then: (fn) => mockSingle().then(fn),
    catch: (fn) => mockSingle().catch(fn),
  };

  const mockFrom = jest.fn().mockReturnValue(chain);
  const mockRpc  = jest.fn();

  const mockSupabase = { from: mockFrom, rpc: mockRpc };

  // Limpia todos los contadores de llamadas sin borrar implementaciones
  function resetAll() {
    Object.values(chain).forEach((fn) => typeof fn?.mockClear === 'function' && fn.mockClear());
    mockFrom.mockClear();
    mockRpc.mockClear();
  }

  return { mockSupabase, mockFrom, mockSingle, mockMaybeSingle, mockRpc, chain, resetAll };
}
