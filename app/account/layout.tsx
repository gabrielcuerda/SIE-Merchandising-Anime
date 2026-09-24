import SignOutButton from "@/components/auth/sign-out-button";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const accountLinks = [
  { href: "/account", label: "Resumen" },
  { href: "/account/profile", label: "Perfil" },
  { href: "/account/addresses", label: "Direcciones" },
  { href: "/account/orders", label: "Pedidos" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="mx-auto min-h-[70vh] w-full max-w-6xl px-4 py-10 lg:px-6">
      <header className="flex flex-col gap-6 border-b border-neutral-200 pb-8 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Mi cuenta
          </p>
          <h1 className="mt-1 text-3xl font-bold text-black dark:text-white">
            Hola, {fullName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {user.email}
          </p>
        </div>
        <SignOutButton />
      </header>

      <nav className="my-8 flex gap-2 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
        {accountLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-neutral-500 transition hover:border-blue-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
