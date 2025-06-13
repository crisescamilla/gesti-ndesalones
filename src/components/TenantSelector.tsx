import React, { useState, useEffect } from 'react';
import { Plus, Building2, Search, ArrowRight, Sparkles, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Tenant } from '../types/tenant';
import { getTenants, businessTypeConfigs } from '../utils/tenantManager';
import { useTenantURL } from '../hooks/useTenant';

const TenantSelector: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>('all');
  const [showRegistrationAccess, setShowRegistrationAccess] = useState(false);
  const [registrationAccessKey, setRegistrationAccessKey] = useState('');
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [accessAttempts, setAccessAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const { navigateToTenant } = useTenantURL();

  const REGISTRATION_KEY = 'RegNeg2024';
  const MAX_ATTEMPTS = 3;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos

  useEffect(() => {
    loadTenants();
    
    // Check if user is currently blocked for registration
    const blockData = localStorage.getItem('registration-access-block');
    if (blockData) {
      const { blockedUntil, attemptCount } = JSON.parse(blockData);
      const now = Date.now();
      
      if (now < blockedUntil) {
        setIsBlocked(true);
        setBlockTimeRemaining(blockedUntil - now);
        setAccessAttempts(attemptCount);
      } else {
        // Block expired, clear it
        localStorage.removeItem('registration-access-block');
      }
    }
  }, []);

  useEffect(() => {
    // Update block timer
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1000) {
            setIsBlocked(false);
            setAccessAttempts(0);
            localStorage.removeItem('registration-access-block');
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTimeRemaining]);

  const loadTenants = () => {
    const allTenants = getTenants().filter(t => t.isActive);
    setTenants(allTenants);
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedBusinessType === 'all' || tenant.businessType === selectedBusinessType;
    return matchesSearch && matchesType;
  });

  const getBusinessTypeConfig = (type: string) => {
    return businessTypeConfigs.find(config => config.id === type);
  };

  const handleTenantSelect = (tenant: Tenant) => {
    navigateToTenant(tenant.slug);
  };

  const handleRegistrationClick = () => {
    if (isBlocked) {
      setAccessError('Acceso bloqueado. Espere a que termine el tiempo de bloqueo.');
      return;
    }
    
    setShowRegistrationAccess(true);
    setAccessError('');
    setRegistrationAccessKey('');
  };

  const handleRegistrationAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setAccessError('Acceso bloqueado. Espere a que termine el tiempo de bloqueo.');
      return;
    }

    setAccessError('');

    if (registrationAccessKey === REGISTRATION_KEY) {
      // Access granted - proceed to registration
      localStorage.setItem('registration-access-granted', Date.now().toString());
      localStorage.removeItem('registration-access-block');
      window.location.href = '/register';
    } else {
      // Access denied
      const newAttempts = accessAttempts + 1;
      setAccessAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        // Block user
        const blockedUntil = Date.now() + BLOCK_DURATION;
        localStorage.setItem('registration-access-block', JSON.stringify({
          blockedUntil,
          attemptCount: newAttempts
        }));
        setIsBlocked(true);
        setBlockTimeRemaining(BLOCK_DURATION);
        setAccessError('Demasiados intentos fallidos. Acceso bloqueado por 15 minutos.');
        setShowRegistrationAccess(false);
      } else {
        setAccessError(`Clave incorrecta. Intentos restantes: ${MAX_ATTEMPTS - newAttempts}`);
      }
      
      setRegistrationAccessKey('');
    }
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const closeRegistrationAccess = () => {
    setShowRegistrationAccess(false);
    setRegistrationAccessKey('');
    setAccessError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Ark Business Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Plataforma integral para la gestión de negocios de belleza y bienestar
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar negocio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedBusinessType}
                onChange={(e) => setSelectedBusinessType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todos los tipos</option>
                {businessTypeConfigs.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tenants Grid */}
        <div className="max-w-6xl mx-auto">
          {filteredTenants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredTenants.map(tenant => {
                const businessConfig = getBusinessTypeConfig(tenant.businessType);
                return (
                  <div
                    key={tenant.id}
                    onClick={() => handleTenantSelect(tenant)}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                  >
                    <div 
                      className="h-24 relative"
                      style={{ 
                        background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.secondaryColor})` 
                      }}
                    >
                      <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold text-lg truncate">
                          {tenant.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                          {businessConfig?.name}
                        </span>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {tenant.description}
                      </p>

                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Building2 className="w-3 h-3 mr-2" />
                          <span className="truncate">{tenant.address}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">URL:</span>
                          <span className="ml-1 text-purple-600">/{tenant.slug}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            tenant.subscription.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tenant.subscription.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            Plan {tenant.subscription.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No se encontraron negocios
              </h3>
              <p className="text-gray-600">
                {searchTerm || selectedBusinessType !== 'all' 
                  ? 'Intenta cambiar los filtros de búsqueda'
                  : 'Aún no hay negocios registrados en la plataforma'
                }
              </p>
            </div>
          )}

          {/* Registration Button */}
          <div className="text-center">
            <button
              onClick={handleRegistrationClick}
              disabled={isBlocked}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 mr-2" />
              {isBlocked ? `Bloqueado (${formatTime(blockTimeRemaining)})` : 'Registrar Nuevo Negocio'}
            </button>
            
            {/* Error message for blocked state */}
            {isBlocked && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-800">Acceso Temporalmente Bloqueado</p>
                    <p className="text-xs text-red-600 mt-1">
                      Demasiados intentos fallidos. Tiempo restante: {formatTime(blockTimeRemaining)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            ¿Por qué elegir nuestra plataforma?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Gestión Completa',
                description: 'Administra citas, clientes, servicios y personal desde un solo lugar',
                icon: '📊'
              },
              {
                title: 'URL Personalizada',
                description: 'Cada negocio tiene su propia URL para reservas online',
                icon: '🌐'
              },
              {
                title: 'Multi-Negocio',
                description: 'Gestiona múltiples sucursales o tipos de negocio',
                icon: '🏢'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg text-center">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          Hecho por{' '}
          <a 
            href="https://www.linkedin.com/in/cristian-escamilla" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-purple-600 hover:underline"
          >
            Cristian Escamilla
          </a>
        </div>
      </div>

      {/* Registration Access Control Modal */}
      {showRegistrationAccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="w-6 h-6 mr-3" />
                  <h3 className="text-lg font-semibold">Control de Acceso</h3>
                </div>
                <button
                  onClick={closeRegistrationAccess}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-purple-100 text-sm mt-2">
                Ingresa la clave de acceso para registrar un nuevo negocio
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <form onSubmit={handleRegistrationAccessSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clave de Acceso para Registro <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showAccessKey ? 'text' : 'password'}
                      value={registrationAccessKey}
                      onChange={(e) => setRegistrationAccessKey(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Ingrese la clave de registro"
                      disabled={isBlocked}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAccessKey(!showAccessKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isBlocked}
                    >
                      {showAccessKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {accessError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <p className="text-sm text-red-700 font-medium">{accessError}</p>
                    </div>
                  </div>
                )}

                {/* Attempts Counter */}
                {accessAttempts > 0 && !isBlocked && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-700">
                        Intentos fallidos: {accessAttempts}/{MAX_ATTEMPTS}
                      </p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isBlocked || !registrationAccessKey.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBlocked ? `Bloqueado (${formatTime(blockTimeRemaining)})` : 'Verificar y Continuar'}
                </button>
              </form>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 text-sm">Información de Seguridad</h4>
                    <ul className="text-xs text-blue-700 mt-1 space-y-1">
                      <li>• Máximo {MAX_ATTEMPTS} intentos antes del bloqueo</li>
                      <li>• Bloqueo automático por 15 minutos tras fallos</li>
                      <li>• Clave requerida para cada registro de negocio</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSelector;