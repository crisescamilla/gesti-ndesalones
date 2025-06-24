import React, { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AccessControlProps {
  onAccessGranted: () => void;
}

const AccessControl: React.FC<AccessControlProps> = ({ onAccessGranted }) => {
  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const CORRECT_KEY = 'RegNeg2024';
  const MAX_ATTEMPTS = 3;
  const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutos

  useEffect(() => {
    // Check if user is currently blocked
    const blockData = localStorage.getItem('srcn-access-block');
    if (blockData) {
      const { blockedUntil, attemptCount } = JSON.parse(blockData);
      const now = Date.now();
      
      if (now < blockedUntil) {
        setIsBlocked(true);
        setBlockTimeRemaining(blockedUntil - now);
        setAttempts(attemptCount);
      } else {
        // Block expired, clear it
        localStorage.removeItem('srcn-access-block');
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
            setAttempts(0);
            localStorage.removeItem('srcn-access-block');
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTimeRemaining]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError('Acceso bloqueado. Espere a que termine el tiempo de bloqueo.');
      return;
    }

    setLoading(true);
    setError('');

    // Simulate processing delay
    setTimeout(() => {
      if (accessKey === CORRECT_KEY) {
        // Access granted
        localStorage.setItem('srcn-access-granted', Date.now().toString());
        localStorage.removeItem('srcn-access-block');
        onAccessGranted();
      } else {
        // Access denied
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          // Block user
          const blockedUntil = Date.now() + BLOCK_DURATION;
          localStorage.setItem('srcn-access-block', JSON.stringify({
            blockedUntil,
            attemptCount: newAttempts
          }));
          setIsBlocked(true);
          setBlockTimeRemaining(BLOCK_DURATION);
          setError('Demasiados intentos fallidos. Acceso bloqueado por 15 minutos.');
        } else {
          setError(`Clave incorrecta. Intentos restantes: ${MAX_ATTEMPTS - newAttempts}`);
        }
        
        setAccessKey('');
      }
      setLoading(false);
    }, 1500);
  };

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full shadow-lg">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sistema de Registro y Consulta de Negocios
          </h1>
          <p className="text-xl text-blue-200">
            (SRCN)
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">Control de Acceso Autorizado</h2>
            <p className="text-blue-100 text-sm">
              Para acceder a las funcionalidades del sistema, proporcione su clave de acceso autorizada.
            </p>
          </div>

          {/* Card Content */}
          <div className="p-8">
            {/* Access Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave de Acceso <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ingrese la clave de acceso"
                    disabled={isBlocked || loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isBlocked || loading}
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                  {isBlocked && (
                    <p className="text-xs text-red-600 mt-1">
                      Tiempo restante: {formatTime(blockTimeRemaining)}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isBlocked || loading || !accessKey.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : isBlocked ? (
                  `Bloqueado (${formatTime(blockTimeRemaining)})`
                ) : (
                  'Verificar Acceso'
                )}
              </button>
            </form>

            {/* System Information */}
            <div className="mt-8 space-y-6">
              {/* Modules Info */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-4">Funcionalidades del Sistema</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">📝 MÓDULO DE REGISTRO</h4>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Registro de nuevos negocios</li>
                      <li>• Configuración de marca personalizada</li>
                      <li>• Gestión de propietarios</li>
                      <li>• URLs personalizadas</li>
                      <li>• Configuración inicial automática</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">🔍 MÓDULO DE CONSULTA</h4>
                    <ul className="text-sm text-blue-600 space-y-1">
                      <li>• Visualización de negocios registrados</li>
                      <li>• Búsqueda por nombre y tipo</li>
                      <li>• Acceso a paneles administrativos</li>
                      <li>• Gestión multi-tenant</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Security Warning */}
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-2">⚠️ ADVERTENCIA DE SEGURIDAD</h4>
                    <p className="text-sm text-amber-700 mb-3">
                      Una clave incorrecta bloqueará su acceso temporalmente. Después de {MAX_ATTEMPTS} intentos 
                      fallidos, el sistema se bloqueará por 15 minutos.
                    </p>
                    <div className="bg-amber-100 rounded-lg p-3">
                      <p className="text-xs text-amber-800">
                        <strong>Clave de acceso:</strong> RegNeg2024<br />
                        <strong>Validez:</strong> 3 minutos después del acceso<br />
                        <strong>Soporte técnico:</strong> cescamilla@arkusnexus.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attempts Counter */}
              {attempts > 0 && !isBlocked && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">
                      Intentos fallidos: {attempts}/{MAX_ATTEMPTS}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-blue-200 text-sm">
          <p>Sistema de Registro y Consulta de Negocios v2.0</p>
          <p className="mt-1">Acceso restringido - Solo personal autorizado</p>
        </div>
      </div>
    </div>
  );
};

export default AccessControl;
