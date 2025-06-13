import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { authenticateUser, validatePassword } from '../utils/auth';
import { AdminUser, AuthSession } from '../types';
import { getCurrentTenant } from '../utils/tenantManager';

interface LoginFormProps {
  onLoginSuccess: (user: AdminUser, session: AuthSession) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const currentTenant = getCurrentTenant();

  useEffect(() => {
    // Check for remembered username for this tenant
    const rememberedKey = `remembered-username-${currentTenant?.id || 'default'}`;
    const rememberedUsername = localStorage.getItem(rememberedKey);
    if (rememberedUsername) {
      setFormData(prev => ({ ...prev, username: rememberedUsername }));
      setRememberMe(true);
    }
  }, [currentTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authenticateUser(formData.username, formData.password);

      if (result.success && result.user && result.session) {
        // Handle remember me for this tenant
        const rememberedKey = `remembered-username-${currentTenant?.id || 'default'}`;
        if (rememberMe) {
          localStorage.setItem(rememberedKey, formData.username);
        } else {
          localStorage.removeItem(rememberedKey);
        }

        onLoginSuccess(result.user, result.session);
      } else {
        setError(result.error || 'Error de autenticación');
      }
    } catch (err) {
      setError('Error del sistema. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setShowPasswordRequirements(password.length > 0);
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Panel Administrativo</h1>
            <p className="text-pink-100">
              {currentTenant ? `${currentTenant.name}` : 'Acceso para administradores'}
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email / Nombre de Usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Ingresa tu email o usuario"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Ingresa tu contraseña"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                {showPasswordRequirements && !passwordValidation.isValid && (
                  <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Requisitos de contraseña:</p>
                    <ul className="text-xs space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <li key={index} className="flex items-center text-yellow-700">
                          <AlertCircle className="w-3 h-3 mr-2" />
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-600">Recordar usuario</span>
                </label>

                <button
                  type="button"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !formData.username || !formData.password}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {/* Security Info */}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Información de Acceso</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Acceso directo sin restricciones</li>
                    <li>• Sesión extendida (24 horas)</li>
                    {currentTenant ? (
                      <li>• Usa las credenciales que creaste al registrar el negocio</li>
                    ) : (
                      <li>• Contraseña predeterminada: Admin123!</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;