import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Tipos públicos (no cambian — el resto del proyecto los usa igual) ─────────
export interface Agente {
  id: string;
  name: string;
  status: 'disponible' | 'on_call_inbound' | 'on_call_outbound' | 'acw' | 'break' | 'ausente';
  secondsInStatus: number;
  callsToday: number;
  csat: number;
}

export interface LlamadaEnCola {
  id: string;
  waitSeconds: number;
}

export interface Metricas {
  serviceLevel: number;         // 0-1
  abandonment: number;          // 0-1
  aht: number;                  // segundos (promedio tiempo atención)
  awt: number;                  // segundos (promedio tiempo espera)
  acw: number;                  // segundos (promedio wrapup)
  fcr: number;                  // 0-1 (no disponible en API)
  callsAnswered: number;        // total atendidas (inbound)
  callsAbandoned: number;       // total abandonadas (inbound)
  callsAnsweredInbound: number; // inbound atendidas hoy
  callsAnsweredOutbound: number;// outbound realizadas hoy
  activeInbound: number;        // inbound activas ahora (live)
  activeOutbound: number;       // outbound activas ahora (live)
  ocupacion?: number;           // 0-1
}

export interface DatosDashboard {
  agents: Agente[];
  queue: LlamadaEnCola[];
  metrics: Metricas;
}

export interface UseCallCenterSocketReturn {
  agents: Agente[];
  queue: LlamadaEnCola[];
  metrics: Metricas;
  isConnected: boolean;
  isDemo: boolean;
}

// ─── Config ────────────────────────────────────────────────────────────────────
// URL completa — el proxy de Vite es opcional, esto funciona directo si el
// servidor permite CORS, o a través del proxy si está configurado.
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'https://cls59-dal.i6.inconcert.cloud/inconcert/api';
const POLL_MS = Number(import.meta.env.VITE_POLL_INTERVAL ?? 30_000);
const CC_USER = import.meta.env.VITE_CC_USER ?? '';
const CC_PASSWORD = import.meta.env.VITE_CC_PASSWORD ?? '';

// Campañas separadas por coma en .env, ej: "vanttive_in,vanttive_out"
const CAMPAIGNS: string[] = (import.meta.env.VITE_CC_CAMPAIGNS ?? 'vanttive_in,vanttive_out')
  .split(',')
  .map((c: string) => c.trim())
  .filter(Boolean);

// SLA: llamadas respondidas dentro de N segundos (el 20 del 80/20)
const SL_WINDOW_SECONDS = Number(import.meta.env.VITE_SL_WINDOW ?? 20);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'cc_token';

function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
function saveToken(t: string) {
  sessionStorage.setItem(TOKEN_KEY, t);
}
function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

function todayRange() {
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = new Date();
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { startDate: `${base} 00:00:00`, endDate: `${base} 23:59:59` };
}

/** "HH:MM:SS" → segundos */
function toSeconds(t: string): number {
  if (!t || t === 'N/A') return 0;
  const [h, m, s] = t.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

/** Segundos transcurridos desde un timestamp "YYYY-MM-DD HH:MM:SS" */
function elapsed(ts: string): number {
  if (!ts || ts === 'N/A') return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(ts.replace(' ', 'T')).getTime()) / 1000));
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function doLogin(): Promise<string> {
  const data = await apiPost<{ status: boolean; token: string }>('/login/', {
    user: CC_USER,
    password: CC_PASSWORD,
  });
  if (!data.status || !data.token) throw new Error('Login sin token');
  saveToken(data.token);
  return data.token;
}

async function ensureToken(): Promise<string> {
  return getToken() ?? (await doLogin());
}

// Live: /interactions/call/live/
interface LiveRow {
  agent: string;
  campaign: string;
  account: string;
  InteractionStateValue: string; // "Taken" | "N/A" | "Wrapup"
  start_timestamp: string;
  state_timestamp: string;
  contact_address: string;
}
interface LiveResp {
  status: boolean;
  content: { result: { rows: LiveRow[] } };
}

async function fetchLive(token: string, cci: string): Promise<LiveRow[]> {
  const { startDate, endDate } = todayRange();
  const data = await apiPost<LiveResp>(
    '/interactions/call/live/',
    { queryFields: { startDate, endDate, CCI: cci }, rowsPerPage: 1000, returnInfo: { type: 'reportOnlyData' } },
    token,
  );
  return data?.content?.result?.rows ?? [];
}

// Logged-in agents: /users/realtime/logged_in/
interface LoggedInRow {
  Agent: string;           // username sin dominio
  Campaign: string;
  VCC: string;
  StateRaw: string;        // "ACTIVE" | "BREAK" | "ABSENT" | ...
  LastStatusChangeTime: string;
  LastLoginTime: string;
  SessionId: string;
}
interface LoggedInResp {
  status: boolean;
  content: { result: { rows: LoggedInRow[] } };
}

async function fetchLoggedIn(token: string): Promise<LoggedInRow[]> {
  const data = await apiPost<LoggedInResp>(
    '/users/realtime/logged_in/',
    {},
    token,
  );
  return data?.content?.result?.rows ?? [];
}

// Archive: /interactions/call/archive/by_campaign/
interface ArchiveRow {
  LastAgent: string;
  FirstAgent: string;
  Initiative: string;      // "Inb." | "Out."
  IsTaken: string;         // "Yes" | "No"
  IsAbandoned: string;
  IsOutOfScheduler: string;
  SLPositive: string;      // "Yes" | "No"
  WaitingTime: string;     // "HH:MM:SS"
  AttentionTime: string;
  WrapupTime: string;
  DispositionCode: string;
  StartDate: string;
  EndDate: string;
  Campaign: string;
  Account: string;
}
interface ArchiveResp {
  status: boolean;
  content: { result: { rows: ArchiveRow[] } };
}

async function fetchArchive(token: string): Promise<ArchiveRow[]> {
  const { startDate, endDate } = todayRange();
  const data = await apiPost<ArchiveResp>(
    '/interactions/call/archive/by_campaign/',
    { queryFields: { startDate, endDate, CCI: {} }, rowsPerPage: 1000, returnInfo: { type: 'reportOnlyData' } },
    token,
  );
  return data?.content?.result?.rows ?? [];
}

// ─── Transformadores ──────────────────────────────────────────────────────────

/**
 * Construye Agente[] cruzando 3 fuentes:
 * 1. loggedInRows → base: todos los agentes logueados ahora mismo (deduplicados por SessionId)
 * 2. liveRows     → overlay: quién está en llamada / wrapup en este momento
 * 3. archiveRows  → callsToday por agente
 */
function buildAgentes(
  loggedInRows: LoggedInRow[],
  liveRows: LiveRow[],
  archiveRows: ArchiveRow[],
): Agente[] {
  // ── 1. Deduplicar agentes logueados por SessionId (un agente puede tener
  //       múltiples filas si está suscrito a varias campañas)
  const loggedMap = new Map<string, LoggedInRow>(); // key = Agent (username)
  for (const r of loggedInRows) {
    if (!loggedMap.has(r.Agent)) {
      loggedMap.set(r.Agent, r);
    }
  }

  // ── 2. Índice de llamadas activas por agente desde live
  //       key = username (antes del @), value = la fila con mayor prioridad
  const liveMap = new Map<string, LiveRow>();
  const priority = (s: string) => s === 'Taken' ? 2 : s === 'Wrapup' ? 1 : 0;
  for (const row of liveRows) {
    if (!row.agent || row.agent === 'N/A') continue;
    const username = row.agent.split('@')[0];
    const existing = liveMap.get(username);
    if (!existing || priority(row.InteractionStateValue) > priority(existing.InteractionStateValue)) {
      liveMap.set(username, row);
    }
  }

  // ── 3. Llamadas totales hoy por agente desde archive
  const callsByAgent = new Map<string, number>();
  for (const r of archiveRows) {
    if (r.LastAgent && r.LastAgent !== 'N/A') {
      callsByAgent.set(r.LastAgent, (callsByAgent.get(r.LastAgent) ?? 0) + 1);
    }
  }

  // ── 4. Construir agentes
  const agentes: Agente[] = [];
  let idx = 0;

  for (const [username, loggedRow] of loggedMap) {
    const liveRow = liveMap.get(username);

    let status: Agente['status'] = 'disponible';
    let secondsInStatus = elapsed(loggedRow.LastStatusChangeTime);

    if (liveRow) {
      // Agente tiene interacción activa → derivar estado desde live
      const isInbound = liveRow.account?.toLowerCase().includes('_in');
      if (liveRow.InteractionStateValue === 'Taken') {
        status = isInbound ? 'on_call_inbound' : 'on_call_outbound';
      } else if (liveRow.InteractionStateValue === 'Wrapup') {
        status = 'acw';
      }
      secondsInStatus = elapsed(liveRow.state_timestamp);
    } else {
      // Sin llamada activa → usar StateRaw del endpoint logged_in
      const raw = (loggedRow.StateRaw ?? '').toUpperCase();
      if (raw === 'BREAK') status = 'break';
      else if (raw === 'ABSENT' || raw === 'AWAY') status = 'ausente';
      else status = 'disponible'; // ACTIVE sin llamada = disponible
    }

    agentes.push({
      id: `ag_${String(++idx).padStart(2, '0')}`,
      name: username,
      status,
      secondsInStatus,
      callsToday: callsByAgent.get(username) ?? 0,
      csat: 0,
    });
  }

  return agentes;
}

