import React, { useState, useEffect } from 'react';
import { Save, Settings, AlertCircle, CheckCircle, History, Shield, Edit3, MapPin, Clock, Phone, Mail, Instagram, Facebook } from 'lucide-react';
import { SalonSettings as SalonSettingsType } from '../types';
import { 
  getSalonSettings, 
  saveSalonSettings, 
  getSalonSettingsHistory,
  saveSalonSettingsHistory 
} from '../utils/salonSettings';
import { getCurrentUser } from '../utils/auth';
import { useTheme } from '../hooks/useTheme';

const SalonSettings: React.FC = () => {
  const [settings, setSettings] = useState<SalonSettingsType>(getSalonSettings());
  const [formData, setFormData] = useState({
    salonName: settings.salonName,
    salonMotto: settings.salonMotto,
    address: 'Av. Revolución 1234, Zona Centro, Tijuana, BC 22000, México',
    phone: '664-563-6423',
    email: 'info@bellavitaspa.com',
    whatsapp: '526645636423',
    instagram: '@bellavitaspa',
    facebook: 'Bella Vita Spa',
    website: 'https://bellavitaspa.com',
    hours: {
      monday: { open: '09:00', close: '19:00', isOpen: true },
      tuesday: { open: '09:00', close: '19:00', isOpen: true },
      wednesday: { open: '09:00', close: '19:00', isOpen: true },
      thursday: { open: '09:00', close: '19:00', isOpen: true },
      friday: { open: '09:00', close: '19:00', isOpen: true },
      saturday: { open: '09:00', close: '18:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: true }
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(getSalonSettingsHistory());
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'hours'>('basic');
  
  const currentUser = getCurrentUser();

  // Real-time theme
  const { colors } = useTheme();

  useEffect(() => {
    // Refresh settings and form data when component mounts
    const currentSettings = getSalonSettings();
    setSettings(currentSettings);
    setFormData(prev => ({
      ...prev,
      salonName: currentSettings.salonName,
      salonMotto: currentSettings.salonMotto
    }));
  }, []);

  useEffect(() => {
    // Clear message after 5 seconds
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setMessage(null); // Clear any existing messages when user types
  };

  const handleHoursChange = (day: string, field: 'open' | 'close' | 'isOpen', value: any) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day as keyof typeof prev.hours],
          [field]: value
        }
      }
    }));
  };

  const handleSaveChanges = async () => {
    if (!currentUser) {
      setMessage({ type: 'error', text: 'Usuario no autenticado' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const oldSettings = getSalonSettings();
      
      // Save settings without CSRF token validation
      const result = saveSalonSettings(
        {
          salonName: formData.salonName,
          salonMotto: formData.salonMotto
        }, 
        currentUser.username
      );

      if (result.success) {
        const newSettings = getSalonSettings();
        setSettings(newSettings);
        
        // Save to history if there were actual changes
        if (oldSettings.salonName !== newSettings.salonName || 
            oldSettings.salonMotto !== newSettings.salonMotto) {
          saveSalonSettingsHistory(oldSettings, newSettings);
          setHistory(getSalonSettingsHistory());
        }
        
        setMessage({ type: 'success', text: '¡Configuración guardada exitosamente!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al guardar' });
      }
    } catch (error) {
      console.error('Error saving salon settings:', error);
      setMessage({ type: 'error', text: 'Error del sistema al guardar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = formData.salonName !== settings.salonName || 
                    formData.salonMotto !== settings.salonMotto;

  const isFormValid = formData.salonName.trim().length > 0 && 
                     formData.salonMotto.trim().length > 0 &&
                     formData.salonName.length <= 50 &&
                     formData.salonMotto.length <= 100;

  const getDayName = (day: string) => {
    const names = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return names[day as keyof typeof names] || day;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 
            className="text-2xl font-bold flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <Settings className="w-8 h-8 mr-3" style={{ color: colors?.accent || '#8b5cf6' }} />
            Configuración del Salón
          </h2>
          <p 
            className="mt-1 theme-transition"
            style={{ color: colors?.textSecondary || '#6b7280' }}
          >
            Personaliza la información y configuración de tu salón de belleza
          </p>
        </div>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center px-4 py-2 rounded-lg transition-colors theme-transition"
          style={{ 
            backgroundColor: colors?.background || '#f8fafc',
            color: colors?.textSecondary || '#6b7280'
          }}
        >
          <History className="w-4 h-4 mr-2" />
          Historial
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div 
          className="p-4 rounded-lg border theme-transition"
          style={{
            backgroundColor: message.type === 'success' ? `${colors?.success || '#10b981'}0d` : `${colors?.error || '#ef4444'}0d`,
            borderColor: message.type === 'success' ? `${colors?.success || '#10b981'}33` : `${colors?.error || '#ef4444'}33`,
            color: message.type === 'success' ? (colors?.success || '#10b981') : (colors?.error || '#ef4444')
          }}
        >
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div 
        className="rounded-xl shadow-lg theme-transition"
        style={{ backgroundColor: colors?.surface || '#ffffff' }}
      >
        <div 
          className="border-b theme-transition"
          style={{ borderColor: colors?.border || '#e5e7eb' }}
        >
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'basic', label: 'Información Básica', icon: Edit3 },
              { id: 'contact', label: 'Información de Contacto', icon: Phone },
              { id: 'hours', label: 'Horarios de Atención', icon: Clock }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors theme-transition"
                  style={{
                    borderBottomColor: isActive ? (colors?.accent || '#8b5cf6') : 'transparent',
                    color: isActive ? (colors?.accent || '#8b5cf6') : (colors?.textSecondary || '#6b7280')
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Information Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Salon Name Field */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2 theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Nombre del Salón
                  <span style={{ color: colors?.error || '#ef4444' }} className="ml-1">*</span>
                </label>
                <div className="relative">
                  <Edit3 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  />
                  <input
                    type="text"
                    value={formData.salonName}
                    onChange={(e) => handleInputChange('salonName', e.target.value)}
                    placeholder="Ej: Bella Vita Spa"
                    maxLength={50}
                    className="w-full pl-10 pr-16 py-3 rounded-lg focus:ring-2 focus:border-transparent transition-all theme-transition"
                    style={{ 
                      border: `1px solid ${colors?.border || '#e5e7eb'}`,
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.text || '#1f2937'
                    }}
                    disabled={loading}
                  />
                  <div 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    {formData.salonName.length}/50
                  </div>
                </div>
                {formData.salonName.length > 50 && (
                  <p 
                    className="text-xs mt-1 flex items-center"
                    style={{ color: colors?.error || '#ef4444' }}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    El nombre no puede exceder 50 caracteres
                  </p>
                )}
              </div>

              {/* Salon Motto Field */}
              <div>
                <label 
                  className="block text-sm font-medium mb-2 theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  Lema del Salón
                  <span style={{ color: colors?.error || '#ef4444' }} className="ml-1">*</span>
                </label>
                <div className="relative">
                  <textarea
                    value={formData.salonMotto}
                    onChange={(e) => handleInputChange('salonMotto', e.target.value)}
                    placeholder="Ej: Tu destino de belleza y relajación"
                    maxLength={100}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:border-transparent transition-all resize-none theme-transition"
                    style={{ 
                      border: `1px solid ${colors?.border || '#e5e7eb'}`,
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.text || '#1f2937'
                    }}
                    disabled={loading}
                  />
                  <div 
                    className="absolute bottom-3 right-3 text-sm theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    {formData.salonMotto.length}/100
                  </div>
                </div>
                {formData.salonMotto.length > 100 && (
                  <p 
                    className="text-xs mt-1 flex items-center"
                    style={{ color: colors?.error || '#ef4444' }}
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    El lema no puede exceder 100 caracteres
                  </p>
                )}
              </div>

              {/* Save Button */}
              <div 
                className="flex items-center justify-between pt-4 border-t theme-transition"
                style={{ borderColor: colors?.border || '#e5e7eb' }}
              >
                <div className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" style={{ color: colors?.success || '#10b981' }} />
                  <span style={{ color: colors?.textSecondary || '#6b7280' }}>Protección CSRF deshabilitada</span>
                </div>
                
                <button
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || !isFormValid || loading}
                  className="flex items-center px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed theme-transition"
                  style={{ backgroundColor: colors?.accent || '#8b5cf6' }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}

          {/* Contact Information Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div 
                className="rounded-lg p-4 border theme-transition"
                style={{ 
                  backgroundColor: `${colors?.primary || '#0ea5e9'}0d`,
                  borderColor: `${colors?.primary || '#0ea5e9'}33`
                }}
              >
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 mt-0.5" style={{ color: colors?.primary || '#0ea5e9' }} />
                  <div>
                    <h4 
                      className="font-medium theme-transition"
                      style={{ color: colors?.primary || '#0ea5e9' }}
                    >
                      Información de Solo Lectura
                    </h4>
                    <p 
                      className="text-sm mt-1 theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      Esta información se muestra en la página principal. Para cambios, contacta al desarrollador.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Address */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Dirección
                  </label>
                  <textarea
                    value={formData.address}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg theme-transition"
                    style={{ 
                      border: `1px solid ${colors?.border || '#e5e7eb'}`,
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.textSecondary || '#6b7280'
                    }}
                    rows={3}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg theme-transition"
                    style={{ 
                      border: `1px solid ${colors?.border || '#e5e7eb'}`,
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.textSecondary || '#6b7280'
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg theme-transition"
                    style={{ 
                      border: `1px solid ${colors?.border || '#e5e7eb'}`,
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.textSecondary || '#6b7280'
                    }}
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    💬 WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg theme-transition"
                    style={{ 
                      border: `1px solid ${colors?.border || '#e5e7eb'}`,
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.textSecondary || '#6b7280'
                    }}
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    <Instagram className="w-4 h-4 inline mr-1" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg theme-transition"
                    style={{ 
                      border: `1px solid ${colors?.border || '#e5e7eb'}`,
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.textSecondary || '#6b7280'
                    }}
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label 
                    className="block text-sm font-medium mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    <Facebook className="w-4 h-4 inline mr-1" />
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={formData.facebook}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg theme-transition"
                    style={{ 
                      border: `1px solid ${colors?.border || '#e5e7eb'}`,
                      backgroundColor: colors?.background || '#f8fafc',
                      color: colors?.textSecondary || '#6b7280'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hours Tab */}
          {activeTab === 'hours' && (
            <div className="space-y-6">
              <div 
                className="rounded-lg p-4 border theme-transition"
                style={{ 
                  backgroundColor: `${colors?.warning || '#f59e0b'}0d`,
                  borderColor: `${colors?.warning || '#f59e0b'}33`
                }}
              >
                <div className="flex items-start">
                  <Clock className="w-5 h-5 mr-2 mt-0.5" style={{ color: colors?.warning || '#f59e0b' }} />
                  <div>
                    <h4 
                      className="font-medium theme-transition"
                      style={{ color: colors?.warning || '#f59e0b' }}
                    >
                      Horarios de Atención
                    </h4>
                    <p 
                      className="text-sm mt-1 theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      Estos horarios se muestran en la página principal para informar a los clientes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(formData.hours).map(([day, schedule]) => (
                  <div 
                    key={day} 
                    className="flex items-center justify-between p-4 border rounded-lg theme-transition"
                    style={{ 
                      backgroundColor: colors?.surface || '#ffffff',
                      borderColor: colors?.border || '#e5e7eb'
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-20">
                        <span 
                          className="font-medium theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          {getDayName(day)}
                        </span>
                      </div>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={schedule.isOpen}
                          onChange={(e) => handleHoursChange(day, 'isOpen', e.target.checked)}
                          className="w-4 h-4 rounded focus:ring-2 theme-transition"
                          style={{ accentColor: colors?.accent || '#8b5cf6' }}
                        />
                        <span 
                          className="ml-2 text-sm theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          Abierto
                        </span>
                      </label>
                    </div>

                    {schedule.isOpen && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={schedule.open}
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                          className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                          style={{ 
                            border: `1px solid ${colors?.border || '#e5e7eb'}`,
                            backgroundColor: colors?.background || '#f8fafc',
                            color: colors?.text || '#1f2937'
                          }}
                        />
                        <span style={{ color: colors?.textSecondary || '#6b7280' }}>a</span>
                        <input
                          type="time"
                          value={schedule.close}
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                          className="px-3 py-2 rounded-lg focus:ring-2 theme-transition"
                          style={{ 
                            border: `1px solid ${colors?.border || '#e5e7eb'}`,
                            backgroundColor: colors?.background || '#f8fafc',
                            color: colors?.text || '#1f2937'
                          }}
                        />
                      </div>
                    )}

                    {!schedule.isOpen && (
                      <span 
                        className="font-medium theme-transition"
                        style={{ color: colors?.error || '#ef4444' }}
                      >
                        Cerrado
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div 
                className="rounded-lg p-4 border theme-transition"
                style={{ 
                  backgroundColor: `${colors?.success || '#10b981'}0d`,
                  borderColor: `${colors?.success || '#10b981'}33`
                }}
              >
                <h4 
                  className="font-medium mb-2 theme-transition"
                  style={{ color: colors?.success || '#10b981' }}
                >
                  Vista Previa de Horarios
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Object.entries(formData.hours).map(([day, schedule]) => (
                    <div key={day} className="flex justify-between">
                      <span 
                        className="font-medium theme-transition"
                        style={{ color: colors?.text || '#1f2937' }}
                      >
                        {getDayName(day)}:
                      </span>
                      <span 
                        className="theme-transition"
                        style={{ color: colors?.textSecondary || '#6b7280' }}
                      >
                        {schedule.isOpen 
                          ? `${schedule.open} - ${schedule.close}`
                          : 'Cerrado'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Settings Preview */}
      <div 
        className="rounded-xl p-6 border theme-transition"
        style={{ 
          background: `linear-gradient(135deg, ${colors?.accent || '#8b5cf6'}0d, ${colors?.secondary || '#06b6d4'}0d)`,
          borderColor: `${colors?.accent || '#8b5cf6'}33`
        }}
      >
        <h3 
          className="text-lg font-semibold mb-4 theme-transition"
          style={{ color: colors?.accent || '#8b5cf6' }}
        >
          Vista Previa Actual
        </h3>
        <div className="space-y-3">
          <div>
            <span 
              className="text-sm font-medium theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              Nombre:
            </span>
            <p 
              className="text-xl font-bold theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              {settings.salonName}
            </p>
          </div>
          <div>
            <span 
              className="text-sm font-medium theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              Lema:
            </span>
            <p 
              className="italic theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              "{settings.salonMotto}"
            </p>
          </div>
          <div 
            className="text-xs pt-2 border-t theme-transition"
            style={{ 
              color: colors?.textSecondary || '#6b7280',
              borderColor: `${colors?.accent || '#8b5cf6'}33`
            }}
          >
            Última actualización: {new Date(settings.updatedAt).toLocaleString('es-ES')} por {settings.updatedBy}
          </div>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div 
          className="rounded-xl shadow-lg p-6 theme-transition"
          style={{ backgroundColor: colors?.surface || '#ffffff' }}
        >
          <h3 
            className="text-lg font-semibold mb-4 flex items-center theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            <History className="w-5 h-5 mr-2" style={{ color: colors?.textSecondary || '#6b7280' }} />
            Historial de Cambios
          </h3>
          
          {history.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {history.slice().reverse().map((change: any) => (
                <div 
                  key={change.id} 
                  className="border rounded-lg p-4 theme-transition"
                  style={{ 
                    backgroundColor: colors?.background || '#f8fafc',
                    borderColor: colors?.border || '#e5e7eb'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="text-sm font-medium theme-transition"
                      style={{ color: colors?.text || '#1f2937' }}
                    >
                      Cambio realizado por {change.updatedBy}
                    </span>
                    <span 
                      className="text-xs theme-transition"
                      style={{ color: colors?.textSecondary || '#6b7280' }}
                    >
                      {new Date(change.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {change.changes.salonName.from !== change.changes.salonName.to && (
                      <div>
                        <span 
                          className="font-medium theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          Nombre:
                        </span>
                        <div className="ml-4">
                          <span style={{ color: colors?.error || '#ef4444' }}>- {change.changes.salonName.from}</span><br />
                          <span style={{ color: colors?.success || '#10b981' }}>+ {change.changes.salonName.to}</span>
                        </div>
                      </div>
                    )}
                    
                    {change.changes.salonMotto.from !== change.changes.salonMotto.to && (
                      <div>
                        <span 
                          className="font-medium theme-transition"
                          style={{ color: colors?.text || '#1f2937' }}
                        >
                          Lema:
                        </span>
                        <div className="ml-4">
                          <span style={{ color: colors?.error || '#ef4444' }}>- {change.changes.salonMotto.from}</span><br />
                          <span style={{ color: colors?.success || '#10b981' }}>+ {change.changes.salonMotto.to}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 mx-auto mb-3" style={{ color: colors?.textSecondary || '#6b7280' }} />
              <p style={{ color: colors?.textSecondary || '#6b7280' }}>No hay cambios registrados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SalonSettings;