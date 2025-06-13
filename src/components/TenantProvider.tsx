import React from 'react';
import { TenantContext, useTenantProvider } from '../hooks/useTenant';

interface TenantProviderProps {
  children: React.ReactNode;
}

const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const tenantContext = useTenantProvider();

  return (
    <TenantContext.Provider value={tenantContext}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantProvider;