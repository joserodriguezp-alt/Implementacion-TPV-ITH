import client from './client.js';

export const abrirCorte   = (datos)     => client.post('/corte-caja', datos).then((r) => r.data.data);
export const cerrarCorte  = (id, datos) => client.put(`/corte-caja/${id}/cerrar`, datos, { responseType: 'blob' });
export const listarCortes = (params={}) => client.get('/corte-caja', { params }).then((r) => r.data.data);
export const obtenerCorte = (id)        => client.get(`/corte-caja/${id}`).then((r) => r.data.data);
