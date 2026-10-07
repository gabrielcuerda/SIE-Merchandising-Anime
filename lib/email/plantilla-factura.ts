import { datosFiscales } from "@/lib/site";
import { getSitioUrl } from "./config";
import { formatearFecha, formatearImporte, type ModeloFactura } from "./modelo";

/**
 * Plantilla del correo de factura.
 *
 * El HTML de un email no es una página web, y las diferencias importan:
 *
 *   - Layout de `<table>` y estilos INLINE. Gmail y Outlook descartan los
 *     `<style>` de la cabecera, así que cualquier cosa que dependa de una hoja
 *     de estilos externa sencillamente no llega a verse.
 *   - Anchura máxima de 600 px, que es lo que renderizan bien los clientes de
 *     escritorio y los de móvil.
 *   - Una versión `text/plain` SIEMPRE. Es la que se lee en el cliente de
 *     correo del móvil, en las listas de correo y en cualquier parte donde el
 *     HTML se pierde.
 *   - Las imágenes de producto son un extra, nunca el único sitio donde está el
 *     nombre o el precio: Gmail y Outlook las bloquean por defecto y el correo
 *     tiene que leerse entero sin ellas.
 *   - Sin JavaScript, sin fuentes externas y sin `position`. Un visor de
 *     seguridad que bloquee el contenido remoto tiene que poder mostrar el
 *     texto.
 */

const NEGRO = "#1f2937";
const GRIS = "#6b7280";
const BORDE = "#e5e7eb";
const AZUL = "#2563eb";

