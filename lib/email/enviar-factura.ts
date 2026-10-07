import { getPedidoPorPago } from "@/lib/cart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Pedido } from "@/lib/supabase/types";
import {
  getBcc,
  getRemitente,
  getReplyTo,
  getSitioUrl,
  getTransporter,
  isEmailConfigured,
} from "./config";
import { construirModeloFactura, type PedidoFacturable } from "./modelo";
import { plantillaFactura } from "./plantilla-factura";

/**
 * Envío de la factura de un pedido.
 *
 * La regla que gobierna todo el módulo es que un fallo de correo NUNCA puede
 * tumbar una venta. Ni una variable mal puesta, ni la tabla de `correos_enviados`
 * sin migrar, ni DonDominio rechazando la autenticación. En todos esos casos la
 * función devuelve `{ enviado: false, motivo }`, deja constancia y el pedido se
 * queda pagado igual. Quien llama —el webhook de Stripe o la página de
 * confirmación— no tiene que hacer nada con ese resultado.
 *
 * La segunda regla es que no se manden dos. `correo_reservar` decide, y es una
 * operación atómica de la base de datos: da igual que el webhook y
 * /order-confirmation lleguen a la vez, porque solo uno se queda con el envío.
 * Ver `supabase/migrations/20261007000000_correos.sql`.
 */

export type ResultadoEnvio = {
  enviado: boolean;
  /** `true` porque la factura ya se había enviado y no tocaba repetirla. */
  yaEnviada?: boolean;
  /** Por qué no salió, o por qué no hacía falta mandarla. */
  motivo?: string;
  /** Id del registro en `correos_enviados`. */
  registroId?: string;
};

const PLANTILLA = "factura";

/**
 * Carga el pedido de un envío.
 *
 * `pedido` se puede pasar ya cargado para no releerlo: quien lo tiene delante
 * (la página de confirmación, el panel) se ahorra una consulta.
 *
 * Cuando solo se conoce el pago se usa `correo_pedido` y no `pedido_por_pago`
 * porque este último filtra por `auth.uid()`, y el webhook de Stripe no tiene
 * cookies: así, un pedido de un cliente registrado devolvería NULL y su factura
 * no se mandaría nunca.
 */
async function cargarPedido(
  pedido: PedidoFacturable | undefined,
  pagoId: string,
): Promise<PedidoFacturable | undefined> {
  if (pedido) return pedido;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("correo_pedido", {
    p_pago_id: pagoId,
  });

  if (error) {
    console.error(
      `[correo] No se ha podido leer el pedido ${pagoId}:`,
      error.message,
    );
    return undefined;
  }

  return (data as Pedido | null) ?? undefined;
}

