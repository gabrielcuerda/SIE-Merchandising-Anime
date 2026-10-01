import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.user_id;
      const direccion = JSON.parse(paymentIntent.metadata.direccion || "{}");

      // Get cart items
      let cartQuery = supabase
        .from("carrito_items")
        .select(
          `*, productos:titulo, slug, producto_imagenes(url, alt_text), producto_variantes:titulo, precio`,
        );

      if (userId !== "guest") {
        cartQuery = cartQuery.eq("user_id", userId);
      }

      const { data: cartItems } = await cartQuery;

      if (cartItems && cartItems.length > 0) {
        const subtotal = cartItems.reduce(
          (sum: number, item: any) =>
            sum + (item.producto_variantes?.precio || 0) * item.cantidad,
          0,
        );
        const costeEnvio = 0;
        const total = subtotal + costeEnvio;

        const { data: pedido, error: pedidoError } = await supabase
          .from("pedidos")
          .insert({
            usuario_id: userId === "guest" ? null : userId,
            status: "paid",
            subtotal,
            coste_envio: costeEnvio,
            total,
            moneda: "EUR",
            direccion_pedido: direccion,
            metodo_pago: "stripe",
            pago_id: paymentIntent.id,
          })
          .select()
          .single();

        if (pedidoError) {
          console.error("Error creating order:", pedidoError);
          break;
        }

        const itemsPedido = cartItems.map((item: any) => ({
          pedido_id: pedido.id,
          producto_id: item.producto_id,
          variante_id: item.variante_id,
          titulo_producto: item.productos?.titulo || "Producto",
          img_producto: item.productos?.producto_imagenes?.[0]?.url || null,
          cantidad: item.cantidad,
          precio: item.producto_variantes?.precio || 0,
        }));

        await supabase.from("items_pedido").insert(itemsPedido);

        // Clear cart
        if (userId !== "guest") {
          await supabase.from("carrito_items").delete().eq("user_id", userId);
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("Payment failed:", paymentIntent.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
