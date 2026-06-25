# Call Center Pro Dashboard

Dashboard de supervisión en tiempo real para call centers con inbound/outbound. Diseñado para pantallas de escritorio de supervisores.

## Características

- **KPIs en tiempo real**: Métricas clave con indicadores visuales de color según umbrales
- **Panel de cola**: Llamadas en espera ordenadas por tiempo con alertas visuales
- **Tabla de agentes**: Estado en tiempo real con cronómetros vivos
- **Métricas avanzadas**: AHT, AWT, ACW, FCR y gauge del SLA
- **Sistema de alertas**: Notificaciones toast y sonoras configurables
- **Modo oscuro/claro**: Persistido en localStorage
- **WebSocket o Demo**: Conexión real o datos simulados

## Inicio rápido

```bash
npm install
npm run dev
```

El dashboard iniciará en `http://localhost:5173`

## Configuración del WebSocket

El dashboard intenta conectar a un WebSocket en `ws://localhost:4000` por defecto. Puedes cambiar esto con una variable de entorno:

```bash
# Crear archivo .env.local
VITE_WS_URL=ws://tu-servidor:4000
```

### Protocolo WebSocket

El servidor debe enviar mensajes JSON con esta estructura:

```json
{
  "type": "SNAPSHOT",
  "agents": [
    {
      "id": "ag_01",
      "name": "Ana Ríos",
      "status": "on_call_inbound",
      "secondsInStatus": 142,
      "callsToday": 14,
      "csat": 4.8
    }
  ],
  "queue": [
    { "id": "q_001", "waitSeconds": 67 }
  ],
  "metrics": {
    "serviceLevel": 0.82,
    "abandonment": 0.04,
    "aht": 245,
    "awt": 18,
    "acw": 32,
    "fcr": 0.74,
    "callsAnswered": 87,
    "callsAbandoned": 4,
    "activeInbound": 5,
    "activeOutbound": 3,
    "ocupacion": 0.72
  }
}
```

### Estados de agente válidos

- `disponible` - Agente listo para recibir llamadas
- `on_call_inbound` - En llamada inbound
- `on_call_outbound` - En llamada outbound
- `acw` - Post-llamada / After Call Work
- `break` - En descanso
- `ausente` - No disponible

## Modo Demo

Si el WebSocket no está disponible, el dashboard entra automáticamente en modo demo con datos simulados que se actualizan cada 3 segundos. Se muestra un badge "DEMO" en el header.

## Alertas automáticas

| Condición | Nivel | Sonido |
|-----------|-------|--------|
| Cola > 3 llamadas | Amarilla | 440Hz, 0.3s |
| SLA < 70% | Amarilla | 440Hz, 0.3s |
| Llamada en cola > 60s | Roja | 880Hz, doble beep |
| Agentes disponibles = 0 | Crítica | 1000Hz, triple beep |

Las alertas no se repiten más de una vez cada 30 segundos para el mismo evento.

## Tecnologías

- React 18 con TypeScript
- Vite
- Tailwind CSS v3
- Lucide React (iconos)
- Web Audio API (alertas sonoras)

## Diseño

- Optimizado para pantallas de 1280px+
- Fuente: Inter (Google Fonts)
- Fuente monoespaciada: JetBrains Mono
- Colores semánticos:
  - Verde: `#16a34a`
  - Amarillo: `#d97706`
  - Rojo: `#dc2626`
  - Azul: `#2563eb`
  - Morado: `#7c3aed`
