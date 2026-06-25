export const ROL_CAJERO        = 'cajero';
export const ROL_ADMINISTRADOR = 'administrador';

export const tieneRol = (usuario, ...roles) => roles.includes(usuario?.rol);
