import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*, items_pedido(*)")
    .eq("usuario_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-6 text-3xl font-bold">Pedido Confirmado!</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">Gracias por tu compra. Te enviaremos un email de confirmación en breve.</p>
      </div>

      {pedido && (
        <div className="mt-12 rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
          <h2 className="mb-4 text-lg font-semibold">Detalles del Pedido</h2>
          <div className="mb-4 flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Número de Pedido</span>
            <span className="font-mono">{pedido.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="mb-4 flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Estado</span>
            <span className="capitalize">{pedido.status}</span>
          </div>
          <div className="mb-4 flex justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Total</span>
            <span className="font-semibold">{pedido.total.toFixed(2)} {pedido.moneda}</span>
          </div>
          {pedido.direccion_pedido && (
            <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <h3 className="mb-2 text-sm font-medium">Dirección de Envío</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {pedido.direccion_pedido.nombre}<br />
                {pedido.direccion_pedido.calle}<br />
                {pedido.direccion_pedido.ciudad}, {pedido.direccion_pedido.provincia} {pedido.direccion_pedido.codigo_postal}<br />
                {pedido.direccion_pedido.pais}
              </p>
            </div>
          )}
          <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <h3 className="mb-2 text-sm font-medium">Artículos</h3>
            <ul className="space-y-2">
              {pedido.items_pedido?.map((item: any) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.titulo_producto} x {item.cantidad}</span>
                  <span>{(item.precio * item.cantidad).toFixed(2)} {pedido.moneda}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/search" className="inline-block rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:opacity-90">Seguir Comprando</Link>
      </div>
    </div>
  );
}