/** Escapa texto que va dentro del HTML. Un título con `&` rompe el correo entero. */
function esc(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Vuelve seguro un valor para un atributo `href` y bloquea `javascript:`. */
function urlSegura(valor: string): string {
  if (!/^https?:\/\//i.test(valor)) return "#";
  return esc(valor);
}

export function asuntoFactura(modelo: ModeloFactura): string {
  return `Tu factura ${modelo.numero} — ${datosFiscales.razonSocial}`;
}

function lineasHtml(modelo: ModeloFactura): string {
  const filas = modelo.lineas
    .map((linea) => {
      const imagen = linea.imagen
        ? `<img src="${urlSegura(linea.imagen)}" alt="" width="56" height="56" ` +
          `style="width:56px;height:56px;border-radius:6px;object-fit:cover;` +
          `border:1px solid ${BORDE};display:block;" />`
        : "";

      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BORDE};">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${
                imagen
                  ? `<td style="padding-right:12px;vertical-align:top;">${imagen}</td>`
                  : ""
              }
              <td style="vertical-align:top;">
                <span style="display:block;font-size:14px;line-height:20px;color:${NEGRO};font-weight:600;">${esc(linea.titulo)}</span>
                <span style="display:block;font-size:12px;line-height:18px;color:${GRIS};">
                  ${linea.cantidad} × ${formatearImporte(linea.precioUnitario, modelo.moneda)}
                </span>
              </td>
            </tr>
          </table>
        </td>
        <td align="right" nowrap style="padding:12px 0;border-bottom:1px solid ${BORDE};font-size:14px;color:${NEGRO};font-weight:600;white-space:nowrap;">
          ${formatearImporte(linea.total, modelo.moneda)}
        </td>
      </tr>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      ${filas}
    </table>`;
}

function filaResumen(
  concepto: string,
  valor: string,
  destacado = false,
): string {
  return `
  <tr>
    <td style="padding:6px 0;font-size:${destacado ? "15px" : "13px"};color:${destacado ? NEGRO : GRIS};${destacado ? "font-weight:700;" : ""}">${concepto}</td>
    <td align="right" style="padding:6px 0;font-size:${destacado ? "16px" : "13px"};color:${NEGRO};white-space:nowrap;${destacado ? "font-weight:700;" : ""}">${valor}</td>
  </tr>`;
}

function htmlFactura(modelo: ModeloFactura, preheader: string): string {
  const saludo = modelo.cliente ? `Hola ${esc(modelo.cliente)}:` : "Hola:";

  // Cada línea se omite si falta el dato. Un pedido sin provincia (importado a
  // mano, o de una versión antigua del esquema) no puede imprimir "undefined"
  // dentro de una factura.
  const partesDireccion = modelo.direccion
    ? [
        modelo.direccion.calle,
        [modelo.direccion.codigo_postal, modelo.direccion.ciudad]
          .filter(Boolean)
          .join(" "),
        modelo.direccion.provincia,
        modelo.direccion.pais,
      ]
        .filter((parte) => Boolean(parte))
        .join("<br />")
    : "";

  const direccion = partesDireccion
    ? `<p style="margin:0;font-size:13px;line-height:20px;color:${GRIS};">${esc(partesDireccion)}</p>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(asuntoFactura(modelo))}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">

        <tr>
          <td style="padding:28px 32px;background-color:#111827;">
            <p style="margin:0;font-size:20px;line-height:28px;font-weight:700;color:#ffffff;">${esc(datosFiscales.razonSocial)}</p>
            <p style="margin:6px 0 0;font-size:13px;line-height:20px;color:#9ca3af;">NIF ${esc(datosFiscales.nif)} · ${esc(datosFiscales.direccion)}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0;font-size:20px;line-height:28px;color:${NEGRO};">Factura ${esc(modelo.numero)}</h1>
            <p style="margin:8px 0 24px;font-size:13px;line-height:20px;color:${GRIS};">
              Gracias por tu compra. Te adjuntamos los datos de la factura ${esc(modelo.numero)}, emitida el ${esc(formatearFecha(modelo.fecha))}.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;border:1px solid ${BORDE};border-radius:8px;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0 0 4px;font-size:12px;line-height:18px;color:${GRIS};text-transform:uppercase;letter-spacing:0.06em;">Facturar a</p>
                  <p style="margin:0;font-size:14px;line-height:20px;color:${NEGRO};font-weight:600;">${esc(modelo.cliente ?? "Cliente")}</p>
                  ${direccion}
                </td>
              </tr>
            </table>

            <h2 style="margin:28px 0 4px;font-size:14px;line-height:20px;color:${NEGRO};">Detalle del pedido</h2>
            <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:${GRIS};">
              ${modelo.unidades} ${modelo.unidades === 1 ? "artículo" : "artículos"} · Referencia ${esc(modelo.referencia)}
            </p>

            ${lineasHtml(modelo)}

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;border-collapse:collapse;">
              ${filaResumen("Subtotal", formatearImporte(modelo.subtotal, modelo.moneda))}
              ${filaResumen(`IVA (${modelo.ivaPorcentaje} %)`, formatearImporte(modelo.iva, modelo.moneda))}
              ${filaResumen("Envío", modelo.costeEnvio > 0 ? formatearImporte(modelo.costeEnvio, modelo.moneda) : "Gratis")}
              <tr>
                <td colspan="2" style="padding:0;border-top:2px solid ${NEGRO};"></td>
              </tr>
              ${filaResumen("Total", formatearImporte(modelo.total, modelo.moneda), true)}
            </table>

            <p style="margin:28px 0 0;">
              <a href="${urlSegura(modelo.url)}" style="display:inline-block;padding:12px 22px;background-color:${AZUL};color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">Ver o descargar la factura</a>
            </p>
            <p style="margin:10px 0 0;font-size:12px;line-height:18px;color:${GRIS};">
              Si el botón no funciona, copia esta dirección:<br />
              <a href="${urlSegura(modelo.url)}" style="color:${AZUL};">${esc(modelo.url)}</a>
            </p>

            <p style="margin:28px 0 0;font-size:14px;line-height:22px;color:${NEGRO};">${saludo}</p>
            <p style="margin:8px 0 0;font-size:14px;line-height:22px;color:${GRIS};">
              Te hemos enviado esta factura a ${esc(modelo.email ?? "tu correo")}. Conservamos tus datos para gestionar el pedido y atender las devoluciones. Puedes consultarlos o solicitar su baja en cualquier momento desde
              <a href="${urlSegura(`${sitio()}/privacidad`)}" style="color:${AZUL};">nuestra política de privacidad</a>.
            </p>
            <p style="margin:12px 0 0;font-size:14px;line-height:22px;color:${GRIS};">
              Para cualquier duda sobre el pedido, responde a este correo indicando la referencia <strong style="color:${NEGRO};">${esc(modelo.numero)}</strong>.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid ${BORDE};">
            <p style="margin:0;font-size:12px;line-height:19px;color:${GRIS};">
              ${esc(datosFiscales.razonSocial)} · NIF ${esc(datosFiscales.nif)}<br />
              ${esc(datosFiscales.direccion)} · ${esc(datosFiscales.telefono)}<br />
              <a href="mailto:${esc(datosFiscales.email)}" style="color:${AZUL};">${esc(datosFiscales.email)}</a>
            </p>
            <p style="margin:10px 0 0;font-size:12px;line-height:19px;color:${GRIS};">
              <a href="${urlSegura(`${sitio()}/aviso-legal`)}" style="color:${GRIS};text-decoration:underline;">Aviso legal</a> ·
              <a href="${urlSegura(`${sitio()}/privacidad`)}" style="color:${GRIS};text-decoration:underline;">Privacidad</a> ·
              <a href="${urlSegura(`${sitio()}/devoluciones`)}" style="color:${GRIS};text-decoration:underline;">Devoluciones</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Origen del sitio, para los enlaces legales del pie. */
function sitio(): string {
  return getSitioUrl();
}

function textoFactura(modelo: ModeloFactura): string {
  const lineas = modelo.lineas
    .map(
      (linea) =>
        `  ${linea.cantidad} x ${linea.titulo} — ${formatearImporte(
          linea.precioUnitario,
          modelo.moneda,
        )} c/u = ${formatearImporte(linea.total, modelo.moneda)}`,
    )
    .join("\n");

  const direccion = modelo.direccion
    ? [
        modelo.direccion.calle,
        [modelo.direccion.codigo_postal, modelo.direccion.ciudad]
          .filter(Boolean)
          .join(" "),
        modelo.direccion.provincia,
        modelo.direccion.pais,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  return `${datosFiscales.razonSocial}
NIF ${datosFiscales.nif}
${datosFiscales.direccion}
${datosFiscales.telefono} · ${datosFiscales.email}

FACTURA ${modelo.numero}
Fecha: ${formatearFecha(modelo.fecha)}
Referencia: ${modelo.referencia}

FACTURAR A
${modelo.cliente ?? "Cliente"}${direccion ? `\n${direccion}` : ""}

DETALLE DEL PEDIDO
${modelo.unidades} ${modelo.unidades === 1 ? "artículo" : "artículos"}

${lineas}

Subtotal: ${formatearImporte(modelo.subtotal, modelo.moneda)}
IVA (${modelo.ivaPorcentaje} %): ${formatearImporte(modelo.iva, modelo.moneda)}
Envío: ${modelo.costeEnvio > 0 ? formatearImporte(modelo.costeEnvio, modelo.moneda) : "Gratis"}
TOTAL: ${formatearImporte(modelo.total, modelo.moneda)}

Factura completa: ${modelo.url}

${modelo.cliente ? `Hola ${modelo.cliente}:` : "Hola:"}

Gracias por tu compra. Te hemos enviado esta factura a ${modelo.email ?? "tu correo"}. Conservamos tus datos para gestionar el pedido y atender las devoluciones; puedes consultarlos o solicitar su baja en nuestra política de privacidad: ${sitio()}/privacidad

Para cualquier duda sobre el pedido, responde a este correo indicando la referencia ${modelo.numero}.

--
${datosFiscales.razonSocial} · NIF ${datosFiscales.nif}
${datosFiscales.direccion} · ${datosFiscales.telefono} · ${datosFiscales.email}
Aviso legal: ${sitio()}/aviso-legal
Privacidad: ${sitio()}/privacidad
Devoluciones: ${sitio()}/devoluciones
`;
}

export function plantillaFactura(modelo: ModeloFactura): {
  asunto: string;
  html: string;
  texto: string;
} {
  const preheader = `Factura ${modelo.numero} · Total ${formatearImporte(
    modelo.total,
    modelo.moneda,
  )}`;

  return {
    asunto: asuntoFactura(modelo),
    html: htmlFactura(modelo, preheader),
    texto: textoFactura(modelo),
  };
}
