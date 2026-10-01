import type { User } from "@supabase/supabase-js";

/**
 * Módulo puro de roles: no importa nada de `next/server`, así que puede
 * usarse desde `proxy.ts`, desde Server Components y desde Server Actions.
 */
export function isAdminUser(user: User | null) {
  if (!user) return false;

  if (user.app_metadata?.role === "admin") return true;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(user.email?.toLowerCase() ?? "");
}
