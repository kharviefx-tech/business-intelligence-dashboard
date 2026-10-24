import process from "node:process";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string;
const SERVICE_ROLE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] as string;

export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
