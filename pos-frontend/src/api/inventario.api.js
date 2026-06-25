import client from './client.js';

export const listarInventario  = (params = {}) => client.get('/inventario', { params }).then((r) => r.data.data);
export const registrarEntrada  = (datos)        => client.post('/inventario/entrada', datos).then((r) => r.data.data);
export const listarMovimientos = (params = {})  => client.get('/inventario/movimientos', { params }).then((r) => r.data.data);
