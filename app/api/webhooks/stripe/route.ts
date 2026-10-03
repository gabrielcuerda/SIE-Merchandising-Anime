import { direccionDesdeMetadata } from "@/lib/checkout";
import { createPedido } from "@/lib/cart";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

/**
 * Webhook de Stripe.
 *
 * Es la vía fiable para registrar el pedido: el cliente puede cerrar la
 * pestaña justo después de pagar y la página de confirmación no llegaría a
 * crearlo. `crear_pedido` es idempotente por `pago_id`, así que que pasen
 * ambos no duplica nada.
 *
 * El webhook no recibe cookies, por eso el usuario y la sesión del carrito
 * viajan en `metadata` de la Checkout Session.
 */

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Falta la firma" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (error) {
    console.error("[stripe] Firma inválida:", error);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        console.log(
          `[stripe] Sesión ${session.id} aún no pagada (${session.payment_status})`,
        );
        break;
      }

      const metadata = session.metadata ?? {};
      const direccion = direccionDesdeMetadata(metadata.direccion);

      try {
        const pedidoId = await createPedido({
          direccion,
          pagoId: session.id,
          metodoPago: "stripe",
          usuarioId: metadata.user_id || null,
          sessionId: metadata.cart_session_id || null,
        });

        console.log(`[stripe] Pedido ${pedidoId} creado (${session.id})`);
      } catch (error) {
        // Si algo falla devolvemos 500 para que Stripe reintente.
        console.error("[stripe] Error creando el pedido:", error);
        return NextResponse.json(
          { error: "Error creando el pedido" },
          { status: 500 },
        );
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[stripe] Sesión caducada: ${session.id}`);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
