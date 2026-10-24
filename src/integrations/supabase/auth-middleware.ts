import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string;
const PUBLISHABLE_KEY = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string;

function readBearer(): string | null {
  const header = getRequestHeader("authorization") ?? getRequestHeader("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = readBearer();
    if (!token) throw new Response("Unauthorized", { status: 401 });

    const supabase = createClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new Response("Unauthorized", { status: 401 });

    return next({
      context: { supabase, userId: data.user.id, claims: data.user },
    });
  },
);
