import { getCart } from "@/lib/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  // El email de la cuenta rellena el campo y lo deja en solo: la factura de una
  // compra con sesión va a la dirección con la que se registró, y hacer que el
  // cliente pueda escribir otro sería dejar la copia del pedido en una casilla
  // que no le pertenece.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      <CheckoutForm
        cart={cart}
        emailInicial={user?.email ?? null}
        emailBloqueado={Boolean(user?.email)}
      />
    </div>
  );
}
