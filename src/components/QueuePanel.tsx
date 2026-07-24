import { useRef, useEffect, useState } from 'react';
import { Phone, AlertTriangle, Clock } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { formatearTiempo } from '../utils/formatTime';
import { evaluarTiempoEspera, colorToBadgeClass } from '../utils/thresholds';
import type { LlamadaEnCola } from '../hooks/useCallCenterSocket';

// Componente de fila de llamada con cronómetro en vivo
function LlamadaFila({ llamada, orden }: { llamada: LlamadaEnCola; orden: number }) {
  const [segundos, setSegundos] = useState(llamada.waitSeconds);
  const rafRef = useRef<number | null>(null);
  const inicioRef = useRef<number>(Date.now() - llamada.waitSeconds * 1000);

  useEffect(() => {
    const actualizar = () => {
      const ahora = Date.now();
      const nuevosSegundos = Math.floor((ahora - inicioRef.current) / 1000);
      setSegundos(nuevosSegundos);
      rafRef.current = requestAnimationFrame(actualizar);
    };

    rafRef.current = requestAnimationFrame(actualizar);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Actualizar cuando cambie la llamada
  useEffect(() => {
    inicioRef.current = Date.now() - llamada.waitSeconds * 1000;
    setSegundos(llamada.waitSeconds);
  }, [llamada.waitSeconds, llamada.id]);

  const colorEstado = evaluarTiempoEspera(segundos);
  const badgeClass = colorToBadgeClass(colorEstado);
  const esCritica = segundos > 45;

  // Determinar urgencia
  const urgencia =
    segundos > 60 ? 'Crítica' : segundos > 45 ? 'Urgente' : segundos > 30 ? 'Moderada' : 'Normal';

  const urgenciaClass =
    urgencia === 'Crítica'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      : urgencia === 'Urgente'
        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
        : urgencia === 'Moderada'
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';

  return (
    <div
      className={`flex items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 transition-all ${
        esCritica ? 'animate-pulse-fast bg-red-50 dark:bg-red-900/10' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Orden y estado */}
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
            #{orden}
          </span>
          {esCritica && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
        </div>

        {/* Icono de teléfono */}
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>

        {/* ID de llamada */}
        <div>
          <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">
            {llamada.id}
          </span>
        </div>
      </div>

      {/* Tiempo de espera y urgencia */}
      <div className="flex items-center gap-4">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${urgenciaClass}`}>
          {urgencia}
        </span>
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${badgeClass.split(' ')[1]}`} />
          <span className={`font-mono font-medium ${badgeClass.split(' ')[1]}`}>
            {formatearTiempo(segundos)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function QueuePanel() {
  const { queue } = useDashboard();

  // Ordenar por tiempo descendente (la más antigua primero)
  const colaOrdenada = [...queue].sort((a, b) => a.waitSeconds - b.waitSeconds);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cola de Espera</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {queue.length === 0 ? 'Sin llamadas en espera' : `${queue.length} llamadas en cola`}
          </p>
        </div>
        {queue.length > 3 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Cola alta
            </span>
          </div>
        )}
      </div>

      {/* Lista de llamadas */}
      <div className="flex-1 overflow-y-auto">
        {colaOrdenada.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Phone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No hay llamadas en cola</p>
          </div>
        ) : (
          colaOrdenada.map((llamada, index) => (
            <LlamadaFila key={llamada.id} llamada={llamada} orden={index + 1} />
          ))
        )}
      </div>
    </div>
  );
}
