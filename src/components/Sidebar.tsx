import { LayoutDashboard, Users, Phone, BarChart3, Settings } from 'lucide-react';
import { useDashboard, VistaActiva } from '../context/DashboardContext';

interface NavItem {
  id: VistaActiva;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agentes', label: 'Agentes', icon: Users },
  { id: 'cola', label: 'Cola', icon: Phone },
  { id: 'metricas', label: 'Métricas', icon: BarChart3 },
  { id: 'configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const { vistaActiva, setVistaActiva } = useDashboard();

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = vistaActiva === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setVistaActiva(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-600 text-center">
          Call Center Pro v1.0
        </div>
      </div>
    </aside>
  );
}
