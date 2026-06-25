import { useRef, useEffect, useState } from 'react';
import { Phone, PhoneOutgoing, Coffee, UserX, Clock, CheckCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { formatearCronometro } from '../utils/formatTime';
import type { Agente } from '../hooks/useCallCenterSocket';

// Mapeo de estados a labels y estilos
const estadosConfig = {
  disponible: {
    label: 'Disponible',
    icon: CheckCircle,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  on_call_inbound: {
    label: 'En llamada inbound',
    icon: Phone,
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  on_call_outbound: {
    label: 'En llamada outbound',
    icon: PhoneOutgoing,
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  acw: {
    label: 'Post-llamada / ACW',
    icon: Clock,
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  break: {
    label: 'Break',
    icon: Coffee,
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  ausente: {
    label: 'Ausente',
    icon: UserX,
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
  },
};

// Componente de estrellas para CSAT
function EstrellasCSAT({ valor }: { valor: number }) {
  const estrellas = [];
  const estrellasCompletas = Math.floor(valor);
  const decimal = valor - estrellasCompletas;

  for (let i = 0; i < 5; i++) {
    if (i < estrellasCompletas) {
      estrellas.push(
        <svg key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      );
    } else if (i === estrellasCompletas && decimal > 0.3) {
      estrellas.push(
        <svg key={i} className="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#half-${i})`}
            stroke="currentColor"
            strokeWidth="1"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      );
    } else {
      estrellas.push(
        <svg key={i} className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" viewBox="0 0 20 20">
          <path
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      );
    }
  }

  return <div className="flex items-center gap-0.5">{estrellas}</div>;
}

// Fila de agente con cronómetro en vivo
function AgenteFila({ agente }: { agente: Agente }) {
  const [segundos, setSegundos] = useState(agente.secondsInStatus);
  const rafRef = useRef<number | null>(null);
  const inicioRef = useRef<number>(Date.now() - agente.secondsInStatus * 1000);

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

  // Actualizar referencia cuando cambie el estado del agente
  useEffect(() => {
    inicioRef.current = Date.now() - agente.secondsInStatus * 1000;
    setSegundos(agente.secondsInStatus);
  }, [agente.secondsInStatus, agente.status]);

  const config = estadosConfig[agente.status];
  const IconoEstado = config.icon;
  const iniciales = agente.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  // Color del avatar según estado
  const avatarColor =
    agente.status === 'disponible'
      ? 'bg-green-500'
      : agente.status === 'on_call_inbound'
        ? 'bg-blue-500'
        : agente.status === 'on_call_outbound'
          ? 'bg-purple-500'
          : agente.status === 'acw'
            ? 'bg-yellow-500'
            : agente.status === 'break'
              ? 'bg-orange-500'
              : 'bg-gray-400';

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Nombre y avatar */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium text-sm`}
          >
            {iniciales}
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{agente.name}</span>
        </div>
      </td>

      {/* Estado */}
      <td className="py-4 px-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.badgeClass}`}
        >
          <IconoEstado className="w-3.5 h-3.5" />
          {config.label}
        </span>
      </td>

      {/* Tipo de llamada */}
      <td className="py-4 px-4">
        {agente.status === 'on_call_inbound' && (
          <span className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            Inbound
          </span>
        )}
        {agente.status === 'on_call_outbound' && (
          <span className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1">
            <PhoneOutgoing className="w-3.5 h-3.5" />
            Outbound
          </span>
        )}
        {(agente.status !== 'on_call_inbound' && agente.status !== 'on_call_outbound') && (
          <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
        )}
      </td>

      {/* Tiempo en estado */}
      <td className="py-4 px-4">
        <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
          {formatearCronometro(segundos)}
        </span>
      </td>

      {/* Llamadas hoy */}
      <td className="py-4 px-4">
        <span className="font-medium text-gray-900 dark:text-white">{agente.callsToday}</span>
      </td>

      {/* CSAT */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <EstrellasCSAT valor={agente.csat} />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {agente.csat.toFixed(1)}
          </span>
        </div>
      </td>
    </tr>
  );
}

export default function AgentsTable() {
  const { agents } = useDashboard();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Equipo de Agentes</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {agents.length} agentes activos
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Agente
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tipo
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tiempo
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Llamadas
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CSAT
              </th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agente) => (
              <AgenteFila key={agente.id} agente={agente} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
