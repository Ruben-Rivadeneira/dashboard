// Convierte segundos a formato MM:SS
export function formatearTiempo(segundos: number): string {
  const mins = Math.floor(segundos / 60);
  const secs = segundos % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Convierte segundos a formato MM:SS o HH:MM:SS si supera la hora
export function formatearCronometro(segundos: number): string {
  if (segundos >= 3600) {
    const hrs = Math.floor(segundos / 3600);
    const mins = Math.floor((segundos % 3600) / 60);
    const secs = segundos % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return formatearTiempo(segundos);
}

// Formatea porcentaje con decimales
export function formatearPorcentaje(valor: number, decimales = 1): string {
  return `${(valor * 100).toFixed(decimales)}%`;
}

// Formatea número entero
export function formatearNumero(valor: number): string {
  return valor.toLocaleString('es-ES');
}

// Formatea hora actual
export function formatearHoraActual(): string {
  const ahora = new Date();
  return ahora.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Formatea fecha actual
export function formatearFechaActual(): string {
  const ahora = new Date();
  return ahora.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
