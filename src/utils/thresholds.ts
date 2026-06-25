// Umbrales para indicadores de color semántico
export type EstadoColor = 'verde' | 'amarillo' | 'rojo';

// Llamadas en cola: verde 0-1, amarillo 2-3, rojo 4+
export function evaluarCola(llamadasEnCola: number): EstadoColor {
  if (llamadasEnCola <= 1) return 'verde';
  if (llamadasEnCola <= 3) return 'amarillo';
  return 'rojo';
}

// Porcentaje de abandono: verde <5%, amarillo 5-10%, rojo >10%
export function evaluarAbandono(abandono: number): EstadoColor {
  const porcentaje = abandono * 100;
  if (porcentaje < 5) return 'verde';
  if (porcentaje <= 10) return 'amarillo';
  return 'rojo';
}

// Nivel de servicio SLA: verde >=80%, amarillo 65-79%, rojo <65%
export function evaluarSLA(sla: number): EstadoColor {
  const porcentaje = sla * 100;
  if (porcentaje >= 80) return 'verde';
  if (porcentaje >= 65) return 'amarillo';
  return 'rojo';
}

// Mayor tiempo en espera: verde <30s, amarillo 30-60s, rojo >60s
export function evaluarTiempoEspera(segundos: number): EstadoColor {
  if (segundos < 30) return 'verde';
  if (segundos <= 60) return 'amarillo';
  return 'rojo';
}

// Agentes disponibles: verde >=3, amarillo 1-2, rojo 0
export function evaluarAgentesDisponibles(cantidad: number): EstadoColor {
  if (cantidad >= 3) return 'verde';
  if (cantidad >= 1) return 'amarillo';
  return 'rojo';
}

// Ocupación del equipo: verde <75%, amarillo 75-90%, rojo >90%
export function evaluarOcupacion(ocupacion: number): EstadoColor {
  const porcentaje = ocupacion * 100;
  if (porcentaje < 75) return 'verde';
  if (porcentaje <= 90) return 'amarillo';
  return 'rojo';
}

// Mapea estado de color a clases Tailwind
export function colorToClass(color: EstadoColor, bg = false): string {
  const colores = {
    verde: bg ? 'bg-green-600' : 'text-green-600',
    amarillo: bg ? 'bg-yellow-500' : 'text-yellow-500',
    rojo: bg ? 'bg-red-600' : 'text-red-600',
  };
  return colores[color];
}

// Mapea estado de color a clases de badge
export function colorToBadgeClass(color: EstadoColor): string {
  const badges = {
    verde: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    amarillo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    rojo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };
  return badges[color];
}
