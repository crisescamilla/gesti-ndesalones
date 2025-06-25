import React, { useState, useEffect } from 'react';
import { Database, Upload, RefreshCw, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { syncTenantsToSupabase, getTenantsFromSupabase, testSupabaseConnection } from '../utils/supabaseSync';
import { getTenants } from '../utils/tenantManager';

interface SyncStatus {
  isConnected: boolean;
  localTenants: number;
  remoteTenants: number;
  lastSync: string | null;
  syncInProgress: boolean;
}

const SupabaseSyncManager: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isConnected: false,
    localTenants: 0,
    remoteTenants: 0,
    lastSync: null,
    syncInProgress: false
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Verificar estado inicial
  useEffect(() => {
    checkConnection();
    updateLocalCount();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await testSupabaseConnection();
      setSyncStatus(prev => ({ ...prev, isConnected: result.success }));
      
      if (result.success) {
        await updateRemoteCount();
      }
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, isConnected: false }));
    }
  };

  const updateLocalCount = () => {
    const localTenants = getTenants();
    setSyncStatus(prev => ({ ...prev, localTenants: localTenants.length }));
  };

  const updateRemoteCount = async () => {
    const result = await getTenantsFromSupabase();
    if (result.success && result.data) {
      setSyncStatus(prev => ({ ...prev, remoteTenants: result.data!.length }));
    }
  };

  const handleSyncToSupabase = async () => {
    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
    setMessage(null);

    try {
      const result = await syncTenantsToSupabase();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setSyncStatus(prev => ({ 
          ...prev, 
          lastSync: new Date().toLocaleString(),
          syncInProgress: false 
        }));
        await updateRemoteCount();
      } else {
        setMessage({ type: 'error', text: result.message });
        setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error inesperado durante la sincronización' });
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  const handleRefreshStatus = async () => {
    await checkConnection();
    updateLocalCount();
    setMessage({ type: 'info', text: 'Estado actualizado' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sincronización con Supabase</h2>
            <p className="text-sm text-gray-600">Gestiona la sincronización de datos con la base de datos</p>
          </div>
        </div>
        <button
          onClick={handleRefreshStatus}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Actualizar estado"
          aria-label="Actualizar estado de sincronización"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Estado de conexión */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            {syncStatus.isConnected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-700">Conexión</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {syncStatus.isConnected ? 'Conectado' : 'Desconectado'}
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Local</span>
          </div>
          <p className="text-lg font-semibold text-blue-600">{syncStatus.localTenants}</p>
        </div>

        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Upload className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">Remoto</span>
          </div>
          <p className="text-lg font-semibold text-green-600">{syncStatus.remoteTenants}</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Última Sinc.</span>
          </div>
          <p className="text-sm font-semibold text-purple-600">
            {syncStatus.lastSync || 'Nunca'}
          </p>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {message.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {message.type === 'info' && <RefreshCw className="w-5 h-5 text-blue-500" />}
            <span className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' :
              message.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleSyncToSupabase}
          disabled={!syncStatus.isConnected || syncStatus.syncInProgress}
          className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
            !syncStatus.isConnected || syncStatus.syncInProgress
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:transform active:scale-95'
          }`}
        >
          {syncStatus.syncInProgress ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          <span>
            {syncStatus.syncInProgress ? 'Sincronizando...' : 'Sincronizar a Supabase'}
          </span>
        </button>

        <button
          onClick={checkConnection}
          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 active:transform active:scale-95 transition-all"
        >
          <Database className="w-5 h-5" />
          <span>Probar Conexión</span>
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Información de la Base de Datos</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>URL:</strong> https://vikgdvmhrfsijaufxedv.supabase.co</p>
          <p><strong>Estado:</strong> {syncStatus.isConnected ? 'Operativo' : 'No disponible'}</p>
          <p><strong>Tenants locales:</strong> {syncStatus.localTenants}</p>
          <p><strong>Tenants remotos:</strong> {syncStatus.remoteTenants}</p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSyncManager; 