import { IVA_PORCENTAJE } from "@/lib/constants";
import { getCart, type DireccionEnvio } from "@/lib/cart";
import { getStripe } from "@/lib/stripe";
import { siteConfig } from "@/lib/site";

/**
 * Pago con Stripe Checkout alojado: el usuario sale de la web a la página de
 * Stripe, introduce la tarjeta y Stripe le envía la factura por email
 * (`invoice_creation.enabled`).
 *
 * El importe SIEMPRE se calcula en servidor a partir del carrito en base de
 * datos. Nunca se acepta un total enviado por el navegador.
 */

/**
 * Stripe limita cada valor de `metadata` a 500 caracteres, así que la dirección
 * viaja como cadena compacta en lugar de JSON (un JSON truncado no parsea).
 */
export function direccionAMetadata(direccion: DireccionEnvio): string {
  const partes = [
    direccion.nombre,
    direccion.calle,
    `${direccion.codigo_postal} ${direccion.ciudad}`,
    direccion.provincia,
    direccion.pais,
    direccion.telefono ?? "",
  ]
    .map((parte) =>
      String(parte ?? "")
        .replace(/\|/g, " ")
        .trim(),
    )
    .join("|");

  // Stripe rechaza la sesión si un valor de metadata pasa de 500 caracteres.
  return recortar(partes, 500);
}

export function direccionDesdeMetadata(valor?: string | null): DireccionEnvio {
  const [
    nombre = "",
    calle = "",
    cpCiudad = "",
    provincia = "",
    pais = "España",
    telefono = "",
  ] = (valor ?? "").split("|").map((parte) => parte.trim());

  const [codigo_postal = "", ...restoCiudad] = cpCiudad.split(/\s+/);
  const ciudad = restoCiudad.join(" ");

  return {
    nombre,
    calle,
    ciudad,
    provincia,
    codigo_postal,
    pais: pais || "España",
    ...(telefono ? { telefono } : {}),
  };
}

type Linea = {
  quantity: number;
  price_data: {
    currency: string;
    unit_amount: number;
    product_data: { name: string; description?: string };
  };
};

function toCents(importe: number): number {
  return Math.round(importe * 100);
}

/** Stripe corta en 140 caracteres el valor de un campo de factura. */
function recortar(valor: string, max = 140): string {
  const limpio = valor.replace(/\s+/g, " ").trim();
  return limpio.length <= max ? limpio : `${limpio.slice(0, max - 1)}…`;
}

export async function crearSesionCheckout(params: {
  direccion: DireccionEnvio;
  origin: string;
  userId?: string | null;
  userEmail?: string | null;
  sessionId: string | null;
}) {
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  const lineas: Linea[] = cart.items.map((item) => {
    const titulo = item.productos?.titulo ?? "Producto";
    const variante = item.producto_variantes?.titulo;

    return {
      quantity: item.cantidad,
      price_data: {
        currency: "eur",
        unit_amount: toCents(item.producto_variantes?.precio ?? 0),
        product_data: {
          name: titulo.slice(0, 120),
          ...(variante && variante !== "Default Title"
            ? { description: variante.slice(0, 120) }
            : {}),
        },
      },
    };
  });

  // El IVA va como línea propia para que se vea en la factura de Stripe.
  if (cart.iva > 0) {
    lineas.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: toCents(cart.iva),
        product_data: { name: `IVA (${IVA_PORCENTAJE} %)` },
      },
    });
  }

  if (cart.costeEnvio > 0) {
    lineas.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: toCents(cart.costeEnvio),
        product_data: { name: "Envío" },
      },
    });
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "es",
    line_items: lineas,
    // Con usuario identificado, Stripe rellena el email y la factura sale a su
    // nombre. Sin sesión, el cliente lo escribe en la página de Stripe.
    ...(params.userEmail ? { customer_email: params.userEmail } : {}),
    success_url: `${params.origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/cart`,
    // Factura + envío por email gestionados por Stripe.
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: "Pedido SIE Merchandising",
        footer: `${siteConfig.name} · ${siteConfig.email} · ${siteConfig.phone}`,
        // El SDK v22 no tipa `shipping_details` en InvoiceData, así que la
        // dirección viaja como campos personalizados de la factura. Ojo: el
        // nombre admite 40 caracteres y el valor 140.
        custom_fields: [
          {
            name: "Enviar a",
            value: recortar(
              `${params.direccion.nombre}, ${params.direccion.calle}, ` +
                `${params.direccion.codigo_postal} ${params.direccion.ciudad}`,
            ),
          },
          {
            name: "Provincia y país",
            value: recortar(
              [params.direccion.provincia, params.direccion.pais]
                .filter(Boolean)
                .join(", "),
            ),
          },
          ...(params.direccion.telefono
            ? [
                {
                  name: "Teléfono",
                  value: recortar(params.direccion.telefono),
                },
              ]
            : []),
        ],
      },
    },
    metadata: {
      user_id: params.userId ?? "",
      cart_session_id: params.sessionId ?? "",
      direccion: direccionAMetadata(params.direccion),
      total_eur: cart.total.toFixed(2),
    },
  });

  if (!session.url) {
    throw new Error("Stripe no ha devuelto la URL de pago.");
  }

  return session.url;
}
