import { useState, useEffect, createContext, useContext } from 'react';
import { Tenant, TenantOwner, TenantContext } from '../types/tenant';
import { 
  getCurrentTenant, 
  setCurrentTenant, 
  getTenantFromURL,
  getTenantOwnerById 
} from '../utils/tenantManager';

// Tenant Context
const TenantContext = createContext<TenantContext>({
  tenant: null,
  owner: null,
  isLoading: true,
  error: null
});

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Tenant Provider Hook
export const useTenantProvider = (): TenantContext => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [owner, setOwner] = useState<TenantOwner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTenant = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to get tenant from URL first
        let currentTenant = getTenantFromURL();
        
        // If no tenant in URL, try to get from storage
        if (!currentTenant) {
          currentTenant = getCurrentTenant();
        }

        if (currentTenant) {
          setTenant(currentTenant);
          setCurrentTenant(currentTenant);

          // Load tenant owner
          const tenantOwner = getTenantOwnerById(currentTenant.ownerId);
          setOwner(tenantOwner);
        } else {
          // No tenant found, redirect to tenant selection or registration
          setError('No tenant found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeTenant();
  }, []);

  // Listen for URL changes
  useEffect(() => {
    const handlePopState = () => {
      const urlTenant = getTenantFromURL();
      if (urlTenant && urlTenant.id !== tenant?.id) {
        setTenant(urlTenant);
        setCurrentTenant(urlTenant);
        
        const tenantOwner = getTenantOwnerById(urlTenant.ownerId);
        setOwner(tenantOwner);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [tenant]);

  return {
    tenant,
    owner,
    isLoading,
    error
  };
};

// Hook for tenant-specific data operations
export const useTenantData = () => {
  const { tenant } = useTenant();

  const getTenantSpecificData = (dataType: string) => {
    if (!tenant) return null;
    
    const tenantDataKey = `beauty-app-tenant-data-${tenant.id}`;
    const stored = localStorage.getItem(tenantDataKey);
    
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    return data[dataType] || null;
  };

  const saveTenantSpecificData = (dataType: string, data: any) => {
    if (!tenant) return;
    
    const tenantDataKey = `beauty-app-tenant-data-${tenant.id}`;
    const stored = localStorage.getItem(tenantDataKey);
    
    let tenantData = stored ? JSON.parse(stored) : {};
    tenantData[dataType] = data;
    
    localStorage.setItem(tenantDataKey, JSON.stringify(tenantData));
  };

  return {
    tenant,
    getTenantSpecificData,
    saveTenantSpecificData
  };
};

// Hook for tenant URL management
export const useTenantURL = () => {
  const { tenant } = useTenant();

  const generateBookingURL = () => {
    if (!tenant) return '';
    return `${window.location.origin}/${tenant.slug}`;
  };

  const generateAdminURL = () => {
    if (!tenant) return '';
    return `${window.location.origin}/${tenant.slug}/admin`;
  };

  const navigateToTenant = (slug: string) => {
    window.location.href = `${window.location.origin}/${slug}`;
  };

  return {
    tenant,
    generateBookingURL,
    generateAdminURL,
    navigateToTenant
  };
};

export { TenantContext };