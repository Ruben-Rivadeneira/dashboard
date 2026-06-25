import { useCallback, useRef, useState } from 'react';

export type TipoAlertaSonora = 'amarilla' | 'roja' | 'critica';

export function useSoundAlerts() {
  const [isMuted, setIsMuted] = useState(() => {
    const stored = localStorage.getItem('callcenter-muted');
    return stored === 'true';
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const alertasRecientesRef = useRef<Map<string, number>>(new Map());

  // Inicializar AudioContext bajo demanda
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Reproducir tono
  const reproducirTono = useCallback(
    (frecuencia: number, duracion: number, repeticiones = 1, intervalo = 200) => {
      if (isMuted) return;

      const ctx = getAudioContext();
      let repeticionActual = 0;

      const tocar = () => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = frecuencia;

        // Envelope suave
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duracion);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duracion);

        repeticionActual++;
        if (repeticionActual < repeticiones) {
          setTimeout(tocar, intervalo);
        }
      };

      tocar();
    },
    [isMuted, getAudioContext]
  );

  // Verificar si podemos emitir una alerta (cooldown de 30 segundos)
  const puedoEmitirAlerta = useCallback((tipo: string): boolean => {
    const ahora = Date.now();
    const ultimaVez = alertasRecientesRef.current.get(tipo);

    if (ultimaVez && ahora - ultimaVez < 30000) {
      return false;
    }

    alertasRecientesRef.current.set(tipo, ahora);
    return true;
  }, []);

  // Alerta amarilla: tono suave 440Hz, 0.3s
  const alertaAmarilla = useCallback(() => {
    if (!puedoEmitirAlerta('amarilla')) return;
    reproducirTono(440, 0.3, 1);
  }, [puedoEmitirAlerta, reproducirTono]);

  // Alerta roja: tono urgente 880Hz, doble beep
  const alertaRoja = useCallback(() => {
    if (!puedoEmitirAlerta('roja')) return;
    reproducirTono(880, 0.25, 2, 150);
  }, [puedoEmitirAlerta, reproducirTono]);

  // Alerta crítica: tono más agudo y persistente
  const alertaCritica = useCallback(() => {
    if (!puedoEmitirAlerta('critica')) return;
    reproducirTono(1000, 0.3, 3, 100);
  }, [puedoEmitirAlerta, reproducirTono]);

  // Emitir alerta según tipo
  const emitirAlerta = useCallback(
    (tipo: TipoAlertaSonora) => {
      switch (tipo) {
        case 'amarilla':
          alertaAmarilla();
          break;
        case 'roja':
          alertaRoja();
          break;
        case 'critica':
          alertaCritica();
          break;
      }
    },
    [alertaAmarilla, alertaRoja, alertaCritica]
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nuevoValor = !prev;
      localStorage.setItem('callcenter-muted', String(nuevoValor));
      return nuevoValor;
    });
  }, []);

  return {
    isMuted,
    toggleMute,
    emitirAlerta,
    alertaAmarilla,
    alertaRoja,
    alertaCritica,
  };
}
