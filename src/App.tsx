import { Phone, Users, AlertTriangle, TrendingUp, Clock, UserCheck } from 'lucide-react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import Header from './components/Header';
import KPICard from './components/KPICard';
import AgentsTable from './components/AgentsTable';
import QueuePanel from './components/QueuePanel';
import MetricsPanel from './components/MetricsPanel';
import ConfigPanel from './components/ConfigPanel';
import Toast from './components/Toast';
import { formatearTiempo, formatearPorcentaje, formatearNumero } from './utils/formatTime';
import {
  evaluarCola,
  evaluarAbandono,
  evaluarSLA,
  evaluarTiempoEspera,
  evaluarAgentesDisponibles,
  evaluarOcupacion,
} from './utils/thresholds';

function DashboardContent() {
  const { vistaActiva, agents, queue, metrics } = useDashboard();

  const agentesDisponibles = agents.filter((a) => a.status === 'disponible').length;
  const maxTiempoEspera = queue.length > 0 ? Math.max(...queue.map((l) => l.waitSeconds)) : 0;

  if (vistaActiva === 'dashboard') {
    return (
      <div className="flex-1 overflow-auto p-6 bg-pattern">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Indicadores Clave
            </h2>
            <div className="grid grid-cols-4 xl:grid-cols-5 gap-4">
              <KPICard
                titulo="Llamadas en cola"
                valor={queue.length}
                icono={<Phone className="w-6 h-6" />}
                colorEstado={evaluarCola(queue.length)}
              />
              <KPICard
                titulo="Inbound activas"
                valor={metrics.activeInbound}
                icono={<Phone className="w-6 h-6" />}
                colorEstado="neutro"
              />
              <KPICard
                titulo="Outbound activas"
                valor={metrics.activeOutbound}
                icono={<Phone className="w-6 h-6" />}
                colorEstado="neutro"
              />
              <KPICard
                titulo="Atendidas hoy"
                valor={formatearNumero(metrics.callsAnsweredInbound ?? metrics.callsAnswered)}
                icono={<UserCheck className="w-6 h-6" />}
                colorEstado="neutro"
                subtitulo={`${formatearNumero(metrics.callsAbandoned)} abandonadas`}
              />
              <KPICard
                titulo="Realizadas hoy"
                valor={formatearNumero(metrics.callsAnsweredOutbound ?? 0)}
                icono={<Phone className="w-6 h-6" />}
                colorEstado="neutro"
                subtitulo="Outbound completadas"
              />
              <KPICard
                titulo="Tasa de abandono"
                valor={formatearPorcentaje(metrics.abandonment)}
                icono={<AlertTriangle className="w-6 h-6" />}
                colorEstado={evaluarAbandono(metrics.abandonment)}
              />
              <KPICard
                titulo="Nivel de servicio"
                valor={formatearPorcentaje(metrics.serviceLevel, 0)}
                icono={<TrendingUp className="w-6 h-6" />}
                colorEstado={evaluarSLA(metrics.serviceLevel)}
                subtitulo="SLA 80/20"
              />
              <KPICard
                titulo="Mayor espera"
                valor={formatearTiempo(maxTiempoEspera)}
                icono={<Clock className="w-6 h-6" />}
                colorEstado={evaluarTiempoEspera(maxTiempoEspera)}
                subtitulo="Llamada más antigua"
              />
              <KPICard
                titulo="Agentes disponibles"
                valor={agentesDisponibles}
                icono={<Users className="w-6 h-6" />}
                colorEstado={evaluarAgentesDisponibles(agentesDisponibles)}
                subtitulo={`de ${agents.length} total`}
              />
              <KPICard
                titulo="Ocupación"
                valor={formatearPorcentaje(metrics.ocupacion || 0, 0)}
                icono={<Users className="w-6 h-6" />}
                colorEstado={evaluarOcupacion(metrics.ocupacion || 0)}
                subtitulo="del equipo"
              />
            </div>
          </section>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1">
              <QueuePanel />
            </div>
            <div className="col-span-2">
              <AgentsTable />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (vistaActiva === 'agentes') {
    return (
      <div className="flex-1 overflow-auto p-6 bg-pattern">
        <div className="max-w-[1400px] mx-auto">
          <AgentsTable />
        </div>
      </div>
    );
  }

  if (vistaActiva === 'cola') {
    return (
      <div className="flex-1 overflow-auto p-6 bg-pattern">
        <div className="max-w-[800px] mx-auto">
          <QueuePanel />
        </div>
      </div>
    );
  }

  if (vistaActiva === 'metricas') {
    return (
      <div className="flex-1 overflow-auto p-6 bg-pattern">
        <div className="max-w-[900px] mx-auto">
          <MetricsPanel />
        </div>
      </div>
    );
  }

  if (vistaActiva === 'configuracion') {
    return (
      <div className="flex-1 overflow-auto p-6 bg-pattern">
        <div className="max-w-[700px] mx-auto">
          <ConfigPanel />
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <DashboardProvider>
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
        <Header />
        <div className="flex-1 flex">
          <DashboardContent />
        </div>
        <Toast />
      </div>
    </DashboardProvider>
  );
}

export default App;