/**
 * Extrae la cola de espera: filas live sin agente asignado (inbound en espera)
 */
function liveToQueue(liveRows: LiveRow[]): LlamadaEnCola[] {
  return liveRows
    .filter(
      (r) =>
        (!r.agent || r.agent === 'N/A') &&
        r.InteractionStateValue === 'N/A' &&
        r.account?.toLowerCase().includes('_in'),
    )
    .map((r, i) => ({
      id: `q_${String(i + 1).padStart(3, '0')}`,
      waitSeconds: elapsed(r.start_timestamp),
    }));
}

/**
 * Calcula métricas desde archive + live
 */
function buildMetrics(liveRows: LiveRow[], archiveRows: ArchiveRow[]): Metricas {
  // ── Separar archive por tipo ─────────────────────────────────────────────
  const inbArchive = archiveRows.filter(
    (r) => r.Initiative === 'Inb.' && r.IsOutOfScheduler !== 'Yes',
  );
  const outbArchive = archiveRows.filter((r) => r.Initiative === 'Out.');
  const totalInb = inbArchive.length;

  // Bug fix 2: separar atendidas inbound vs outbound realizadas
  const callsAnsweredInbound = inbArchive.filter((r) => r.IsTaken === 'Yes').length;
  const callsAnsweredOutbound = outbArchive.filter((r) => r.IsTaken === 'Yes').length;

  // callsAnswered = inbound atendidas (para compatibilidad con KPIs existentes)
  const answered = callsAnsweredInbound;
  const abandoned = archiveRows.filter((r) => r.IsAbandoned === 'Yes').length;

  // SL: atendidas en <= SL_WINDOW_SECONDS / total atendidas (no sobre el total de llamadas)
  // Si no hay llamadas atendidas aún → 100% (arranca perfecto y va bajando con el uso)
  const attendedInbAll = inbArchive.filter((r) => r.IsTaken === 'Yes');
  const answeredInSL = attendedInbAll.filter(
    (r) => toSeconds(r.WaitingTime) <= SL_WINDOW_SECONDS,
  ).length;
  const serviceLevel = attendedInbAll.length > 0
    ? answeredInSL / attendedInbAll.length
    : 1; // 100% cuando no hay llamadas aún

  // Abandono: sobre el total inbound
  const abandonment = totalInb > 0 ? abandoned / totalInb : 0;

  // AHT = promedio AttentionTime de inbound atendidas
  const attendedInb = inbArchive.filter((r) => r.IsTaken === 'Yes');
  const aht =
    attendedInb.length > 0
      ? attendedInb.reduce((sum, r) => sum + toSeconds(r.AttentionTime), 0) / attendedInb.length
      : 0;

  // AWT = promedio WaitingTime inbound
  const awt =
    inbArchive.length > 0
      ? inbArchive.reduce((sum, r) => sum + toSeconds(r.WaitingTime), 0) / inbArchive.length
      : 0;

  // ACW = promedio WrapupTime inbound atendidas
  const acw =
    attendedInb.length > 0
      ? attendedInb.reduce((sum, r) => sum + toSeconds(r.WrapupTime), 0) / attendedInb.length
      : 0;

  // Bug fix 1: activeOutbound incluye Taken Y N/A (llamada manual en curso)
  const activeInbound = liveRows.filter(
    (r) =>
      r.account?.toLowerCase().includes('_in') &&
      (r.InteractionStateValue === 'Taken' || r.InteractionStateValue === 'N/A'),
  ).length;

  const activeOutbound = liveRows.filter(
    (r) =>
      r.account?.toLowerCase().includes('_out') &&
      (r.InteractionStateValue === 'Taken' || r.InteractionStateValue === 'N/A'),
  ).length;

  // Ocupación: agentes ocupados (Taken o Wrapup) / agentes únicos en live
  const agentSetLive = new Set<string>();
  for (const r of liveRows) {
    if (r.agent && r.agent !== 'N/A') agentSetLive.add(r.agent.split('@')[0]);
  }
  const totalAgents = agentSetLive.size || 1;
  const busyAgents = liveRows.filter(
    (r) =>
      r.agent &&
      r.agent !== 'N/A' &&
      (r.InteractionStateValue === 'Taken' || r.InteractionStateValue === 'Wrapup'),
  ).length;
  const ocupacion = Math.min(busyAgents / totalAgents, 1);

  return {
    serviceLevel,
    abandonment,
    aht: Math.round(aht),
    awt: Math.round(awt),
    acw: Math.round(acw),
    fcr: 0,
    callsAnswered: answered,
    callsAbandoned: abandoned,
    callsAnsweredInbound,
    callsAnsweredOutbound,
    activeInbound,
    activeOutbound,
    ocupacion,
  };
}

// ─── Hook principal ────────────────────────────────────────────────────────────
const METRICAS_VACIAS: Metricas = {
  serviceLevel: 0, abandonment: 0, aht: 0, awt: 0, acw: 0,
  fcr: 0, callsAnswered: 0, callsAbandoned: 0,
  callsAnsweredInbound: 0, callsAnsweredOutbound: 0,
  activeInbound: 0, activeOutbound: 0, ocupacion: 0,
};

export function useCallCenterSocket(): UseCallCenterSocketReturn {
  const [agents, setAgents] = useState<Agente[]>([]);
  const [queue, setQueue] = useState<LlamadaEnCola[]>([]);
  const [metrics, setMetrics] = useState<Metricas>(METRICAS_VACIAS);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemo] = useState(false); // ya no hay modo demo

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      let token = await ensureToken();

      // Fetch las 3 fuentes en paralelo
      let liveRows: LiveRow[] = [];
      let loggedInRows: LoggedInRow[] = [];
      let archiveRows: ArchiveRow[] = [];

      try {
        const [liveResults, loggedResult, archiveResult] = await Promise.all([
          Promise.all(CAMPAIGNS.map((cci) => fetchLive(token, cci))),
          fetchLoggedIn(token),
          fetchArchive(token),
        ]);
        liveRows = liveResults.flat();
        loggedInRows = loggedResult;
        archiveRows = archiveResult;
      } catch (err: unknown) {
        const msg = String(err);
        if (msg.includes('401') || msg.includes('403')) {
          clearToken();
          token = await doLogin();
          const [liveResults, loggedResult, archiveResult] = await Promise.all([
            Promise.all(CAMPAIGNS.map((cci) => fetchLive(token, cci))),
            fetchLoggedIn(token),
            fetchArchive(token),
          ]);
          liveRows = liveResults.flat();
          loggedInRows = loggedResult;
          archiveRows = archiveResult;
        } else {
          throw err;
        }
      }

      setAgents(buildAgentes(loggedInRows, liveRows, archiveRows));
      setQueue(liveToQueue(liveRows));
      setMetrics(buildMetrics(liveRows, archiveRows));
      setIsConnected(true);
    } catch (err) {
      console.error('[useCallCenterSocket] Error fetching data:', err);
      setIsConnected(false);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Fetch inicial
    fetchAll();

    // Polling
    timerRef.current = setInterval(fetchAll, POLL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll]);

  return { agents, queue, metrics, isConnected, isDemo };
}
