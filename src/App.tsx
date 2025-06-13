import React, { useState, useEffect } from 'react';
import { Sparkles, Settings, Calendar, MapPin, Clock, Phone, Instagram, Facebook, Mail } from 'lucide-react';
import ClientBooking from './components/ClientBooking';
import AdminPanel from './components/AdminPanel';
import LoginForm from './components/LoginForm';
import { initializeDefaultAdmin, isAuthenticated, getCurrentUser } from './utils/auth';
import { initializeThemeSystem } from './utils/themeManager';
import { useSalonName, useSalonMotto } from './hooks/useSalonSettings';
import { useTheme } from './hooks/useTheme';
import { AdminUser, AuthSession } from './types';

function App() {
  const [view, setView] = useState<'home' | 'booking' | 'admin' | 'login'>('home');
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null as AdminUser | null,
    loading: true
  });

  // Real-time salon settings
  const salonName = useSalonName();
  const salonMotto = useSalonMotto();
  
  // Real-time theme
  const { activeTheme, colors } = useTheme();

  useEffect(() => {
    const initAuth = async () => {
      await initializeDefaultAdmin();
      
      const authenticated = isAuthenticated();
      const user = getCurrentUser();
      
      setAuthState({
        isAuthenticated: authenticated,
        user,
        loading: false
      });
    };

    initAuth();
    
    // Initialize theme system
    initializeThemeSystem();
  }, []);

  const handleLoginSuccess = (user: AdminUser, session: AuthSession) => {
    setAuthState({
      isAuthenticated: true,
      user,
      loading: false
    });
    setView('admin');
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    setView('home');
  };

  const handleAdminAccess = () => {
    if (authState.isAuthenticated) {
      setView('admin');
    } else {
      setView('login');
    }
  };

  if (authState.loading) {
    return (
      <div className="min-h-screen theme-transition" style={{ background: `linear-gradient(135deg, ${colors?.background || '#f8fafc'}, ${colors?.surface || '#ffffff'})` }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div 
              className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
              style={{ 
                borderColor: `${colors?.border || '#e5e7eb'}`,
                borderTopColor: colors?.primary || '#0ea5e9'
              }}
            ></div>
            <p style={{ color: colors?.textSecondary || '#6b7280' }}>Cargando sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div 
      className="min-h-screen relative overflow-hidden theme-transition"
      style={{ 
        background: `linear-gradient(135deg, ${colors?.background || '#f8fafc'}, ${colors?.surface || '#ffffff'})` 
      }}
    >
      {/* Mediterranean decorative elements with theme colors */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl"
          style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-48 h-48 rounded-full blur-3xl"
          style={{ background: `linear-gradient(135deg, ${colors?.secondary || '#06b6d4'}, ${colors?.accent || '#8b5cf6'})` }}
        ></div>
        <div 
          className="absolute bottom-40 left-1/4 w-40 h-40 rounded-full blur-3xl"
          style={{ background: `linear-gradient(135deg, ${colors?.accent || '#8b5cf6'}, ${colors?.primary || '#0ea5e9'})` }}
        ></div>
        <div 
          className="absolute bottom-20 right-1/3 w-36 h-36 rounded-full blur-3xl"
          style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div 
              className="p-4 rounded-full shadow-lg theme-transition"
              style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
            >
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 
            className="text-5xl md:text-6xl font-bold mb-6 theme-transition"
            style={{ 
              background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'}, ${colors?.accent || '#8b5cf6'})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {salonName}
          </h1>
          <p 
            className="text-xl max-w-2xl mx-auto mb-12 theme-transition"
            style={{ color: colors?.textSecondary || '#6b7280' }}
          >
            {salonMotto}
          </p>
        </div>

        {/* Solo mostrar la opción de Reservar Cita */}
        <div className="flex justify-center mb-16">
          <div 
            onClick={() => setView('booking')}
            className="group rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 max-w-md w-full theme-transition"
            style={{ 
              backgroundColor: `${colors?.surface || '#ffffff'}cc`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${colors?.border || '#e5e7eb'}33`
            }}
          >
            <div 
              className="p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform shadow-lg mx-auto theme-transition"
              style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'})` }}
            >
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 
              className="text-2xl font-bold mb-4 text-center theme-transition"
              style={{ color: colors?.text || '#1f2937' }}
            >
              Reservar Cita
            </h3>
            <p 
              className="text-center mb-6 theme-transition"
              style={{ color: colors?.textSecondary || '#6b7280' }}
            >
              Agenda tu cita de manera fácil y rápida. Selecciona tus servicios favoritos y el horario que mejor te convenga.
            </p>
            <div 
              className="flex items-center justify-center font-semibold group-hover:translate-x-1 transition-transform theme-transition"
              style={{ color: colors?.primary || '#0ea5e9' }}
            >
              <span>Comenzar reserva</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-24">
          <h2 
            className="text-3xl font-bold text-center mb-12 theme-transition"
            style={{ color: colors?.text || '#1f2937' }}
          >
            Nuestros Servicios
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Tratamientos Faciales",
                description: "Cuidado profesional para tu rostro con productos de alta calidad"
              },
              {
                title: "Servicios de Cabello",
                description: "Cortes, tintes y peinados realizados por estilistas expertos"
              },
              {
                title: "Masajes Relajantes",
                description: "Sesiones de relajación para liberar el estrés y renovar energías"
              },
              {
                title: "Cuidado de Uñas",
                description: "Manicure y pedicure con técnicas modernas y esmaltes premium"
              },
              {
                title: "Tratamientos Corporales",
                description: "Servicios integrales para el cuidado y embellecimiento corporal"
              },
              {
                title: "Productos Premium",
                description: "Línea exclusiva de productos para el cuidado personal"
              }
            ].map((service, index) => (
              <div 
                key={index} 
                className="rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 theme-transition"
                style={{ 
                  backgroundColor: `${colors?.surface || '#ffffff'}b3`,
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${colors?.border || '#e5e7eb'}4d`
                }}
              >
                <h3 
                  className="text-xl font-semibold mb-3 text-center theme-transition"
                  style={{ color: colors?.text || '#1f2937' }}
                >
                  {service.title}
                </h3>
                <p 
                  className="text-center theme-transition"
                  style={{ color: colors?.textSecondary || '#6b7280' }}
                >
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information Panel */}
        <div className="max-w-6xl mx-auto mb-16">
          <div 
            className="rounded-3xl shadow-xl overflow-hidden theme-transition"
            style={{ 
              backgroundColor: `${colors?.surface || '#ffffff'}cc`,
              backdropFilter: 'blur(8px)',
              border: `1px solid ${colors?.border || '#e5e7eb'}33`
            }}
          >
            <div 
              className="p-8 text-white text-center theme-transition"
              style={{ background: `linear-gradient(135deg, ${colors?.primary || '#0ea5e9'}, ${colors?.secondary || '#06b6d4'}, ${colors?.accent || '#8b5cf6'})` }}
            >
              <h2 className="text-3xl font-bold mb-2">📍 Visítanos</h2>
              <p className="opacity-90">Información de contacto y ubicación</p>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Location */}
                <div className="text-center group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md theme-transition"
                    style={{ backgroundColor: `${colors?.primary || '#0ea5e9'}1a` }}
                  >
                    <MapPin className="w-8 h-8" style={{ color: colors?.primary || '#0ea5e9' }} />
                  </div>
                  <h3 
                    className="text-lg font-semibold mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    Ubicación
                  </h3>
                  <p 
                    className="text-sm leading-relaxed theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    Av. Revolución 1234<br />
                    Zona Centro<br />
                    Tijuana, BC 22000<br />
                    México
                  </p>
                  <a 
                    href="https://maps.google.com/?q=Av.+Revolución+1234+Tijuana+BC" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-3 font-medium text-sm transition-colors theme-transition"
                    style={{ color: colors?.primary || '#0ea5e9' }}
                  >
                    Ver en Google Maps →
                  </a>
                </div>

                {/* Hours */}
                <div className="text-center group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md theme-transition"
                    style={{ backgroundColor: `${colors?.secondary || '#06b6d4'}1a` }}
                  >
                    <Clock className="w-8 h-8" style={{ color: colors?.secondary || '#06b6d4' }} />
                  </div>
                  <h3 
                    className="text-lg font-semibold mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    Horarios
                  </h3>
                  <div 
                    className="text-sm space-y-1 theme-transition"
                    style={{ color: colors?.textSecondary || '#6b7280' }}
                  >
                    <p><strong>Lunes - Viernes:</strong><br />9:00 AM - 7:00 PM</p>
                    <p><strong>Sábados:</strong><br />9:00 AM - 6:00 PM</p>
                    <p><strong>Domingos:</strong><br />10:00 AM - 4:00 PM</p>
                  </div>
                  <div 
                    className="mt-3 px-3 py-1 rounded-full text-xs font-medium inline-block theme-transition"
                    style={{ 
                      backgroundColor: `${colors?.success || '#10b981'}1a`,
                      color: colors?.success || '#10b981'
                    }}
                  >
                    ✅ Abierto hoy
                  </div>
                </div>

                {/* Contact */}
                <div className="text-center group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md theme-transition"
                    style={{ backgroundColor: `${colors?.accent || '#8b5cf6'}1a` }}
                  >
                    <Phone className="w-8 h-8" style={{ color: colors?.accent || '#8b5cf6' }} />
                  </div>
                  <h3 
                    className="text-lg font-semibold mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    Contacto
                  </h3>
                  <div className="text-sm space-y-2">
                    <a 
                      href="tel:6645636423" 
                      className="block font-medium transition-colors theme-transition"
                      style={{ color: colors?.primary || '#0ea5e9' }}
                    >
                      📱 664-563-6423
                    </a>
                    <a 
                      href="mailto:info@bellavitaspa.com" 
                      className="block transition-colors theme-transition"
                      style={{ color: colors?.primary || '#0ea5e9' }}
                    >
                      📧 info@bellavitaspa.com
                    </a>
                    <a 
                      href="https://wa.me/526645636423" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-4 py-2 rounded-full text-xs font-medium transition-colors theme-transition"
                      style={{ 
                        backgroundColor: colors?.success || '#10b981',
                        color: 'white'
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                </div>

                {/* Social Media */}
                <div className="text-center group">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md theme-transition"
                    style={{ backgroundColor: `${colors?.secondary || '#06b6d4'}1a` }}
                  >
                    <Instagram className="w-8 h-8" style={{ color: colors?.secondary || '#06b6d4' }} />
                  </div>
                  <h3 
                    className="text-lg font-semibold mb-2 theme-transition"
                    style={{ color: colors?.text || '#1f2937' }}
                  >
                    Síguenos
                  </h3>
                  <div className="space-y-3">
                    <a 
                      href="https://instagram.com/bellavitaspa" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 transition-colors theme-transition"
                      style={{ color: colors?.secondary || '#06b6d4' }}
                    >
                      <Instagram className="w-4 h-4" />
                      <span className="text-sm font-medium">@bellavitaspa</span>
                    </a>
                    <a 
                      href="https://facebook.com/bellavitaspa" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 transition-colors theme-transition"
                      style={{ color: colors?.primary || '#0ea5e9' }}
                    >
                      <Facebook className="w-4 h-4" />
                      <span className="text-sm font-medium">{salonName}</span>
                    </a>
                    <div className="pt-2">
                      <span 
                        className="text-xs theme-transition"
                        style={{ color: colors?.textSecondary || '#6b7280' }}
                      >
                        ¡Síguenos para ofertas especiales!
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info Bar */}
              <div 
                className="mt-8 pt-8 theme-transition"
                style={{ borderTop: `1px solid ${colors?.border || '#e5e7eb'}` }}
              >
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: colors?.success || '#10b981' }}
                    ></div>
                    <span 
                      className="text-sm theme-transition"
                      style={{ color: colors?.textSecondary || '#6b7280' }}
                    >
                      Estacionamiento gratuito disponible
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: colors?.primary || '#0ea5e9' }}
                    ></div>
                    <span 
                      className="text-sm theme-transition"
                      style={{ color: colors?.textSecondary || '#6b7280' }}
                    >
                      WiFi gratuito para clientes
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: colors?.secondary || '#06b6d4' }}
                    ></div>
                    <span 
                      className="text-sm theme-transition"
                      style={{ color: colors?.textSecondary || '#6b7280' }}
                    >
                      Productos premium certificados
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Admin Button - Bottom Right */}
      <button
        onClick={handleAdminAccess}
        className="fixed bottom-6 right-6 z-50 group text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 theme-transition"
        style={{ background: `linear-gradient(135deg, ${colors?.accent || '#8b5cf6'}, ${colors?.primary || '#0ea5e9'})` }}
        title="Panel Administrativo"
      >
        <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        
        {/* Tooltip */}
        <div 
          className="absolute bottom-full right-0 mb-2 px-3 py-1 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap theme-transition"
          style={{ 
            backgroundColor: colors?.text || '#1f2937',
            color: colors?.surface || '#ffffff'
          }}
        >
          Panel Administrativo
          <div 
            className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
            style={{ borderTopColor: colors?.text || '#1f2937' }}
          ></div>
        </div>

        {/* Pulse animation ring */}
        <div 
          className="absolute inset-0 rounded-full opacity-30 animate-ping theme-transition"
          style={{ backgroundColor: colors?.accent || '#8b5cf6' }}
        ></div>
      </button>
    </div>
  );

  if (view === 'login') {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  if (view === 'booking') {
    return (
      <div>
        <button 
          onClick={() => setView('home')}
          className="fixed top-4 left-4 z-50 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow font-medium theme-transition"
          style={{ 
            backgroundColor: colors?.surface || '#ffffff',
            color: colors?.primary || '#0ea5e9'
          }}
        >
          ← Volver al Inicio
        </button>
        <ClientBooking />
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div>
        <button 
          onClick={() => setView('home')}
          className="fixed top-4 left-4 z-50 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow font-medium theme-transition"
          style={{ 
            backgroundColor: colors?.surface || '#ffffff',
            color: colors?.primary || '#0ea5e9'
          }}
        >
          ← Volver al Inicio
        </button>
        <AdminPanel onLogout={handleLogout} />
      </div>
    );
  }

  
  return renderHome();
}

export default App;