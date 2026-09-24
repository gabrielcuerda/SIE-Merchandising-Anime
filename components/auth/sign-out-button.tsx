"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

const supabase = createClient();

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-900"
      type="button"
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}
