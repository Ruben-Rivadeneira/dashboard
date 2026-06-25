import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  titulo: string;
  valor: string | number;
  icono: ReactNode;
  colorEstado: 'verde' | 'amarillo' | 'rojo' | 'neutro';
  subtitulo?: string;
  tendencia?: 'subiendo' | 'bajando' | 'estable';
}

const coloresMap = {
  verde: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-400',
    value: 'text-green-800 dark:text-green-300',
    icon: 'bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400',
  },
  amarillo: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-400',
    value: 'text-yellow-800 dark:text-yellow-300',
    icon: 'bg-yellow-100 dark:bg-yellow-800/50 text-yellow-600 dark:text-yellow-400',
  },
  rojo: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-400',
    value: 'text-red-800 dark:text-red-300',
    icon: 'bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-400',
  },
  neutro: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-500 dark:text-gray-400',
    value: 'text-gray-900 dark:text-white',
    icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  },
};

export default function KPICard({
  titulo,
  valor,
  icono,
  colorEstado,
  subtitulo,
  tendencia,
}: KPICardProps) {
  const colores = coloresMap[colorEstado];
  const TendenciaIcon = tendencia === 'subiendo' ? TrendingUp : tendencia === 'bajando' ? TrendingDown : Minus;

  return (
    <div
      className={`${colores.bg} ${colores.border} border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        {/* Icono */}
        <div className={`${colores.icon} w-12 h-12 rounded-xl flex items-center justify-center`}>
          {icono}
        </div>

        {/* Tendencia */}
        {tendencia && (
          <div
            className={`flex items-center gap-1 ${
              tendencia === 'subiendo'
                ? 'text-green-500'
                : tendencia === 'bajando'
                  ? 'text-red-500'
                  : 'text-gray-500'
            }`}
          >
            <TendenciaIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Valor principal */}
      <div className="mt-4">
        <span className={`text-3xl font-bold font-mono ${colores.value}`}>{valor}</span>
      </div>

      {/* Título y subtítulo */}
      <div className="mt-2">
        <h3 className={`text-sm font-medium ${colores.text}`}>{titulo}</h3>
        {subtitulo && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitulo}</p>}
      </div>
    </div>
  );
}
