/// <reference types="vite/client" />

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase credentials are not set. Authentication and data sync will be disabled."
  );
}

export const supabase = supabaseClient;
