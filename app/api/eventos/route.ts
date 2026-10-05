import { registrarEvento, type EventoTipo } from "@/lib/eventos";
import { NextRequest, NextResponse } from "next/server";

/**
 * Alta de eventos desde el navegador.
 *
 * Solo existe para `product.viewed`. El resto los genera la base de datos
 * dentro de la transacción que cambia el estado (carrito y pedido), y
 * `checkout.started` se registra en su propio route handler. Nada de eso pasa
 * por aquí.
 *
 * La lista blanca no es un detalle menor: sin ella, cualquiera podría llamar
 * a esta ruta con `order.created` o `payment.simulated` y escribir en el
 * histórico de negocio datos inventados.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Un validador por clave. Devuelve el valor limpio, o `null` si no vale; como
 * `String(undefined)` no es un uuid, la misma comprobación cubre "falta" y "no
 * es válido". Las claves son obligatorias: un `product.viewed` sin producto no
 * sirve para nada.
 */
type ReglaEvento = {
  claves: Record<string, (valor: unknown) => string | null>;
};

/**
 * `Partial<Record<EventoTipo, ...>>` obliga a que las claves sean tipos
 * declarados en `TIPOS_EVENTO`: si alguien añade un evento al tipo y olvida
 * decidir si se admite desde el navegador, falla la compilación.
 */
const PERMITIDOS: Partial<Record<EventoTipo, ReglaEvento>> = {
  "product.viewed": {
    claves: {
      producto_id: (valor) => (UUID.test(String(valor)) ? String(valor) : null),
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    // Comprobación propia y no `PERMITIDOS[tipo]`: sin ella, un tipo como
    // "constructor" encontraría algo heredado de Object.prototype en
    // PERMITIDOS y se colaría como evento válido.
    const tipo = String(body?.tipo ?? "") as EventoTipo;

    if (!Object.prototype.hasOwnProperty.call(PERMITIDOS, tipo)) {
      return NextResponse.json(
        { error: "Ese evento no se admite desde el cliente." },
        { status: 400 },
      );
    }

    const metadata: Record<string, string> = {};

    for (const [clave, validar] of Object.entries(PERMITIDOS[tipo]!.claves)) {
      const valor = validar(body?.[clave]);

      if (valor === null) {
        return NextResponse.json(
          { error: `Falta el campo "${clave}" o no tiene un formato válido.` },
          { status: 400 },
        );
      }

      metadata[clave] = valor;
    }

    await registrarEvento(tipo, metadata);

    // 204: al navegador no le interesa el resultado, y así la respuesta no
    // revela nada sobre lo que se ha registrado.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[eventos] Error en el alta del evento:", error);
    return NextResponse.json(
      { error: "No se ha podido registrar el evento." },
      { status: 500 },
    );
  }
}
