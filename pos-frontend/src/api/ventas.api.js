import client from './client.js';

export const crearVenta       = (datos)       => client.post('/ventas', datos).then((r) => r.data.data);
export const listarVentas     = (params = {}) => client.get('/ventas', { params }).then((r) => r.data.data);
export const obtenerVenta     = (id)          => client.get(`/ventas/${id}`).then((r) => r.data.data);
export const cancelarVenta    = (id, motivo)  => client.post(`/ventas/${id}/cancelar`, { motivo }).then((r) => r.data.data);
export const urlTicketPDF     = (id)          => `${import.meta.env.VITE_API_URL || '/api'}/ventas/${id}/ticket`;
