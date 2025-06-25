import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vikgdvmhrfsijaufxedv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpa2dkdm1ocmZzaWphdWZ4ZWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODMxMjMsImV4cCI6MjA2NjM1OTEyM30.DykKHMsdtXSHD8y2bEUdtp3lgxF_86atQ2UcLF5OsCI';

export const supabase = createClient(supabaseUrl, supabaseKey);

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

// Función para insertar negocio (si la necesitas)
export const insertNegocio = async () => {
  try {
    const { data, error } = await supabase
      .from('negocios')
      .insert([{
        nombre: 'Mi Salón',
        slug: 'mi-salon',
        // ... otros campos
      }]);
    
    

    if (error) {
      console.error('Error al guardar:', error);
      return { success: false, error };
    } else {
      console.log('Negocio guardado:', data);
      return { success: true, data };
    }
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error };
  }
}; 
