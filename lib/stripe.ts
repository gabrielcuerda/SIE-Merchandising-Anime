import Stripe from "stripe";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. ` +
        "Añádela en Vercel → Settings → Environment Variables " +
        "(entornos Production y Preview) y vuelve a desplegar.",
    );
  }

  return value;
}

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(
      requireEnv("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY),
    );
  }

  return stripeClient;
}

export const stripe: Stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder",
);

export function getStripeWebhookSecret(): string {
  return requireEnv("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
}
