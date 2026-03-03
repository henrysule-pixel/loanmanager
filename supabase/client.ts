"use client";

import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

const env = getEnv();
export const supabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
