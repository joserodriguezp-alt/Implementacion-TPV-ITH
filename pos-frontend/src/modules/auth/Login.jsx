import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '../../api/auth.api.js';
import { useAuthStore } from '../../store/auth.store.js';
import { notifyError } from '../../utils/notify.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input }  from '../../components/ui/Input.jsx';

const schema = z.object({
  email:    z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export function Login() {
  const [cargando, setCargando] = useState(false);
  const iniciarSesion = useAuthStore((s) => s.iniciarSesion);
  const navigate      = useNavigate();
  const location      = useLocation();
  const destino       = location.state?.desde?.pathname || '/ventas';

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit({ email, password }) {
    setCargando(true);
    try {
      const { token, usuario } = await login(email, password);
      iniciarSesion(token, usuario);
      navigate(destino, { replace: true });
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Panel izquierdo institucional ── */}
      <div className="hidden md:flex w-[44%] bg-sidebar flex-col relative overflow-hidden">
        {/* Gradiente decorativo en la esquina */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-sidebar to-sidebar" />

        {/* Círculos de acento */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full border-[48px] border-brand-600/20" />
        <div className="absolute bottom-24 left-[-50px] w-52 h-52 rounded-full border-[32px] border-emerald-500/10" />
        <div className="absolute bottom-[-40px] right-20 w-32 h-32 rounded-full border-[24px] border-brand-500/15" />

        {/* Contenido del panel */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo superior */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 5m11.4 0H7"/>
              </svg>
            </div>
            <span className="text-white/80 text-sm font-semibold tracking-wide">Sistema POS</span>
          </div>

          {/* Texto principal */}
          <div className="pb-12">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-brand-400 mb-4">
              Punto de venta
            </p>
            <h1 className="text-5xl font-bold text-white leading-[1.08] mb-4 tracking-tight">
              Papelería
            </h1>
            <p className="text-sm text-sidebar-text leading-relaxed max-w-xs">
              Gestiona ventas, inventario y corte de caja desde un solo lugar.
            </p>

            {/* Chips de características */}
            <div className="flex flex-wrap gap-2 mt-7">
              {['Ventas rápidas', 'Control de stock', 'Corte de caja'].map((label) => (
                <span key={label} className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-full border border-white/10">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F1F4F9]">
        <div className="w-full max-w-sm">
          {/* Card del formulario */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Bienvenido</h2>
              <p className="text-sm text-gray-500">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input
                id="email"
                label="Correo electrónico"
                type="email"
                placeholder="usuario@papeleria.local"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                id="password"
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />

              <Button type="submit" size="lg" cargando={cargando} className="w-full mt-2">
                {cargando ? 'Verificando…' : 'Entrar al sistema'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            POS Papelería · Acceso restringido al personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
