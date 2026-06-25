import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Agente, LlamadaEnCola, Metricas, useCallCenterSocket } from '../hooks/useCallCenterSocket';
import { useDarkMode } from '../hooks/useDarkMode';
import { useSoundAlerts } from '../hooks/useSoundAlerts';

export type VistaActiva = 'dashboard' | 'agentes' | 'cola' | 'metricas' | 'configuracion';

export type ToastType = 'info' | 'warning' | 'error' | 'success';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  timestamp: number;
}

interface DashboardContextType {
  // Datos del call center
  agents: Agente[];
  queue: LlamadaEnCola[];
  metrics: Metricas;
  isConnected: boolean;
  isDemo: boolean;

  // Estado de la UI
  vistaActiva: VistaActiva;
  setVistaActiva: (vista: VistaActiva) => void;

  // Tema
  isDark: boolean;
  toggleDarkMode: () => void;

  // Sonido
  isMuted: boolean;
  toggleMute: () => void;
  emitirAlerta: (tipo: import('../hooks/useSoundAlerts').TipoAlertaSonora) => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;

  // Reloj
  horaActual: string;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { agents, queue, metrics, isConnected, isDemo } = useCallCenterSocket();
  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const { isMuted, toggleMute, emitirAlerta } = useSoundAlerts();

  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [horaActual, setHoraActual] = useState(() =>
    new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  );

  const alertasEmitidasRef = useRef<Map<string, number>>(new Map());

  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(
        new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Sistema de alertas basado en métricas
  useEffect(() => {
    const ahora = Date.now();
    const alertasRecientes = alertasEmitidasRef.current;

    // Función para verificar si podemos emitir alerta
    const puedeEmitir = (tipo: string): boolean => {
      const ultimaVez = alertasRecientes.get(tipo);
      if (ultimaVez && ahora - ultimaVez < 30000) return false;
      alertasRecientes.set(tipo, ahora);
      return true;
    };

    // Cola supera 3 llamadas
    if (queue.length > 3 && puedeEmitir('cola_alta')) {
      addToast(`Alerta: ${queue.length} llamadas en cola de espera`, 'warning');
      emitirAlerta('amarilla');
    }

    // SLA bajo 70%
    if (metrics.serviceLevel < 0.7 && puedeEmitir('sla_bajo')) {
      addToast(`SLA bajo ${(metrics.serviceLevel * 100).toFixed(1)}%. Revisar capacidad.`, 'warning');
      emitirAlerta('amarilla');
    }

    // Llamada en cola supera 60 segundos
    const llamadaCritica = queue.find((l) => l.waitSeconds > 60);
    if (llamadaCritica && puedeEmitir('espera_critica')) {
      addToast(`Llamada en espera crítica: ${llamadaCritica.waitSeconds}s`, 'error');
      emitirAlerta('roja');
    }

    // Agentes disponibles llega a 0
    const agentesDisponibles = agents.filter((a) => a.status === 'disponible').length;
    if (agentesDisponibles === 0 && agents.length > 0 && puedeEmitir('sin_agentes')) {
      addToast('CRÍTICO: No hay agentes disponibles', 'error');
      emitirAlerta('critica');
    }
  }, [queue.length, metrics.serviceLevel, agents, emitirAlerta]);

  // Función para agregar toast
  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, message, type, timestamp: Date.now() };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  // Función para remover toast
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auto-dismiss toasts después de 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = Date.now();
      setToasts((prev) => prev.filter((t) => ahora - t.timestamp < 5000));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const value: DashboardContextType = {
    agents,
    queue,
    metrics,
    isConnected,
    isDemo,
    vistaActiva,
    setVistaActiva,
    isDark,
    toggleDarkMode,
    isMuted,
    toggleMute,
    emitirAlerta,
    toasts,
    addToast,
    removeToast,
    horaActual,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard debe usarse dentro de DashboardProvider');
  }
  return context;
}
