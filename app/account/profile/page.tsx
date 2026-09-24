import ProfileForm from "@/components/account/profile-form";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mi perfil",
  description: "Actualiza tus datos personales.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_nombre, telefono")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Perfil</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Mantén tus datos personales actualizados.
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
        <ProfileForm
          fullNombre={profile?.full_nombre ?? ""}
          telefono={profile?.telefono ?? ""}
        />
      </div>
    </section>
  );
}
