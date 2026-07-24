import { useState, useEffect, useCallback } from 'react';
import {
  Phone, Users, AlertTriangle, TrendingUp, Clock, UserCheck,
  PhoneIncoming, PhoneOutgoing, Video, MessageSquare, Mail, Play, Pause,
} from 'lucide-react';
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
  evaluarCola, evaluarAbandono, evaluarSLA,
  evaluarTiempoEspera, evaluarAgentesDisponibles, evaluarOcupacion,
} from './utils/thresholds';

// ─── Campañas ─────────────────────────────────────────────────────────────────
const CAMPANAS = [
  { id: 'chevyplan_inbound',     label: 'Inbound',      Icon: PhoneIncoming,  cci: 'chevyplan_inbound'   },
  { id: 'chevyplan_outbound',    label: 'Outbound',     Icon: PhoneOutgoing,  cci: 'chevyplan_outbound'  },
  { id: 'chevyplan_videocall',   label: 'Videollamada', Icon: Video,          cci: 'chevyplan_videocall' },
  { id: 'chevyplan_whatsapp',    label: 'WhatsApp',     Icon: MessageSquare,  cci: 'chevyplan_whatsapp'  },
  { id: 'chevyplan_mail',        label: 'Email',        Icon: Mail,           cci: 'chevyplan_mail'      },
] as const;

type CampanaId = typeof CAMPANAS[number]['id'];

const AUTO_ROTATE_MS = 60_000; // 1 minuto por pestaña

