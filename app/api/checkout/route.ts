import { crearSesionCheckout } from "@/lib/checkout";
import { getCartSessionId } from "@/lib/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Crea la sesión de Stripe Checkout y devuelve la URL a la que redirigir.
 *
 * No se acepta ningún importe desde el cliente: el total se recalcula en
 * servidor leyendo el carrito de la base de datos.
 */

const CAMPOS_OBLIGATORIOS = [
  "nombre",
  "calle",
  "ciudad",
  "provincia",
  "codigo_postal",
  "pais",
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const direccion = body?.direccion ?? {};

    const faltan = CAMPOS_OBLIGATORIOS.filter(
      (campo) => !String(direccion[campo] ?? "").trim(),
    );

    if (faltan.length > 0) {
      return NextResponse.json(
        { error: "Completa la dirección de envío." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const url = await crearSesionCheckout({
      direccion,
      origin: req.nextUrl.origin,
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      sessionId: (await getCartSessionId()) ?? null,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const mensaje =
      error instanceof Error
        ? error.message
        : "No se ha podido iniciar el pago.";

    console.error("[checkout] Error creando la sesión de Stripe:", error);

    // Un carrito vacío no es un fallo del servidor.
    const status = mensaje.includes("carrito está vacío") ? 409 : 500;

    return NextResponse.json({ error: mensaje }, { status });
  }
}
