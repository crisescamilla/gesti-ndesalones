import React, { useEffect, useState } from 'react';
import { useTenant } from '../hooks/useTenant';
import { migrateToMultiTenant } from '../utils/tenantManager';
import TenantSelector from './TenantSelector';
import TenantRegistration from './TenantRegistration';
import AccessControl from './AccessControl';
import App from '../App';
import { Loader2 } from 'lucide-react';

const TenantRouter: React.FC = () => {
  const { tenant, isLoading, error } = useTenant();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    // Run migration on first load
    migrateToMultiTenant();
    
    // Check if user has valid access
    const accessGranted = localStorage.getItem('srcn-access-granted');
    if (accessGranted) {
      // Check if access is still valid (3 minutes)
      const grantedTime = parseInt(accessGranted);
      const now = Date.now();
      const validDuration = 30 * 60 * 1000; // 3 minutes
      
      if (now - grantedTime < validDuration) {
        setHasAccess(true);
      } else {
        // Access expired
        localStorage.removeItem('srcn-access-granted');
        setHasAccess(false);
      }
    }
    
    setCheckingAccess(false);
    
    // Listen for URL changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleAccessGranted = () => {
    setHasAccess(true);
  };

  // Show loading state
  if (isLoading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // ALWAYS check access control for protected routes
  const protectedRoutes = ['/', '/register'];
  const needsAccessControl = protectedRoutes.includes(currentPath);
  
  if (needsAccessControl && !hasAccess) {
    return <AccessControl onAccessGranted={handleAccessGranted} />;
  }

  // Handle routing based on path
  const pathSegments = currentPath.split('/').filter(Boolean);
  
  // Registration page (with access control)
  if (currentPath === '/register') {
    return <TenantRegistration />;
  }
  
  // Root path - show tenant selector (with access control)
  if (pathSegments.length === 0) {
    return <TenantSelector />;
  }
  
  // Tenant-specific routes
  if (tenant) {
    // Admin routes
    if (pathSegments.length >= 2 && pathSegments[1] === 'admin') {
      return <App />;
    }
    
    // Public booking page
    return <App />;
  }
  
  // No tenant found for the URL
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Negocio no encontrado
          </h1>
          <p className="text-gray-600 mb-6">
            La URL que estás buscando no corresponde a ningún negocio registrado.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Ver Todos los Negocios
          </button>
        </div>
      </div>
    );
  }
  
  // Fallback to tenant selector
  return <TenantSelector />;
};

export default TenantRouter;