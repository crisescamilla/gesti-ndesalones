import React, { useState, useEffect } from 'react'; 
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Bell,
  Gift,
  TrendingUp,
  Clock,
  DollarSign,
  UserCheck,
  Award,
  Scissors,
  Building2,
  Key,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Palette,
  Edit3,
  Save,
  X,
  History
} from 'lucide-react';
import { AdminUser } from '../types';
import { getCurrentUser, logout } from '../utils/auth';
import { getClients, getAppointments, getTodayAppointmentsCount, updateAppointmentStatus } from '../utils/storage';
import { getAdminNotifications } from '../utils/rewards';
import { staffMembers } from '../data/staff';
import { getActiveServices } from '../utils/servicesManager';
import { getSalonSettings, saveSalonSettings, getSalonSettingsHistory } from '../utils/salonSettings';
import { useSalonName } from '../hooks/useSalonSettings';
import { useTheme } from '../hooks/useTheme';
import ClientRewardsCard from './ClientRewardsCard';
import RewardsManager from './RewardsManager';
import ServicesManager from './ServicesManager';
import SalonSettings from './SalonSettings';
import CredentialsManager from './CredentialsManager';
import StaffManager from './StaffManager';
import ThemeManager from './ThemeManager';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'appointments' | 'services' | 'staff' | 'rewards' | 'salon-settings' | 'credentials' | 'themes'>('dashboard');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0,
    clientsWithRewards: 0
  });
  const [notifications, setNotifications] = useState(0);
  
  // Real-time theme
  const { activeTheme, colors } = useTheme();
  
  // Salon name editing state
  const [isEditingSalonName, setIsEditingSalonName] = useState(false);
  const [editingSalonName, setEditingSalonName] = useState('');
  const [salonNameMessage, setSalonNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [salonNameLoading, setSalonNameLoading] = useState(false);
  
  // Real-time salon name
  const currentSalonName = useSalonName();
  
  // Appointments management state
  const [appointmentsFilter, setAppointmentsFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'completed'>('all');
  const [appointmentsSearch, setAppointmentsSearch] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    loadDashboardData();
  }, []);

  useEffect(() => {
    // Clear salon name message after 5 seconds
    if (salonNameMessage) {
      const timer = setTimeout(() => setSalonNameMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [salonNameMessage]);

  const loadDashboardData = () => {
    const clients = getClients();
    const appointments = getAppointments();
    const todayCount = getTodayAppointmentsCount();
    const unreadNotifications = getAdminNotifications().filter(n => !n.isRead).length;
    
    // Calculate monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = appointments
      .filter(apt => {
        const aptDate = new Date(apt.createdAt);
        return aptDate.getMonth() === currentMonth && 
               aptDate.getFullYear() === currentYear &&
               apt.status === 'completed';
      })
      .reduce((sum, apt) => sum + apt.totalPrice, 0);

    // Count clients with rewards
    const clientsWithRewards = clients.filter(c => c.rewardsEarned && c.rewardsEarned > 0).length;

    setDashboardStats({
      todayAppointments: todayCount,
      totalClients: clients.length,
      monthlyRevenue,
      clientsWithRewards
    });
    
    setNotifications(unreadNotifications);
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed') => {
    if (!user) return;
    
    setUpdatingStatus(appointmentId);
    
    try {
      const success = updateAppointmentStatus(appointmentId, newStatus, user.username);
      if (success) {
        loadDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Salon name editing functions (CSRF protection removed)
  const startEditingSalonName = () => {
    setEditingSalonName(currentSalonName);
    setIsEditingSalonName(true);
    setSalonNameMessage(null);
  };

  const cancelEditingSalonName = () => {
    setIsEditingSalonName(false);
    setEditingSalonName('');
    setSalonNameMessage(null);
  };

  const saveSalonName = async () => {
    if (!user) {
      setSalonNameMessage({ type: 'error', text: 'Usuario no autenticado' });
      return;
    }

    // Validation
    const trimmedName = editingSalonName.trim();
    
    if (!trimmedName) {
      setSalonNameMessage({ type: 'error', text: 'El nombre del salón no puede estar vacío' });
      return;
    }

    if (trimmedName.length < 3) {
      setSalonNameMessage({ type: 'error', text: 'El nombre debe tener al menos 3 caracteres' });
      return;
    }

    if (trimmedName.length > 50) {
      setSalonNameMessage({ type: 'error', text: 'El nombre no puede exceder 50 caracteres' });
      return;
    }

    if (trimmedName === currentSalonName) {
      setSalonNameMessage({ type: 'error', text: 'El nuevo nombre debe ser diferente al actual' });
      return;
    }

    setSalonNameLoading(true);
    setSalonNameMessage(null);

    try {
      const currentSettings = getSalonSettings();
      
      // Save without CSRF token validation
      const result = saveSalonSettings(
        {
          salonName: trimmedName,
          salonMotto: currentSettings.salonMotto
        },
        user.username
      );

      if (result.success) {
        setIsEditingSalonName(false);
        setEditingSalonName('');
        setSalonNameMessage({ 
          type: 'success', 
          text: `¡Nombre actualizado exitosamente! "${currentSalonName}" → "${trimmedName}"` 
        });
      } else {
        setSalonNameMessage({ type: 'error', text: result.error || 'Error al actualizar el nombre' });
      }
    } catch (error) {
      setSalonNameMessage({ type: 'error', text: 'Error del sistema al actualizar el nombre' });
    } finally {
      setSalonNameLoading(false);
    }
  };

  const handleSalonNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveSalonName();
    } else if (e.key === 'Escape') {
      cancelEditingSalonName();
    }
  };

  const exportToExcel = () => {
    const appointments = getAppointments();
    const clients = getClients();
    const services = getActiveServices();
    
    // Filter appointments based on current filter and search
    const filteredAppointments = appointments.filter(appointment => {
      const client = clients.find(c => c.id === appointment.clientId);
      const matchesFilter = appointmentsFilter === 'all' || appointment.status === appointmentsFilter;
      const matchesSearch = appointmentsSearch === '' || 
        (client?.fullName.toLowerCase().includes(appointmentsSearch.toLowerCase()) ||
         client?.phone.includes(appointmentsSearch) ||
         client?.email.toLowerCase().includes(appointmentsSearch.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });

    // Prepare data for export
    const exportData = filteredAppointments.map(appointment => {
      const client = clients.find(c => c.id === appointment.clientId);
      const staff = staffMembers.find(s => s.id === appointment.staffId);
      const appointmentServices = appointment.serviceIds.map(id => 
        services.find(s => s.id === id)?.name || 'Servicio no encontrado'
      ).join(', ');

      return {
        'ID Cita': appointment.id,
        'Cliente': client?.fullName || 'Cliente no encontrado',
        'Teléfono': client?.phone || '',
        'Email': client?.email || '',
        'Especialista': staff?.name || 'No asignado',
        'Servicios': appointmentServices,
        'Fecha': appointment.date,
        'Hora': appointment.time,
        'Estado': appointment.status === 'confirmed' ? 'Confirmada' :
                 appointment.status === 'pending' ? 'Pendiente' :
                 appointment.status === 'cancelled' ? 'Cancelada' : 'Completada',
        'Total': `$${appointment.totalPrice}`,
        'Descuento': appointment.discountApplied ? `$${appointment.discountApplied}` : '',
        'Cupón Usado': appointment.couponUsed || '',
        'Fecha Creación': new Date(appointment.createdAt).toLocaleDateString('es-ES'),
        'Notas': appointment.notes || ''
      };
    });

    // Convert to CSV
    if (exportData.length === 0) {
      alert('No hay datos para exportar con los filtros actuales.');
      return;
    }

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `citas_${currentSalonName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Header with Editable Salon Name */}
      <div 
        className="rounded-xl p-6 text-white theme-transition"
        style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              ¡Bienvenido! 👋
            </h1>
            
            {/* Editable Salon Name */}
            <div className="flex items-center space-x-3">
              {isEditingSalonName ? (
                <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg p-2">
                  <input
                    type="text"
                    value={editingSalonName}
                    onChange={(e) => setEditingSalonName(e.target.value)}
                    onKeyDown={handleSalonNameKeyPress}
                    className="bg-transparent text-white placeholder-white placeholder-opacity-70 border-none outline-none text-lg font-medium min-w-0 flex-1"
                    placeholder="Nombre del salón"
                    maxLength={50}
                    autoFocus
                    disabled={salonNameLoading}
                  />
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={saveSalonName}
                      disabled={salonNameLoading}
                      className="p-1 text-white hover:text-green-200 transition-colors disabled:opacity-50"
                      title="Guardar cambios"
                    >
                      {salonNameLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={cancelEditingSalonName}
                      disabled={salonNameLoading}
                      className="p-1 text-white hover:text-red-200 transition-colors disabled:opacity-50"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 group">
                  <span className="text-lg font-medium text-white text-opacity-90">
                    Panel de administración - {currentSalonName}
                  </span>
                  <button
                    onClick={startEditingSalonName}
                    className="p-1 text-white text-opacity-70 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    title="Editar nombre del salón"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const history = getSalonSettingsHistory();
                if (history.length > 0) {
                  const lastChange = history[history.length - 1];
                  alert(`Último cambio: ${new Date(lastChange.timestamp).toLocaleString('es-ES')} por ${lastChange.updatedBy}`);
                } else {
                  alert('No hay historial de cambios disponible');
                }
              }}
              className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              title="Ver historial de cambios"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Salon Name Message */}
        {salonNameMessage && (
          <div className={`mt-4 p-3 rounded-lg border ${
            salonNameMessage.type === 'success' 
              ? 'bg-green-500 bg-opacity-20 border-green-300 text-green-100' 
              : 'bg-red-500 bg-opacity-20 border-red-300 text-red-100'
          }`}>
            <div className="flex items-center">
              {salonNameMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm font-medium">{salonNameMessage.text}</span>
            </div>
          </div>
        )}

        {/* Character Counter for Editing */}
        {isEditingSalonName && (
          <div className="mt-2 text-right">
            <span className={`text-xs ${
              editingSalonName.length > 50 ? 'text-red-200' : 
              editingSalonName.length > 40 ? 'text-yellow-200' : 'text-white text-opacity-70'
            }`}>
              {editingSalonName.length}/50 caracteres
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Citas Hoy
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                {dashboardStats.todayAppointments}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.primary || '#0ea5e9'}1a` }}
            >
              <Calendar className="w-6 h-6" style={{ color: colors?.primary || '#0ea5e9' }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Total Clientes
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                {dashboardStats.totalClients}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.success || '#10b981'}1a` }}
            >
              <Users className="w-6 h-6" style={{ color: colors?.success || '#10b981' }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Ingresos del Mes
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                ${dashboardStats.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.warning || '#f59e0b'}1a` }}
            >
              <DollarSign className="w-6 h-6" style={{ color: colors?.warning || '#f59e0b' }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-sm font-medium theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Clientes VIP
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.accent || '#8b5cf6' }}
              >
                {dashboardStats.clientsWithRewards}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.accent || '#8b5cf6'}1a` }}
            >
              <Award className="w-6 h-6" style={{ color: colors?.accent || '#8b5cf6' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <h3 
            className="text-lg font-semibold mb-4 flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <Clock className="w-5 h-5 mr-2" style={{ color: colors?.primary || '#0ea5e9' }} />
            Actividad Reciente
          </h3>
          <div className="space-y-3">
            <div 
              className="flex items-center p-3 rounded-lg theme-transition"
              style={{ backgroundColor: `${colors?.primary || '#0ea5e9'}0d` }}
            >
              <UserCheck className="w-5 h-5 mr-3" style={{ color: colors?.primary || '#0ea5e9' }} />
              <div>
                <p 
                  className="text-sm font-medium theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Nueva cita confirmada
                </p>
                <p 
                  className="text-xs theme-transition"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                >
                  Hace 15 minutos
                </p>
              </div>
            </div>
            <div 
              className="flex items-center p-3 rounded-lg theme-transition"
              style={{ backgroundColor: `${colors?.success || '#10b981'}0d` }}
            >
              <Gift className="w-5 h-5 mr-3" style={{ color: colors?.success || '#10b981' }} />
              <div>
                <p 
                  className="text-sm font-medium theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Recompensa generada
                </p>
                <p 
                  className="text-xs theme-transition"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                >
                  Hace 1 hora
                </p>
              </div>
            </div>
            <div 
              className="flex items-center p-3 rounded-lg theme-transition"
              style={{ backgroundColor: `${colors?.accent || '#8b5cf6'}0d` }}
            >
              <TrendingUp className="w-5 h-5 mr-3" style={{ color: colors?.accent || '#8b5cf6' }} />
              <div>
                <p 
                  className="text-sm font-medium theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Cliente alcanzó umbral VIP
                </p>
                <p 
                  className="text-xs theme-transition"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                >
                  Hace 2 horas
                </p>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <h3 
            className="text-lg font-semibold mb-4 flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <BarChart3 className="w-5 h-5 mr-2" style={{ color: colors?.success || '#10b981' }} />
            Resumen Semanal
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span 
                className="text-sm theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Citas completadas
              </span>
              <span 
                className="font-semibold theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                24
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Nuevos clientes
              </span>
              <span 
                className="font-semibold theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                8
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Recompensas otorgadas
              </span>
              <span 
                className="font-semibold theme-transition"
                style={{ color: colors?.accent || '#8b5cf6' }}
              >
                3
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-sm theme-transition"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              >
                Ingresos totales
              </span>
              <span 
                className="font-semibold theme-transition"
                style={{ color: colors?.success || '#10b981' }}
              >
                ${(dashboardStats.monthlyRevenue * 0.25).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClients = () => {
    const clients = getClients();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 
            className="text-2xl font-bold theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            Gestión de Clientes
          </h2>
          <div 
            className="px-3 py-1 rounded-full text-sm font-medium theme-transition"
            style={{ 
              backgroundColor: `${colors?.accent || '#8b5cf6'}1a`,
              color: colors?.accent || '#8b5cf6'
            }}
          >
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrado{clients.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clients.map(client => (
            <ClientRewardsCard 
              key={client.id} 
              client={client} 
              onRewardGenerated={loadDashboardData}
            />
          ))}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4" style={{ color: colors?.textSecondary || '#6b7280' }} />
            <h3 
              className="text-lg font-medium mb-2 theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              No hay clientes registrados
            </h3>
            <p 
              className="theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              Los clientes aparecerán aquí cuando realicen su primera reserva.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderAppointments = () => {
    const appointments = getAppointments();
    const clients = getClients();
    const services = getActiveServices();
    
    // Filter appointments
    const filteredAppointments = appointments.filter(appointment => {
      const client = clients.find(c => c.id === appointment.clientId);
      const matchesFilter = appointmentsFilter === 'all' || appointment.status === appointmentsFilter;
      const matchesSearch = appointmentsSearch === '' || 
        (client?.fullName.toLowerCase().includes(appointmentsSearch.toLowerCase()) ||
         client?.phone.includes(appointmentsSearch) ||
         client?.email.toLowerCase().includes(appointmentsSearch.toLowerCase()));
      
      return matchesFilter && matchesSearch;
    });

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed':
          return <CheckCircle className="w-4 h-4" style={{ color: colors?.success || '#10b981' }} />;
        case 'confirmed':
          return <CheckCircle className="w-4 h-4" style={{ color: colors?.primary || '#0ea5e9' }} />;
        case 'pending':
          return <Clock className="w-4 h-4" style={{ color: colors?.warning || '#f59e0b' }} />;
        case 'cancelled':
          return <XCircle className="w-4 h-4" style={{ color: colors?.error || '#ef4444' }} />;
        default:
          return <AlertCircle className="w-4 h-4" style={{ color: colors?.textSecondary || '#6b7280' }} />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return { 
            backgroundColor: `${colors?.success || '#10b981'}1a`, 
            color: colors?.success || '#10b981',
            borderColor: `${colors?.success || '#10b981'}33`
          };
        case 'confirmed':
          return { 
            backgroundColor: `${colors?.primary || '#0ea5e9'}1a`, 
            color: colors?.primary || '#0ea5e9',
            borderColor: `${colors?.primary || '#0ea5e9'}33`
          };
        case 'pending':
          return { 
            backgroundColor: `${colors?.warning || '#f59e0b'}1a`, 
            color: colors?.warning || '#f59e0b',
            borderColor: `${colors?.warning || '#f59e0b'}33`
          };
        case 'cancelled':
          return { 
            backgroundColor: `${colors?.error || '#ef4444'}1a`, 
            color: colors?.error || '#ef4444',
            borderColor: `${colors?.error || '#ef4444'}33`
          };
        default:
          return { 
            backgroundColor: `${colors?.textSecondary || '#6b7280'}1a`, 
            color: colors?.textSecondary || '#6b7280',
            borderColor: `${colors?.textSecondary || '#6b7280'}33`
          };
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed':
          return 'Completada';
        case 'confirmed':
          return 'Confirmada';
        case 'pending':
          return 'Pendiente';
        case 'cancelled':
          return 'Cancelada';
        default:
          return status;
      }
    };
    
    return (
      <div className="space-y-6">
        {/* Header with Export */}
        <div className="flex items-center justify-between">
          <div>
            <h2 
              className="text-2xl font-bold theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              Gestión de Citas
            </h2>
            <p 
              className="mt-1 theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              {filteredAppointments.length} de {appointments.length} citas
            </p>
          </div>
          
          <button
            onClick={exportToExcel}
            className="flex items-center px-4 py-2 text-white rounded-lg transition-colors theme-transition"
            style={{ backgroundColor: colors?.success || '#10b981' }}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar a Excel
          </button>
        </div>

        {/* Filters */}
        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono o email..."
                value={appointmentsSearch}
                onChange={(e) => setAppointmentsSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
                style={{ 
                  border: `1px solid ${colors?.border || '#e5e7eb'}`,
                  backgroundColor: colors?.background || '#f8fafc',
                  color: colors?.text || '#1f2937'
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: colors?.textSecondary || '#6b7280' }}
              />
              <select
                value={appointmentsFilter}
                onChange={(e) => setAppointmentsFilter(e.target.value as any)}
                className="w-full pl-10 pr-8 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
                style={{ 
                  border: `1px solid ${colors?.border || '#e5e7eb'}`,
                  backgroundColor: colors?.background || '#f8fafc',
                  color: colors?.text || '#1f2937'
                }}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div 
          className="rounded-xl shadow-lg overflow-hidden theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead 
                className="theme-transition"
                style={{ backgroundColor: colors?.background || '#f8fafc' }}
              >
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    Cliente
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    Especialista
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    Fecha y Hora
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    Estado
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    Total
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody 
                className="divide-y theme-transition"
                style={{ 
                  backgroundColor: colors?.surface || '#ffffff',
                  borderColor: colors?.border || '#e5e7eb'
                }}
              >
                {filteredAppointments.map(appointment => {
                  const client = clients.find(c => c.id === appointment.clientId);
                  const staff = staffMembers.find(s => s.id === appointment.staffId);
                  const isUpdating = updatingStatus === appointment.id;
                  const statusColors = getStatusColor(appointment.status);
                  
                  return (
                    <tr key={appointment.id} className="hover:bg-opacity-50 transition-colors theme-transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div 
                              className="text-sm font-medium theme-transition"
                              style={{ color: colors?.text || '#1f2937' }}
                            >
                              {client?.fullName || 'Cliente no encontrado'}
                            </div>
                            <div 
                              className="text-sm theme-transition"
                              style={{ color: colors?.textSecondary || '#6b7280' }}
                            >
                              {client?.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="text-sm theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          {staff?.name || 'No asignado'}
                        </div>
                        <div 
                          className="text-sm theme-transition"
                          style={{ color: colors?.textSecondary || '#6b7280' }}
                        >
                          {staff?.role || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="text-sm theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          {new Date(`${appointment.date}T${appointment.time}`).toLocaleString('es-ES')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(appointment.status)}
                          <span 
                            className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full border theme-transition"
                            style={{
                              backgroundColor: statusColors.backgroundColor,
                              color: statusColors.color,
                              borderColor: statusColors.borderColor
                            }}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span 
                            className="text-sm theme-transition"
                            style={{ color: colors?.text || '#1f2937' }}
                          >
                            ${appointment.totalPrice.toLocaleString()}
                          </span>
                          {appointment.discountApplied && (
                            <div 
                              className="text-xs theme-transition"
                              style={{ color: colors?.success || '#10b981' }}
                            >
                              Descuento: -${appointment.discountApplied}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {isUpdating ? (
                            <RefreshCw 
                              className="w-4 h-4 animate-spin"
                              style={{ color: colors?.textSecondary || '#6b7280' }}
                            />
                          ) : (
                            <>
                              {appointment.status !== 'confirmed' && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                                  className="flex items-center transition-colors"
                                  style={{ color: colors?.primary || '#0ea5e9' }}
                                  title="Confirmar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                                  className="flex items-center transition-colors"
                                  style={{ color: colors?.success || '#10b981' }}
                                  title="Completar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                                  className="flex items-center transition-colors"
                                  style={{ color: colors?.error || '#ef4444' }}
                                  title="Cancelar"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: colors?.textSecondary || '#6b7280' }} />
            <h3 
              className="text-lg font-medium mb-2 theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              {appointmentsSearch || appointmentsFilter !== 'all' 
                ? 'No se encontraron citas con los filtros aplicados'
                : 'No hay citas registradas'
              }
            </h3>
            <p 
              className="theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              {appointmentsSearch || appointmentsFilter !== 'all'
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Las citas aparecerán aquí cuando los clientes realicen reservas.'
              }
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen theme-transition"
      style={{ backgroundColor: colors?.background || '#f8fafc' }}
    >
      {/* Header */}
      <div 
        className="shadow-sm border-b theme-transition"
        style={{ 
          backgroundColor: colors?.surface || '#ffffff',
          borderColor: colors?.border || '#e5e7eb'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 
                className="text-xl font-semibold theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                Panel Administrativo
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {notifications > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6" style={{ color: colors?.textSecondary || '#6b7280' }} />
                  <span 
                    className="absolute -top-2 -right-2 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ backgroundColor: colors?.error || '#ef4444' }}
                  >
                    {notifications}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <span 
                  className="text-sm theme-transition"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                >
                  
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm rounded-lg transition-colors theme-transition"
                  style={{ 
                    color: colors?.error || '#ef4444',
                    backgroundColor: `${colors?.error || '#ef4444'}0d`
                  }}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav 
              className="rounded-xl shadow-lg p-4 theme-transition"
              style={{ backgroundColor: colors?.surface || '#ffffff' }}
            >
              <ul className="space-y-2">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                  { id: 'clients', label: 'Clientes', icon: Users },
                  { id: 'appointments', label: 'Citas', icon: Calendar },
                  { id: 'services', label: 'Servicios', icon: Scissors },
                  { id: 'staff', label: 'Personal', icon: UserPlus },
                  { id: 'rewards', label: 'Recompensas', icon: Gift },
                  { id: 'themes', label: 'Temas', icon: Palette },
                  { id: 'salon-settings', label: 'Configuración del Salón', icon: Building2 },
                  { id: 'credentials', label: 'Gestionar Credenciales', icon: Key }
                ].map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id as any)}
                        className="w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors theme-transition"
                        style={{
                          backgroundColor: isActive ? `${colors?.primary || '#0ea5e9'}1a` : 'transparent',
                          color: isActive ? (colors?.primary || '#0ea5e9') : (colors?.textSecondary || '#6b7280')
                        }}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                        {item.id === 'rewards' && notifications > 0 && (
                          <span 
                            className="ml-auto text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                            style={{ backgroundColor: colors?.error || '#ef4444' }}
                          >
                            {notifications}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'clients' && renderClients()}
            {activeTab === 'appointments' && renderAppointments()}
            {activeTab === 'services' && <ServicesManager />}
            {activeTab === 'staff' && <StaffManager />}
            {activeTab === 'rewards' && <RewardsManager />}
            {activeTab === 'themes' && <ThemeManager />}
            {activeTab === 'salon-settings' && <SalonSettings />}
            {activeTab === 'credentials' && <CredentialsManager />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;