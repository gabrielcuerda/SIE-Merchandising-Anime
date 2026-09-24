import SignOutButton from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Gestiona tu cuenta de SIE Merchandising.",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_nombre")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      full_nombre: user.user_metadata?.full_nombre ?? null,
    });
  }

  const fullName =
    profile?.full_nombre ?? user.user_metadata?.full_nombre ?? "Cliente";

  return (
    <div className="mx-auto min-h-[70vh] w-full max-w-2xl px-4 py-12">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm md:p-8 dark:border-neutral-800 dark:bg-black">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Mi cuenta
        </p>
        <h1 className="mt-2 text-3xl font-bold">Hola, {fullName}</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {user.email}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
