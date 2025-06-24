import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vikgdvmhrfsijaufxedv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpa2dkdm1ocmZzaWphdWZ4ZWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODMxMjMsImV4cCI6MjA2NjM1OTEyM30.DykKHMsdtXSHD8y2bEUdtp3lgxF_86atQ2UcLF5OsCI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 