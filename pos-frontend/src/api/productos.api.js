import client from './client.js';

export const listarProductos   = (q)      => client.get('/productos', { params: q ? { q } : {} }).then((r) => r.data.data);
export const obtenerProducto   = (id)     => client.get(`/productos/${id}`).then((r) => r.data.data);
export const buscarPorBarcode  = (codigo) => client.get(`/productos/barcode/${encodeURIComponent(codigo)}`).then((r) => r.data.data);
export const crearProducto     = (datos)  => client.post('/productos', datos).then((r) => r.data.data);
export const actualizarProducto= (id, d)  => client.put(`/productos/${id}`, d).then((r) => r.data.data);
