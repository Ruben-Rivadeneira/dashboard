import { Volume2, VolumeX, Moon, Sun, Monitor, Wifi, WifiOff, Settings } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export default function ConfigPanel() {
  const { isDark, toggleDarkMode, isMuted, toggleMute, isConnected, isDemo } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Configuración de tema */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuración General
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personaliza la experiencia del dashboard
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Tema */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="w-5 h-5 text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Tema visual</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isDark ? 'Modo oscuro activo' : 'Modo claro activo'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isDark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  isDark ? 'translate-x-7' : ''
                }`}
              />
            </button>
          </div>

          {/* Sonido */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-gray-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Alertas sonoras</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isMuted ? 'Silenciadas' : 'Activadas'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleMute}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                !isMuted ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  !isMuted ? 'translate-x-7' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Estado de conexión */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Estado de Conexión
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">WebSocket</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isConnected
                    ? 'Conectado al servidor'
                    : 'Desconectado - usando datos simulados'}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {isConnected ? 'CONECTADO' : 'DEMO'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">URL de conexión</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {import.meta.env.VITE_WS_URL || 'ws://localhost:4000'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la app */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acerca de Call Center Pro
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">Versión</p>
            <p className="font-medium text-gray-900 dark:text-white">1.0.0</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">Framework</p>
            <p className="font-medium text-gray-900 dark:text-white">React 18</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">Estilos</p>
            <p className="font-medium text-gray-900 dark:text-white">Tailwind CSS</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">Build</p>
            <p className="font-medium text-gray-900 dark:text-white">Vite</p>
          </div>
        </div>
      </div>
    </div>
  );
}
