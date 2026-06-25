import { Timer, Hourglass, Clock, CheckCircle2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { formatearTiempo, formatearPorcentaje } from '../utils/formatTime';
import SLAGauge from './SLAGauge';

interface MetricCardProps {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
  descripcion?: string;
}

function MetricCard({ titulo, valor, icono, descripcion }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          {icono}
        </div>
      </div>
      <div className="mt-4">
        <span className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{valor}</span>
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{titulo}</h3>
        {descripcion && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{descripcion}</p>
        )}
      </div>
    </div>
  );
}

export default function MetricsPanel() {
  const { metrics } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Panel de SLA */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Nivel de Servicio (SLA 80/20)
          </h3>
          <SLAGauge valor={metrics.serviceLevel} size={220} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center max-w-xs">
            Meta: 80% de las llamadas atendidas en menos de 20 segundos
          </p>
        </div>
      </div>

      {/* Métricas de tiempo */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Métricas de Tiempo
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            titulo="AHT"
            valor={formatearTiempo(metrics.aht)}
            icono={<Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            descripcion="Duración promedio de llamada"
          />
          <MetricCard
            titulo="AWT"
            valor={formatearTiempo(metrics.awt)}
            icono={<Hourglass className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            descripcion="Tiempo promedio de espera"
          />
          <MetricCard
            titulo="ACW"
            valor={formatearTiempo(metrics.acw)}
            icono={<Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
            descripcion="Tiempo post-llamada"
          />
          <MetricCard
            titulo="FCR"
            valor={formatearPorcentaje(metrics.fcr)}
            icono={<CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
            descripcion="Resolución al primer contacto"
          />
        </div>
      </div>

      {/* Distribución de llamadas */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distribución de Llamadas
        </h3>
        <div className="space-y-4">
          {/* Barras de progreso */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Inbound activas</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">
                {metrics.activeInbound}
              </span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((metrics.activeInbound / 15) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Outbound activas</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">
                {metrics.activeOutbound}
              </span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((metrics.activeOutbound / 10) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Ocupación</span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">
                {formatearPorcentaje(metrics.ocupacion || 0, 0)}
              </span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-yellow-400 rounded-full transition-all duration-500"
                style={{
                  width: `${(metrics.ocupacion || 0) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
