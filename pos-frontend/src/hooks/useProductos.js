import { useState, useCallback } from 'react';
import { listarProductos, buscarPorBarcode } from '../api/productos.api.js';

export function useProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando,  setCargando]  = useState(false);
  const [error,     setError]     = useState(null);

  const buscar = useCallback(async (texto = '') => {
    setCargando(true);
    setError(null);
    try {
      const data = await listarProductos(texto);
      setProductos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  const buscarBarcode = useCallback(async (codigo) => {
    setCargando(true);
    setError(null);
    try {
      return await buscarPorBarcode(codigo);
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  return { productos, cargando, error, buscar, buscarBarcode };
}