export async function enviarFactura(params: {
  /** Pedido ya cargado. Opcional si se pasa `pagoId`. */
  pedido?: PedidoFacturable;
  /** `cs_...` de Stripe. Siempre hace falta: es la clave de `correo_pedido`. */
  pagoId: string;
  /** Destinatario explícito. Si no, el email guardado en el pedido. */
  email?: string | null;
  /** true solo desde el reenvío manual del panel. */
  forzar?: boolean;
}): Promise<ResultadoEnvio> {
  const { pagoId } = params;

  if (!pagoId) {
    return {
      enviado: false,
      motivo: "El pedido no tiene identificador de pago.",
    };
  }

  if (!isEmailConfigured()) {
    console.warn(
      "[correo] Envío de facturas desactivado: faltan SMTP_HOST, SMTP_USER o " +
        "SMTP_PASSWORD. El pedido se ha guardado igualmente.",
    );
    return {
      enviado: false,
      motivo: "El envío de correo no está configurado.",
    };
  }

  const pedido = await cargarPedido(params.pedido, pagoId);

  if (!pedido) {
    console.error(`[correo] No existe ningún pedido para el pago ${pagoId}.`);
    return { enviado: false, motivo: "No se ha encontrado el pedido." };
  }

  if (
    pedido.status !== "paid" &&
    pedido.status !== "shipped" &&
    pedido.status !== "delivered"
  ) {
    // Cobrar una factura de un pedido cancelado es un problema contable, no un
    // problema de código.
    return {
      enviado: false,
      motivo: `El pedido está en estado "${pedido.status}" y no se factura.`,
    };
  }

  const destinatario = (
    params.email ??
    pedido.direccion_pedido?.email ??
    ""
  ).trim();

  if (!destinatario) {
    // Los pedidos anteriores a este módulo no guardan email. Stripe les mandó
    // su factura igualmente, así que no es una pérdida: es que nosotros no
    // sabemos a quién escribirle.
    console.warn(
      `[correo] El pedido ${pedido.id.slice(0, 8)} no tiene email guardado: ` +
        "no se le puede mandar la factura por correo.",
    );
    return {
      enviado: false,
      motivo:
        "Este pedido no guardó ningún email, así que no hay a quién mandarle la factura.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: registroId, error: errorReserva } = await supabase.rpc(
    "correo_reservar",
    {
      p_pedido_id: pedido.id,
      p_plantilla: PLANTILLA,
      p_destinatario: destinatario,
      p_forzar: params.forzar ?? false,
    },
  );

  if (errorReserva) {
    // Sin la tabla de `correos_enviados` (migración no aplicada) esto falla.
    // Es exactamente el caso que no puede romper la venta.
    console.error(
      "[correo] No se ha podido reservar el envío. ¿Has ejecutado la migración " +
        `supabase/migrations/20261007000000_correos.sql? ${errorReserva.message}`,
    );
    return { enviado: false, motivo: "No se ha podido registrar el envío." };
  }

  // NULL es lo que devuelve `correo_reservar` cuando la factura ya salió: el
  // ON CONFLICT no actualizó nada porque el estado era 'enviado' y no se
  // estaba forzando. No es un error, es la respuesta correcta.
  if (!registroId) {
    console.log(
      `[correo] La factura del pedido ${pedido.id.slice(0, 8)} ya se había enviado.`,
    );
    return { enviado: false, yaEnviada: true };
  }

  const id = registroId as string;
  const modelo = construirModeloFactura(pedido, getSitioUrl());
  const { asunto, html, texto } = plantillaFactura(modelo);

  const bcc = getBcc();

  try {
    const info = await getTransporter().sendMail({
      from: getRemitente(),
      // Al destinatario se le da un nombre si lo tenemos: "Hola Ana:" en lugar
      // de "Hola cliente@correo.com:".
      to: modelo.cliente
        ? `"${modelo.cliente.replace(/"/g, "")}" <${destinatario}>`
        : destinatario,
      replyTo: getReplyTo() || undefined,
      // La copia al negocio es en BCC, nunca en CC: en CC el cliente vería la
      // casilla del negocio y las respuestas se irían a dos sitios.
      ...(bcc && bcc.toLowerCase() !== destinatario.toLowerCase()
        ? { bcc }
        : {}),
      subject: asunto,
      text: texto,
      html: html,
    });

    const { error: errorCierre } = await supabase.rpc(
      "correo_registrar_envio",
      {
        p_id: id,
        p_mensaje_id:
          typeof info.messageId === "string" ? info.messageId : null,
      },
    );

    if (errorCierre) {
      // El correo SÍ ha salido, solo que no hemos podido anotarlo. Se avisa
      // porque significa que el registro queda en 'pendiente' y el siguiente
      // intento podría reenviar la factura.
      console.error(
        "[correo] Factura enviada pero sin registrar en correos_enviados:",
        errorCierre.message,
      );
    }

    console.log(
      `[correo] Factura ${modelo.numero} enviada a ${destinatario}` +
        (bcc ? ` (copia oculta a ${bcc})` : ""),
    );

    return { enviado: true, registroId: id };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);

    const { error: errorRegistro } = await supabase.rpc(
      "correo_registrar_error",
      {
        p_id: id,
        p_error: mensaje,
      },
    );

    if (errorRegistro) {
      console.error(
        "[correo] Error registrando el fallo del envío:",
        errorRegistro.message,
      );
    }

    console.error(
      `[correo] No se ha podido enviar la factura a ${destinatario}:`,
      error,
    );

    return { enviado: false, registroId: id, motivo: mensaje };
  }
}

/**
 * Estado del envío de un pedido, para el panel.
 *
 * Devuelve `undefined` si todavía no se ha intentado nada, y también si la
 * migración no está aplicada: en ese caso el panel simplemente no enseña el
 * bloque en vez de romperse.
 */
export async function obtenerEstadoFactura(pedidoId: string): Promise<{
  estado: "pendiente" | "enviado" | "error";
  destinatario: string;
  intentos: number;
  enviado_at: string | null;
  error: string | null;
} | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("correo_estado", {
    p_pedido_id: pedidoId,
  });

  if (error) {
    console.error("[correo] obtenerEstadoFactura:", error.message);
    return null;
  }

  return (data as never) ?? null;
}
