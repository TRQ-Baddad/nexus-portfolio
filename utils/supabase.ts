import { createClient } from '@supabase/supabase-js';

// Use import.meta.env which is the Vite standard for exposing environment variables to the client.
// Your Vercel variables prefixed with VITE_ will be available here at build time.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // This error will be thrown during development or if Vercel variables are not set correctly.
    throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);