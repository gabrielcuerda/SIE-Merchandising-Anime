import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Transporte de correo.
 *
 * La diferencia importante con `lib/stripe.ts` es que aquí NUNCA se lanza al
 * importar el módulo. `getStripe()` puede permitirse ser estricto porque si
 * Stripe no está configurado la tienda no puede cobrar y conviene gritar; un
 * correo que no sale no puede impedir una venta, así que un SMTP sin configurar
 * se traduce en "no se manda el correo y se anota en el log".
 *
 * Los timeouts no son opcionales: el webhook de Stripe espera nuestra respuesta y
 * un servidor SMTP que acepta la conexión y luego se queda colgado mantendría el
 * request abierto hasta que Stripe lo cortara, con el pedido ya creado.
 */

const PLACEHOLDER = /CHANGE_ME|TU[-_]|CAMBIAR_?AQUI|<[^>]+>|\.\.\./i;

function leer(nombre: string): string | undefined {
  const valor = process.env[nombre]?.trim();
  if (!valor || PLACEHOLDER.test(valor)) return undefined;
  return valor;
}

/**
 * El sitio necesita una URL ABSOLUTA en el email: los enlaces del texto no
 * pueden ser relativos. En producción la da `NEXT_PUBLIC_SITE_URL`; `VERCEL_URL`
 * está para no depender de acordarse de declararla (Vercel la pone sola, sin el
 * esquema, y con el dominio de preview en los despliegues de prueba).
 */
export function getSitioUrl(): string {
  const explicita = leer("NEXT_PUBLIC_SITE_URL");
  if (explicita) return explicita.replace(/\/+$/, "");

  const vercel = leer("VERCEL_URL");
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

/**
 * Si el envío está operativo.
 *
 * Exige host, usuario y contraseña: `EMAIL_FROM` tiene valor por defecto en
 * `getTransporter` y no sirve como señal de nada.
 */
export function isEmailConfigured(): boolean {
  return Boolean(
    leer("SMTP_HOST") && leer("SMTP_USER") && leer("SMTP_PASSWORD"),
  );
}

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = leer("SMTP_HOST");
  const user = leer("SMTP_USER");
  const password = leer("SMTP_PASSWORD");

  if (!host || !user || !password) {
    throw new Error(
      "El envío de correo no está configurado. Faltan SMTP_HOST, SMTP_USER o " +
        "SMTP_PASSWORD en el entorno. Añádelas en .env.local y, en producción, " +
        "en Vercel → Settings → Environment Variables.",
    );
  }

  // 465 es SMTPS (TLS desde el principio) y 587 es STARTTLS. Adivinar mal aquí
  // produce un error de autenticación que no dice nada de la causa.
  const puerto = Number(leer("SMTP_PORT") ?? 465);

  transporter = nodemailer.createTransport({
    host,
    port: puerto,
    secure: puerto === 465,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  return transporter;
}

/**
 * Remitente. Por defecto sale desde la casilla del propio dominio, que es lo
 * único que da SPF y DKIM en línea; `EMAIL_FROM` permite poner un nombre legible
 * ("Animemerchan <soporte@animemerchan.onl>") sin tocar la autenticación.
 */
export function getRemitente(): string {
  return leer("EMAIL_FROM") ?? `Animemerchan <${leer("SMTP_USER")}>`;
}

/** A dónde van las respuestas del cliente. */
export function getReplyTo(): string {
  return leer("EMAIL_REPLY_TO") ?? leer("SMTP_USER") ?? "";
}

/**
 * Copia oculta de cada factura.
 *
 * En BCC y no en CC a propósito: si el negocio fuera en CC, el cliente vería la
 * dirección del negocio en su copia y el hilo de respuestas se iría a dos buzones.
 */
export function getBcc(): string | null {
  return leer("EMAIL_BCC") ?? null;
}
