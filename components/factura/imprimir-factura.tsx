"use client";

/**
 * Botón de imprimir de la factura.
 *
 * `window.print()` y nada más. La maquetación de impresión no se hace aquí sino
 * en CSS (`app/globals.css`), porque un componente de cliente no puede exportar
 * una hoja de estilo para el documento: si se pusiera el bloque `@media print`
 * dentro de este archivo, desaparecería al imprimir, que es justo cuando hace
 * falta.
 */
export default function ImprimirFactura() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:opacity-90"
    >
      Imprimir o guardar en PDF
    </button>
  );
}
