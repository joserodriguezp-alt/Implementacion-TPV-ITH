import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

// Pantalla de acceso denegado — mostrada cuando el rol no tiene permiso (TASK-F031)
export function SinAcceso() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <span className="text-6xl">🔒</span>
      <h1 className="text-xl font-bold text-gray-900">Sin acceso</h1>
      <p className="text-sm text-gray-500">No tienes permisos para ver esta sección.</p>
      <Button onClick={() => navigate('/ventas')}>Volver a Ventas</Button>
    </div>
  );
}
