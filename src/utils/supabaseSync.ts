import { supabase } from './supabaseClient';
import { Tenant, TenantOwner } from '../types/tenant';
import { getTenants, getTenantOwners } from './tenantManager';

// Interfaces para las tablas de Supabase
export interface SupabaseTenant {
  id: string;
  name: string;
  slug: string;
  business_type: 'salon' | 'barberia' | 'spa' | 'unas' | 'centro-bienestar';
  logo?: string;
  primary_color: string;
  secondary_color: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  subscription_status: 'active' | 'suspended' | 'cancelled';
  subscription_expires_at: string;
  allow_online_booking: boolean;
  require_approval: boolean;
  timezone: string;
  currency: string;
  language: string;
}

export interface SupabaseTenantOwner {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password_hash: string;
  is_email_verified: boolean;
  created_at: string;
  last_login?: string;
}

// Convertir Tenant local a formato Supabase
const convertTenantToSupabase = (tenant: Tenant): SupabaseTenant => {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    business_type: tenant.businessType,
    logo: tenant.logo,
    primary_color: tenant.primaryColor,
    secondary_color: tenant.secondaryColor,
    address: tenant.address,
    phone: tenant.phone,
    email: tenant.email,
    website: tenant.website,
    description: tenant.description,
    is_active: tenant.isActive,
    created_at: tenant.createdAt,
    updated_at: tenant.updatedAt,
    owner_id: tenant.ownerId,
    subscription_plan: tenant.subscription.plan,
    subscription_status: tenant.subscription.status,
    subscription_expires_at: tenant.subscription.expiresAt,
    allow_online_booking: tenant.settings.allowOnlineBooking,
    require_approval: tenant.settings.requireApproval,
    timezone: tenant.settings.timeZone,
    currency: tenant.settings.currency,
    language: tenant.settings.language,
  };
};

// Convertir TenantOwner local a formato Supabase
const convertTenantOwnerToSupabase = (owner: TenantOwner): SupabaseTenantOwner => {
  return {
    id: owner.id,
    email: owner.email,
    first_name: owner.firstName,
    last_name: owner.lastName,
    phone: owner.phone,
    password_hash: owner.passwordHash,
    is_email_verified: owner.isEmailVerified,
    created_at: owner.createdAt,
    last_login: owner.lastLogin,
  };
};

// Función de prueba de conexión
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);
    
    if (error) {
      return { success: false, message: `Error de conexión: ${error.message}` };
    }
    
    return { success: true, message: 'Conexión a Supabase exitosa' };
  } catch (error) {
    return { success: false, message: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// Sincronizar todos los tenants locales con Supabase
export const syncTenantsToSupabase = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const localTenants = getTenants();
    const localOwners = getTenantOwners();
    
    console.log(`Sincronizando ${localTenants.length} tenants con Supabase...`);

    // Sincronizar owners primero
    for (const owner of localOwners) {
      const supabaseOwner = convertTenantOwnerToSupabase(owner);
      
      const { error: upsertError } = await supabase
        .from('tenant_owners')
        .upsert(supabaseOwner, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('Error sincronizando owner:', upsertError);
        return { success: false, message: `Error sincronizando owner ${owner.email}: ${upsertError.message}` };
      }
    }

    // Sincronizar tenants
    for (const tenant of localTenants) {
      const supabaseTenant = convertTenantToSupabase(tenant);
      
      const { error: upsertError } = await supabase
        .from('tenants')
        .upsert(supabaseTenant, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('Error sincronizando tenant:', upsertError);
        return { success: false, message: `Error sincronizando tenant ${tenant.name}: ${upsertError.message}` };
      }
    }

    console.log('Sincronización completada exitosamente');
    return { success: true, message: `${localTenants.length} tenants sincronizados exitosamente` };
  } catch (error) {
    console.error('Error en sincronización:', error);
    return { success: false, message: `Error de sincronización: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// Crear un nuevo tenant en Supabase
export const createTenantInSupabase = async (tenant: Tenant, owner: TenantOwner): Promise<{ success: boolean; message: string }> => {
  try {
    // Insertar owner primero
    const supabaseOwner = convertTenantOwnerToSupabase(owner);
    const { error: ownerError } = await supabase
      .from('tenant_owners')
      .insert(supabaseOwner);
    
    if (ownerError) {
      console.error('Error creando owner en Supabase:', ownerError);
      return { success: false, message: `Error creando owner: ${ownerError.message}` };
    }

    // Insertar tenant
    const supabaseTenant = convertTenantToSupabase(tenant);
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert(supabaseTenant);
    
    if (tenantError) {
      console.error('Error creando tenant en Supabase:', tenantError);
      return { success: false, message: `Error creando tenant: ${tenantError.message}` };
    }

    console.log('Tenant creado exitosamente en Supabase');
    return { success: true, message: 'Tenant creado exitosamente en Supabase' };
  } catch (error) {
    console.error('Error creando tenant en Supabase:', error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// Obtener todos los tenants desde Supabase
export const getTenantsFromSupabase = async (): Promise<{ success: boolean; data?: SupabaseTenant[]; message: string }> => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('Error obteniendo tenants de Supabase:', error);
      return { success: false, message: `Error obteniendo tenants: ${error.message}` };
    }

    return { success: true, data: data || [], message: 'Tenants obtenidos exitosamente' };
  } catch (error) {
    console.error('Error obteniendo tenants de Supabase:', error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// Actualizar un tenant específico en Supabase
export const updateTenantInSupabase = async (tenant: Tenant): Promise<{ success: boolean; message: string }> => {
  try {
    const supabaseTenant = convertTenantToSupabase(tenant);
    
    const { error } = await supabase
      .from('tenants')
      .update(supabaseTenant)
      .eq('id', tenant.id);
    
    if (error) {
      console.error('Error actualizando tenant en Supabase:', error);
      return { success: false, message: `Error actualizando tenant: ${error.message}` };
    }

    return { success: true, message: 'Tenant actualizado exitosamente en Supabase' };
  } catch (error) {
    console.error('Error actualizando tenant en Supabase:', error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// Eliminar un tenant de Supabase
export const deleteTenantFromSupabase = async (tenantId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId);
    
    if (error) {
      console.error('Error eliminando tenant de Supabase:', error);
      return { success: false, message: `Error eliminando tenant: ${error.message}` };
    }

    return { success: true, message: 'Tenant eliminado exitosamente de Supabase' };
  } catch (error) {
    console.error('Error eliminando tenant de Supabase:', error);
    return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}; 
