import React, { useState, useEffect } from 'react';
import { Gift, Settings, TrendingUp, Users, Award, Calendar, DollarSign, Percent } from 'lucide-react';
import { 
  getRewardSettings, 
  saveRewardSettings, 
  getRewardStatistics, 
  checkAllClientsForRewards,
  cleanupExpiredCoupons,
  getAdminNotifications,
  markNotificationAsRead
} from '../utils/rewards';
import { RewardSettings, AdminNotification } from '../types';
import { getCurrentUser } from '../utils/auth';
import { useTheme } from '../hooks/useTheme';

const RewardsManager: React.FC = () => {
  const [settings, setSettings] = useState<RewardSettings>(getRewardSettings());
  const [statistics, setStatistics] = useState(getRewardStatistics());
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUser = getCurrentUser();

  // Real-time theme
  const { colors } = useTheme();

  useEffect(() => {
    loadData();
    
    // Set up periodic checks
    const interval = setInterval(() => {
      checkAllClientsForRewards();
      cleanupExpiredCoupons();
      loadData();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setStatistics(getRewardStatistics());
    setNotifications(getAdminNotifications().filter(n => n.type.includes('reward') || n.type.includes('coupon')));
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const updatedSettings = {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username
      };
      
      saveRewardSettings(updatedSettings);
      setSettings(updatedSettings);
      setIsEditing(false);
      
      // Check for new rewards after settings change
      checkAllClientsForRewards();
      loadData();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    loadData();
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 
            className="text-2xl font-bold flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <Gift className="w-8 h-8 mr-3" style={{ color: colors?.accent || '#8b5cf6' }} />
            Sistema de Recompensas
          </h2>
          <p 
            className="mt-1 theme-transition"
            style={{ color: colors?.textSecondary || '#6b7280' }}
          >
            Gestiona el programa de fidelización automático
          </p>
        </div>
        
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center px-4 py-2 text-white rounded-lg transition-colors theme-transition"
          style={{ backgroundColor: colors?.accent || '#8b5cf6' }}
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurar
        </button>
      </div>

      {/* Statistics Cards */}
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
                Cupones Generados
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                {statistics.totalCouponsGenerated}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.primary || '#0ea5e9'}1a` }}
            >
              <Award className="w-6 h-6" style={{ color: colors?.primary || '#0ea5e9' }} />
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
                Cupones Utilizados
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.success || '#10b981' }}
              >
                {statistics.totalCouponsUsed}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.success || '#10b981'}1a` }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: colors?.success || '#10b981' }} />
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
                Clientes con Recompensas
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.accent || '#8b5cf6' }}
              >
                {statistics.clientsWithRewards}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.accent || '#8b5cf6'}1a` }}
            >
              <Users className="w-6 h-6" style={{ color: colors?.accent || '#8b5cf6' }} />
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
                Tasa de Uso
              </p>
              <p 
                className="text-2xl font-bold theme-transition"
                style={{ color: colors?.warning || '#f59e0b' }}
              >
                {statistics.usageRate.toFixed(1)}%
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center theme-transition"
              style={{ backgroundColor: `${colors?.warning || '#f59e0b'}1a` }}
            >
              <Percent className="w-6 h-6" style={{ color: colors?.warning || '#f59e0b' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {isEditing && (
        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <h3 
            className="text-lg font-semibold mb-4 theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            Configuración del Sistema
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label 
                className="block text-sm font-medium mb-2 theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                Umbral de Compras (MXN)
              </label>
              <div className="relative">
                <DollarSign 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                />
                <input
                  type="number"
                  value={settings.spendingThreshold}
                  onChange={(e) => setSettings({...settings, spendingThreshold: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
                  style={{ 
                    border: `1px solid ${colors?.border || '#e5e7eb'}`,
                    backgroundColor: colors?.background || '#f8fafc',
                    color: colors?.text || '#1f2937'
                  }}
                  min="1000"
                  step="500"
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2 theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                Porcentaje de Descuento (%)
              </label>
              <div className="relative">
                <Percent 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                />
                <input
                  type="number"
                  value={settings.discountPercentage}
                  onChange={(e) => setSettings({...settings, discountPercentage: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
                  style={{ 
                    border: `1px solid ${colors?.border || '#e5e7eb'}`,
                    backgroundColor: colors?.background || '#f8fafc',
                    color: colors?.text || '#1f2937'
                  }}
                  min="5"
                  max="50"
                  step="5"
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2 theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                Validez del Cupón (días)
              </label>
              <div className="relative">
                <Calendar 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                />
                <input
                  type="number"
                  value={settings.couponValidityDays}
                  onChange={(e) => setSettings({...settings, couponValidityDays: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:border-transparent theme-transition"
                  style={{ 
                    border: `1px solid ${colors?.border || '#e5e7eb'}`,
                    backgroundColor: colors?.background || '#f8fafc',
                    color: colors?.text || '#1f2937'
                  }}
                  min="7"
                  max="90"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.isActive}
                onChange={(e) => setSettings({...settings, isActive: e.target.checked})}
                className="w-4 h-4 rounded focus:ring-2 theme-transition"
                style={{ 
                  accentColor: colors?.accent || '#8b5cf6',
                  borderColor: colors?.border || '#e5e7eb'
                }}
              />
              <span 
                className="ml-2 text-sm theme-transition"
                style={{ color: colors?.text || '#1f2937' }}
              >
                Sistema activo
              </span>
            </label>

            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-lg transition-colors theme-transition"
                style={{ 
                  color: colors?.textSecondary || '#6b7280',
                  borderColor: colors?.border || '#e5e7eb',
                  backgroundColor: colors?.background || '#f8fafc'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center theme-transition"
                style={{ backgroundColor: colors?.accent || '#8b5cf6' }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : null}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {unreadNotifications.length > 0 && (
        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <h3 
            className="text-lg font-semibold mb-4 flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <Gift className="w-5 h-5 mr-2" style={{ color: colors?.accent || '#8b5cf6' }} />
            Notificaciones Recientes ({unreadNotifications.length})
          </h3>
          
          <div className="space-y-3">
            {unreadNotifications.slice(0, 5).map(notification => (
              <div
                key={notification.id}
                className="flex items-start justify-between p-4 rounded-lg border theme-transition"
                style={{ 
                  backgroundColor: `${colors?.accent || '#8b5cf6'}0d`,
                  borderColor: `${colors?.accent || '#8b5cf6'}33`
                }}
              >
                <div className="flex-1">
                  <h4 
                    className="font-medium theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    {notification.title}
                  </h4>
                  <p 
                    className="text-sm mt-1 theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    {notification.message}
                  </p>
                  <p 
                    className="text-xs mt-2 theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    {new Date(notification.createdAt).toLocaleString('es-ES')}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkNotificationRead(notification.id)}
                  className="ml-4 text-xs font-medium transition-colors theme-transition"
                  style={{ color: colors?.accent || '#8b5cf6' }}
                >
                  Marcar leída
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Settings Display */}
      <div 
        className="rounded-xl shadow-lg p-6 theme-transition"
        style={{ backgroundColor: colors?.surface || '#ffffff' }}
      >
        <h3 
          className="text-lg font-semibold mb-4 theme-transition"
          style={{ color: colors?.text || '#1f2937' }}
        >
          Configuración Actual
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            className="text-center p-4 rounded-lg theme-transition"
            style={{ backgroundColor: colors?.background || '#f8fafc' }}
          >
            <DollarSign className="w-8 h-8 mx-auto mb-2" style={{ color: colors?.success || '#10b981' }} />
            <p 
              className="text-sm theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              Umbral de Compras
            </p>
            <p 
              className="text-xl font-bold theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              ${settings.spendingThreshold.toLocaleString()}
            </p>
          </div>
          
          <div 
            className="text-center p-4 rounded-lg theme-transition"
            style={{ backgroundColor: colors?.background || '#f8fafc' }}
          >
            <Percent className="w-8 h-8 mx-auto mb-2" style={{ color: colors?.primary || '#0ea5e9' }} />
            <p 
              className="text-sm theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              Descuento
            </p>
            <p 
              className="text-xl font-bold theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              {settings.discountPercentage}%
            </p>
          </div>
          
          <div 
            className="text-center p-4 rounded-lg theme-transition"
            style={{ backgroundColor: colors?.background || '#f8fafc' }}
          >
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: colors?.warning || '#f59e0b' }} />
            <p 
              className="text-sm theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              Validez
            </p>
            <p 
              className="text-xl font-bold theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              {settings.couponValidityDays} días
            </p>
          </div>
          
          <div 
            className="text-center p-4 rounded-lg theme-transition"
            style={{ backgroundColor: colors?.background || '#f8fafc' }}
          >
            <div 
              className="w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center theme-transition"
              style={{ 
                backgroundColor: settings.isActive ? `${colors?.success || '#10b981'}1a` : `${colors?.error || '#ef4444'}1a`
              }}
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ 
                  backgroundColor: settings.isActive ? (colors?.success || '#10b981') : (colors?.error || '#ef4444')
                }}
              />
            </div>
            <p 
              className="text-sm theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              Estado
            </p>
            <p 
              className="text-xl font-bold theme-transition"
              style={{ 
                color: settings.isActive ? (colors?.success || '#10b981') : (colors?.error || '#ef4444')
              }}
            >
              {settings.isActive ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardsManager;