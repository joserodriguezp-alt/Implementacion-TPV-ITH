import { Toaster } from 'react-hot-toast';
import { AppRouter } from './router/AppRouter.jsx';

// Punto de entrada de la aplicación — monta el router y el sistema de notificaciones (TASK-F006)
export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: '14px', maxWidth: '380px' },
          success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />
    </>
  );
}
