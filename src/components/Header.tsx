import { Phone, Wifi, WifiOff, Volume2, VolumeX, Moon, Sun, Clock } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function Header() {
  const { isConnected, isDemo, isDark, toggleDarkMode, isMuted, toggleMute, horaActual } = useDashboard();

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
      {/* Logo y nombre */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
          <Phone className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Call Center Pro
            {isDemo && (
              <span className="text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                DEMO
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Estado de conexión */}
      <div className="flex items-center gap-6">
        {/* Indicador de conexión WebSocket */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse-slow" />
              <Wifi className="w-4 h-4 text-green-600 dark:text-green-500" />
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">Conectado</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <WifiOff className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400 font-medium">Modo Demo</span>
            </>
          )}
        </div>

        {/* Separador */}
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

        {/* Reloj en tiempo real */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="font-mono text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[70px]">
            {horaActual}
          </span>
        </div>

        {/* Separador */}
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

        {/* Controles */}
        <div className="flex items-center gap-2">
          {/* Botón mute/unmute */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar alertas'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Botón modo oscuro/claro */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
