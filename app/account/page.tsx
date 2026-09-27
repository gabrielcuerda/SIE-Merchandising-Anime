import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Gestiona tu cuenta de SIE Merchandising.",
};

const accountCards = [
  {
    href: "/account/profile",
    title: "Perfil",
    description: "Actualiza tu nombre y teléfono.",
  },
  {
    href: "/account/addresses",
    title: "Direcciones",
    description: "Gestiona tu dirección de envío.",
  },
  {
    href: "/account/orders",
    title: "Pedidos",
    description: "Revisa el historial de tus compras.",
  },
  {
    href: "/account/wishlist",
    title: "Deseos",
    description: "Consulta tus productos favoritos.",
  },
];

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const { count: orderCount } = await supabase
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", user.id);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Resumen de tu cuenta</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Gestiona tus datos, direcciones y compras desde aquí.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accountCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md dark:border-neutral-800 dark:bg-black"
          >
            <h3 className="font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {card.description}
            </p>
            {card.href === "/account/orders" && orderCount !== null ? (
              <p className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                {orderCount} {orderCount === 1 ? "pedido" : "pedidos"}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
