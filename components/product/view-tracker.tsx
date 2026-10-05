"use client";

import { useEffect, useRef } from "react";

/**
 * Registra que se ha visto un producto.
 *
 * Va en un componente cliente y NO en el Server Component de la página, y el
 * motivo es concreto: hay varios `<Link prefetch={true}>` a páginas de
 * producto. Con el App Router, el prefetch ejecuta el render de esa página en
 * el servidor, así que registrar el evento desde el servidor generaría
 * visualizaciones de productos que nadie ha abierto nunca. En el cliente el
 * efecto solo se ejecuta si la página se ha renderizado de verdad en el
 * navegador.
 *
 * Renderiza `null`: no añade nada visible.
 */
export function ViewTracker({ productId }: { productId: string }) {
  // En desarrollo, React monta, desmonta y vuelve a montar los efectos
  // (StrictMode). Sin esta guarda se registraría cada visita dos veces.
  const yaEnviado = useRef(false);

  useEffect(() => {
    if (yaEnviado.current) return;
    yaEnviado.current = true;

    void fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "product.viewed",
        producto_id: productId,
      }),
      // El fetch puede quedar pendiente si el usuario navega justo después de
      // ver el producto; keepalive deja que termine en lugar de cancelarse.
      keepalive: true,
    }).catch(() => {
      // Telemetría: si falla, no se avisa al usuario ni se rompe nada.
    });
  }, [productId]);

  return null;
}
