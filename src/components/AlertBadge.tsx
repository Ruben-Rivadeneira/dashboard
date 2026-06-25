import { AlertTriangle } from 'lucide-react';

interface AlertBadgeProps {
  nivel: 'verde' | 'amarillo' | 'rojo' | 'critico';
  texto?: string;
}

const nivelesConfig = {
  verde: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-400',
    icon: 'text-green-600 dark:text-green-400',
    pulse: false,
  },
  amarillo: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-400',
    icon: 'text-yellow-600 dark:text-yellow-400',
    pulse: false,
  },
  rojo: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-400',
    icon: 'text-red-600 dark:text-red-400',
    pulse: true,
  },
  critico: {
    bg: 'bg-red-200 dark:bg-red-900/50',
    text: 'text-red-900 dark:text-red-300',
    icon: 'text-red-700 dark:text-red-300',
    pulse: true,
  },
};

export default function AlertBadge({ nivel, texto }: AlertBadgeProps) {
  const config = nivelesConfig[nivel];

  return (
    <div
      className={`${config.bg} ${config.text} inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
        config.pulse ? 'animate-pulse' : ''
      }`}
    >
      {(nivel === 'rojo' || nivel === 'critico') && (
        <AlertTriangle className={`w-3.5 h-3.5 ${config.icon}`} />
      )}
      {texto && <span>{texto}</span>}
    </div>
  );
}