// ─── Tabs con auto-rotación ────────────────────────────────────────────────────
function CampanaTabs({
  activa,
  setActiva,
}: {
  activa: CampanaId;
  setActiva: (id: CampanaId) => void;
}) {
  const [autoPlay, setAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);

  // Auto-rotación
  useEffect(() => {
    if (!autoPlay) { setProgress(0); return; }

    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min((elapsed / AUTO_ROTATE_MS) * 100, 100));
    }, 200);

    const rotate = setTimeout(() => {
      setActiva((prev: CampanaId) => {
        const idx = CAMPANAS.findIndex(c => c.id === prev);
        return CAMPANAS[(idx + 1) % CAMPANAS.length].id;
      });
    }, AUTO_ROTATE_MS);

    return () => { clearInterval(tick); clearTimeout(rotate); };
  }, [activa, autoPlay, setActiva]);

  return (
    <div className="flex items-center gap-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4">
      {CAMPANAS.map(({ id, label, Icon }) => {
        const isActive = activa === id;
        return (
          <button
            key={id}
            onClick={() => { setActiva(id); }}
            className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors whitespace-nowrap border-b-2 -mb-px ${
              isActive
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {/* Barra de progreso de auto-rotación en la tab activa */}
            {isActive && autoPlay && (
              <span
                className="absolute bottom-0 left-0 h-0.5 bg-blue-400 transition-none"
                style={{ width: `${progress}%` }}
              />
            )}
          </button>
        );
      })}

      {/* Botón play/pause */}
      <button
        onClick={() => setAutoPlay(p => !p)}
        className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={autoPlay ? 'Pausar rotación automática' : 'Reanudar rotación automática'}
      >
        {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── Dashboard principal ───────────────────────────────────────────────────────
function DashboardView({ campanaActiva }: { campanaActiva: CampanaId }) {
  const { agents, queue, metrics } = useDashboard();

  // Filtrar cola por campaña usando el campo campaign del live
  // campaign viene como "chevyplan_inbound@chevyplan" → split('@')[0] = "chevyplan_inbound"
  const queueFiltrada = queue.filter(q => {
    // LlamadaEnCola no tiene campo campaign en esta versión del hook,
    // así que mostramos toda la cola en inbound y videocall (canales de voz entrante)
    // y cola vacía en outbound/whatsapp/mail
    if (campanaActiva === 'chevyplan_inbound') return true;
    if (campanaActiva === 'chevyplan_videocall') return false; // videocall tiene su propia cola
    return false;
  });

  const agentesDisponibles = agents.filter(a => a.status === 'disponible').length;
  const maxTiempoEspera = queueFiltrada.length > 0
    ? Math.max(...queueFiltrada.map(l => l.waitSeconds))
    : 0;

  // Flags por campaña activa
  const esInbound    = campanaActiva === 'chevyplan_inbound';
  const esOutbound   = campanaActiva === 'chevyplan_outbound';
  const esVideo      = campanaActiva === 'chevyplan_videocall';
  const esWhatsApp   = campanaActiva === 'chevyplan_whatsapp';
  const esMail       = campanaActiva === 'chevyplan_mail';
  const esVoz        = esInbound || esOutbound || esVideo;

  const labelAtendidas = esOutbound ? 'Realizadas hoy' : 'Atendidas hoy';
  const valorAtendidas = esOutbound
    ? formatearNumero(metrics.callsAnsweredOutbound ?? 0)
    : formatearNumero(metrics.callsAnsweredInbound ?? metrics.callsAnswered);

  return (
    // h-full + overflow-hidden = nunca hay scroll vertical
    <div className="flex flex-col h-full overflow-hidden p-3 gap-3 bg-gray-100 dark:bg-gray-950">

      {/* ── Fila 1: KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 xl:grid-cols-10 gap-2 shrink-0">
        {/* Cola en espera — solo canales de voz/video */}
        {(esInbound || esVideo) && (
          <KPICard
            titulo="En cola"
            valor={queueFiltrada.length}
            icono={<Phone className="w-5 h-5" />}
            colorEstado={evaluarCola(queueFiltrada.length)}
          />
        )}

        {esInbound && (
          <KPICard
            titulo="Inbound activas"
            valor={metrics.activeInbound}
            icono={<PhoneIncoming className="w-5 h-5" />}
            colorEstado="neutro"
          />
        )}

        {esOutbound && (
          <KPICard
            titulo="Outbound activas"
            valor={metrics.activeOutbound}
            icono={<PhoneOutgoing className="w-5 h-5" />}
            colorEstado="neutro"
          />
        )}

        {esVideo && (
          <KPICard
            titulo="Video activas"
            valor={metrics.activeInbound}
            icono={<Video className="w-5 h-5" />}
            colorEstado="neutro"
          />
        )}

        {esWhatsApp && (
          <KPICard
            titulo="Chats activos"
            valor={metrics.activeInbound + metrics.activeOutbound}
            icono={<MessageSquare className="w-5 h-5" />}
            colorEstado="neutro"
          />
        )}

        {esMail && (
          <KPICard
            titulo="Mails activos"
            valor={metrics.activeInbound + metrics.activeOutbound}
            icono={<Mail className="w-5 h-5" />}
            colorEstado="neutro"
          />
        )}

        <KPICard
          titulo={labelAtendidas}
          valor={valorAtendidas}
          icono={<UserCheck className="w-5 h-5" />}
          colorEstado="neutro"
          subtitulo={`${formatearNumero(metrics.callsAbandoned)} abandonadas`}
        />

        <KPICard
          titulo="Abandono"
          valor={formatearPorcentaje(metrics.abandonment)}
          icono={<AlertTriangle className="w-5 h-5" />}
          colorEstado={evaluarAbandono(metrics.abandonment)}
        />

        <KPICard
          titulo="Nivel de servicio"
          valor={formatearPorcentaje(metrics.serviceLevel, 0)}
          icono={<TrendingUp className="w-5 h-5" />}
          colorEstado={evaluarSLA(metrics.serviceLevel)}
          subtitulo="SLA 80/20"
        />

        {(esInbound || esVideo) && (
          <KPICard
            titulo="Mayor espera"
            valor={formatearTiempo(maxTiempoEspera)}
            icono={<Clock className="w-5 h-5" />}
            colorEstado={evaluarTiempoEspera(maxTiempoEspera)}
            subtitulo="Más antigua"
          />
        )}

        <KPICard
          titulo="Disponibles"
          valor={agentesDisponibles}
          icono={<Users className="w-5 h-5" />}
          colorEstado={evaluarAgentesDisponibles(agentesDisponibles)}
          subtitulo={`de ${agents.length}`}
        />

        <KPICard
          titulo="Ocupación"
          valor={formatearPorcentaje(metrics.ocupacion || 0, 0)}
          icono={<Users className="w-5 h-5" />}
          colorEstado={evaluarOcupacion(metrics.ocupacion || 0)}
          subtitulo="del equipo"
        />
      </div>

      {/* ── Fila 2: Cola + Agentes — ocupa el espacio restante ────────────── */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Cola — solo para canales de voz entrante */}
        {(esInbound || esVideo) && (
          <div className="w-72 shrink-0 flex flex-col min-h-0">
            <QueuePanel />
          </div>
        )}

        {/* Tabla de agentes — ocupa todo el ancho restante */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <AgentsTable />
        </div>
      </div>
    </div>
  );
}

// ─── Contenido según vista del sidebar ────────────────────────────────────────
function DashboardContent({ campanaActiva }: { campanaActiva: CampanaId }) {
  const { vistaActiva } = useDashboard();

  if (vistaActiva === 'dashboard') return <DashboardView campanaActiva={campanaActiva} />;

  if (vistaActiva === 'agentes') return (
    <div className="flex-1 overflow-auto p-6 bg-pattern">
      <div className="max-w-[1400px] mx-auto"><AgentsTable /></div>
    </div>
  );

  if (vistaActiva === 'cola') return (
    <div className="flex-1 overflow-auto p-6 bg-pattern">
      <div className="max-w-[800px] mx-auto"><QueuePanel /></div>
    </div>
  );

  if (vistaActiva === 'metricas') return (
    <div className="flex-1 overflow-auto p-6 bg-pattern">
      <div className="max-w-[900px] mx-auto"><MetricsPanel /></div>
    </div>
  );

  if (vistaActiva === 'configuracion') return (
    <div className="flex-1 overflow-auto p-6 bg-pattern">
      <div className="max-w-[700px] mx-auto"><ConfigPanel /></div>
    </div>
  );

  return null;
}

// ─── App root ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { vistaActiva } = useDashboard();
  const [campanaActiva, setCampanaActiva] = useState<CampanaId>('chevyplan_inbound');

  const setCampana = useCallback((id: CampanaId) => setCampanaActiva(id), []);

  return (
    // h-screen + overflow-hidden = la app ocupa exactamente la ventana, sin scroll de página
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-950">
      <Header />

      {/* Tabs de campaña — solo visible en la vista dashboard */}
      {vistaActiva === 'dashboard' && (
        <CampanaTabs activa={campanaActiva} setActiva={setCampana} />
      )}

      {/* Contenido — flex-1 para ocupar el resto de la pantalla */}
      <div className="flex-1 flex overflow-hidden">
        <DashboardContent campanaActiva={campanaActiva} />
      </div>

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <AppInner />
    </DashboardProvider>
  );
}
