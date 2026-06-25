import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';

// Autentica al usuario y devuelve JWT + datos públicos
export async function login(email, password) {
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre, email, rol, password_hash, activo')
    .eq('email', email)
    .single();

  if (error || !usuario) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  if (!usuario.activo) {
    throw Object.assign(new Error('Usuario inactivo'), { status: 403 });
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  const token = jwt.sign(
    { id: usuario.id_usuario, rol: usuario.rol, nombre: usuario.nombre },
    env.JWT_SECRET,
    { expiresIn: '10h' }
  );

  return {
    token,
    usuario: { id: usuario.id_usuario, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  };
}

// Devuelve todos los usuarios sin exponer password_hash
export async function listarUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre, email, rol, activo, creado_en')
    .order('nombre');

  if (error) throw new Error(error.message);
  return data;
}
