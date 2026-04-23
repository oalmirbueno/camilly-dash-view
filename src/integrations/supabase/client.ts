import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bfeppxzgbuzdpcphivbh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZXBweHpnYnV6ZHBjcGhpdmJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTcwNTAsImV4cCI6MjA5MTMzMzA1MH0.WlpyiIe0qt-DKPxlUAfl7el1vd0yYOa2HwfDNvyd7I4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'camilly-auth',
  },
});
