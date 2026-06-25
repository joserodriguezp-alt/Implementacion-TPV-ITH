import toast from 'react-hot-toast';

// Notificaciones estandarizadas — usan react-hot-toast
export const notifySuccess = (msg) => toast.success(msg);
export const notifyError   = (msg) => toast.error(msg);
export const notifyWarning = (msg) => toast(msg, { icon: '⚠️' });
