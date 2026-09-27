import AddressForm from "@/components/account/address-form";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mis direcciones",
  description: "Gestiona tu dirección de envío.",
};

export default async function AddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/addresses");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "direccion_calle, direccion_ciudad, direccion_provincia, direccion_codigo_postal, direccion_pais",
    )
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Direcciones</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Guarda la dirección que utilizaremos para tus envíos.
        </p>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
        <AddressForm
          calle={profile?.direccion_calle ?? ""}
          ciudad={profile?.direccion_ciudad ?? ""}
          provincia={profile?.direccion_provincia ?? ""}
          codigoPostal={profile?.direccion_codigo_postal ?? ""}
          pais={profile?.direccion_pais ?? "España"}
        />
      </div>
    </section>
  );
}
