import { X, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import type { ToastType } from '../context/DashboardContext';

const iconosMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

const coloresMap = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-500 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-500 dark:text-yellow-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-500 dark:text-red-400',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-500 dark:text-green-400',
  },
};

interface ToastItemProps {
  id: string;
  message: string;
  type: ToastType;
}

function ToastItem({ id, message, type }: ToastItemProps) {
  const { removeToast } = useDashboard();
  const colores = coloresMap[type];
  const Icono = iconosMap[type];

  return (
    <div
      className={`${colores.bg} ${colores.border} border rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-sm animate-in slide-in-from-right duration-300`}
      role="alert"
    >
      <Icono className={`w-5 h-5 flex-shrink-0 ${colores.icon}`} />
      <p className={`text-sm font-medium ${colores.text} flex-1`}>{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts } = useDashboard();

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} id={toast.id} message={toast.message} type={toast.type} />
      ))}
    </div>
  );
}
