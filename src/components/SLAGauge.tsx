import { useDashboard } from '../context/DashboardContext';
import { evaluarSLA } from '../utils/thresholds';

interface SLAGaugeProps {
  valor: number;
  size?: number;
}

export default function SLAGauge({ valor, size = 200 }: SLAGaugeProps) {
  const { isDark } = useDashboard();
  const colorEstado = evaluarSLA(valor);
  const porcentaje = valor * 100;

  // Parámetros del gauge
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth * 2) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Ángulo del gauge (desde -135° hasta 135°, total 270°)
  // Mapeamos 0-100% a este rango
  const anguloMaximo = 270;
  const anguloActual = (porcentaje / 100) * anguloMaximo;
  const anguloRadianes = ((anguloActual - 135) * Math.PI) / 180;

  // Colores según estado
  const colores = {
    verde: { stroke: '#16a34a', fill: '#16a34a', bg: '#16a34a20' },
    amarillo: { stroke: '#d97706', fill: '#d97706', bg: '#d9770620' },
    rojo: { stroke: '#dc2626', fill: '#dc2626', bg: '#dc262620' },
  };

  const coloresActuales = colores[colorEstado];

  // Calcular el path del arco de fondo
  const arcoFondo = () => {
    const startAngle = (-135 * Math.PI) / 180;
    const endAngle = (135 * Math.PI) / 180;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = 1; // siempre > 180° ya que es 270°

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  // Calcular el path del arco de progreso
  const arcoProgreso = () => {
    if (porcentaje === 0) return '';

    const startAngle = (-135 * Math.PI) / 180;
    const endAngle = anguloRadianes;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const arcAngle = Math.abs(anguloActual + 135);
    const largeArcFlag = arcAngle > 180 ? 1 : 0;

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  // Posición de la aguja
  const agujaX = centerX + (radius - 20) * Math.cos(anguloRadianes);
  const agujaY = centerY + (radius - 20) * Math.sin(anguloRadianes);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Arco de fondo */}
        <path
          d={arcoFondo()}
          fill="none"
          stroke={isDark ? '#374151' : '#e5e7eb'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Arco de progreso */}
        <path
          d={arcoProgreso()}
          fill="none"
          stroke={coloresActuales.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${coloresActuales.stroke}40)`,
          }}
        />

        {/* Marcas de escala */}
        {[0, 25, 50, 75, 100].map((marca) => {
          const marcaAngle = ((-135 + (marca / 100) * 270) * Math.PI) / 180;
          const x1 = centerX + (radius + 15) * Math.cos(marcaAngle);
          const y1 = centerY + (radius + 15) * Math.sin(marcaAngle);

          return (
            <text
              key={marca}
              x={x1}
              y={y1}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-xs font-medium ${isDark ? 'fill-gray-500' : 'fill-gray-400'}`}
            >
              {marca}
            </text>
          );
        })}

        {/* Aguja/punto indicador */}
        <circle
          cx={agujaX}
          cy={agujaY}
          r={6}
          fill={coloresActuales.fill}
          style={{
            filter: `drop-shadow(0 0 4px ${coloresActuales.stroke})`,
          }}
        />

        {/* Centro del gauge */}
        <circle cx={centerX} cy={centerY} r={size * 0.12} fill={isDark ? '#1f2937' : '#f9fafb'} />
      </svg>

      {/* Valor central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-3xl font-bold font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}
          style={{ color: coloresActuales.fill }}
        >
          {porcentaje.toFixed(0)}%
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">SLA 80/20</span>
      </div>
    </div>
  );
}
