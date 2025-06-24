import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Settings, 
  BarChart3, 
  Palette, 
  Gift, 
  Scissors, 
  UserCog, 
  LogOut, 
  Home,
  Activity
} from 'lucide-react';
import AppointmentManager from './AppointmentManager';
import SalonSettings from './SalonSettings';
import ThemeManager from './ThemeManager';
import RewardsManager from './RewardsManager';
import ServicesManager from './ServicesManager';
import StaffManager from './StaffManager';
import CredentialsManager from './CredentialsManager';
import Dashboard from './Dashboard';
import { logout } from '../utils/auth';
import { useTheme } from '../hooks/useTheme';
import { useSalonName } from '../hooks/useSalonSettings';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const { colors } = useTheme();
  const salonName = useSalonName();

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, component: Dashboard },
    { id: 'appointments', label: 'Citas', icon: Calendar, component: AppointmentManager },
    { id: 'services', label: 'Servicios', icon: Scissors, component: ServicesManager },
    { id: 'staff', label: 'Personal', icon: UserCog, component: StaffManager },
    { id: 'rewards', label: 'Recompensas', icon: Gift, component: RewardsManager },
    { id: 'themes', label: 'Temas', icon: Palette, component: ThemeManager },
    { id: 'settings', label: 'Configuración', icon: Settings, component: SalonSettings },
    { id: 'credentials', label: 'Credenciales', icon: UserCog, component: CredentialsManager }
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeTab)?.component || Dashboard;

  return (
    <div className="min-h-screen flex theme-transition" style={{ backgroundColor: colors?.background || '#f8fafc' }}>
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 theme-transition`}
           style={{ backgroundColor: colors?.surface || '#ffffff' }}>
        <div className="h-full flex flex-col shadow-lg">
          {/* Header */}
          <div className="p-6 border-b theme-transition" style={{ borderColor: colors?.border || '#e5e7eb' }}>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center theme-transition"
                   style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}>
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              {isSidebarOpen && (
                <div className="ml-3">
                  <h1 className="text-lg font-bold theme-transition" style={{ color: colors?.text || '#1f2937' }}>
                    {salonName}
                  </h1>
                  <p className="text-sm theme-transition" style={{ color: colors?.textSecondary || '#6b7280' }}>
                    Panel Administrativo
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 theme-transition ${
                      isActive ? 'shadow-md' : 'hover:shadow-sm'
                    }`}
                    style={{
                      backgroundColor: isActive 
                        ? `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` 
                        : 'transparent',
                      color: isActive ? 'blue' : (colors?.text || '#1f2937')
                    }}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5" />
                    {isSidebarOpen && (
                      <span className="ml-3 font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t theme-transition" style={{ borderColor: colors?.border || '#e5e7eb' }}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 rounded-lg transition-colors theme-transition"
              style={{ 
                color: colors?.error || '#ef4444',
                backgroundColor: `${colors?.error || '#ef4444'}0d`
              }}
              title={!isSidebarOpen ? 'Cerrar Sesión' : undefined}
            >
              <LogOut className="w-5 h-5" />
              {isSidebarOpen && <span className="ml-3 font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b flex items-center justify-between px-6 theme-transition"
             style={{ 
               backgroundColor: colors?.surface || '#ffffff',
               borderColor: colors?.border || '#e5e7eb'
             }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg transition-colors theme-transition"
            style={{ 
              color: colors?.textSecondary || '#6b7280',
              backgroundColor: colors?.background || '#f8fafc'
            }}
          >
            <Home className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium theme-transition" style={{ color: colors?.text || '#1f2937' }}>
                Administrador
              </p>
              <p className="text-xs theme-transition" style={{ color: colors?.textSecondary || '#6b7280' }}>
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;