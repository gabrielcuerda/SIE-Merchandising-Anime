import { getCart } from "@/lib/cart";
import { redirect } from "next/navigation";
import CheckoutForm from "./checkout-form";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>
      <CheckoutForm cart={cart} />
    </div>
  );
}
