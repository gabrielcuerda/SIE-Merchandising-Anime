import type { ReactNode } from "react";

/**
 * Datos identificativos del responsable del tratamiento.
 *
 * REGLA DURA: aquí no se inventa ni un CIF, ni un domicilio fiscal, ni un nombre
 * legal. Lo que `siteConfig` ya tiene (nombre comercial, email, teléfono,
 * domicilio) se consume de `lib/site.ts`; lo que falta queda marcado como
 * pendiente a propósito.
 *
 * Motivo: una política de privacidad con un CIF inventado o un domicilio que no
 * es el del responsable es un problema legal real, no un detalle de maquetación.
 * Un marcador visible es un recordatorio; un dato inventado es una declaración
 * falsa publicada en la web.
 *
 * Antes de publicar esta página hay que rellenar los campos marcados.
 */
export const DATOS_LEGALES = {
  nombreLegal: "PENDIENTE — nombre completo o razón social del responsable",
  cif: "PENDIENTE — CIF / NIF del responsable",
  domicilioFiscal: "PENDIENTE — domicilio fiscal del responsable",
  registroAEPD: "PENDIENTE — enlace al registro en la AEPD",
  delegate: "PENDIENTE — nombre y email del delegado de protección de datos",
  fechaActualizacion: "2026-10-03",
} as const;

const CAMPOS_PENDIENTES = [
  DATOS_LEGALES.nombreLegal,
  DATOS_LEGALES.cif,
  DATOS_LEGALES.domicilioFiscal,
  DATOS_LEGALES.registroAEPD,
  DATOS_LEGALES.delegate,
];

/** Hay campos sin rellenar: se avisa arriba de la página y se resaltan inline. */
export const HAY_PENDIENTES = CAMPOS_PENDIENTES.some((valor) =>
  valor.startsWith("PENDIENTE"),
);

/**
 * Marca visual de un dato pendiente de completar.
 *
 * Usa tokens `alert-*` porque existen en el tema (`app/globals.css`); `warning-*`
 * no está definido y la clase saldría sin estilo.
 */
export function Pendiente({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-alert-50 px-1.5 py-0.5 font-semibold text-alert-700 ring-1 ring-alert-300">
      {children}
    </mark>
  );
}

export const TITULO = "Política de privacidad";

export const RESUMEN =
  "Qué datos personales tratamos, con qué base legal, cuánto tiempo los conservamos y cómo ejercer tus derechos.";
