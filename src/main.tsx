import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TenantProvider from './components/TenantProvider';
import TenantRouter from './components/TenantRouter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TenantProvider>
      <TenantRouter />
    </TenantProvider>
  </StrictMode>
);