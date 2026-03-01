import { createClient } from "@supabase/supabase-js";

/**
 * Standard client-side Supabase client using the Publishable key.
 * During build time, if env vars are missing, we provide placeholders to prevent crashes.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        cache: "no-store",
      });
    },
  },
});
