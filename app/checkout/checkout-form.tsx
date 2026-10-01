"use client";

import { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { Carrito } from "@/lib/supabase/types";
import Price from "@/components/price";
import LoadingDots from "@/components/loading-dots";

let stripePromise: Promise<Stripe | null> | undefined;

function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      throw new Error(
        "Falta la variable de entorno NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY. " +
          "Añádela en Vercel → Settings → Environment Variables " +
          "(entornos Production y Preview) y vuelve a desplegar.",
      );
    }

    stripePromise = loadStripe(publishableKey);
  }

  return stripePromise;
}

export default function CheckoutForm({ cart }: { cart: Carrito }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const direccion = {
      nombre: formData.get("shipping_name") as string,
      calle: formData.get("shipping_address_line1") as string,
      ciudad: formData.get("shipping_city") as string,
      provincia: formData.get("shipping_state") as string,
      codigo_postal: formData.get("shipping_postal_code") as string,
      pais: formData.get("shipping_country") as string,
      telefono: (formData.get("shipping_phone") as string) || undefined,
    };

    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(cart.subtotal * 100),
          currency: "eur",
          direccion,
        }),
      });

      const data = await res.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error("Error creating payment intent:", error);
    } finally {
      setLoading(false);
    }
  };

  if (clientSecret) {
    return (
      <Elements
        stripe={getStripePromise()}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#2563eb" },
          },
        }}
      >
        <PaymentForm cart={cart} />
      </Elements>
    );
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Dirección de Envío</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="shipping_name"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Dirección (Calle y número)
                </label>
                <input
                  type="text"
                  name="shipping_address_line1"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Ciudad</label>
                <input
                  type="text"
                  name="shipping_city"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Provincia
                </label>
                <input
                  type="text"
                  name="shipping_state"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="shipping_postal_code"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">País</label>
                <input
                  type="text"
                  name="shipping_country"
                  required
                  defaultValue="España"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  name="shipping_phone"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:opacity-50"
          >
            {loading ? (
              <LoadingDots className="bg-white" />
            ) : (
              "Continuar al Pago"
            )}
          </button>
        </form>
      </div>
      <div className="w-full lg:w-80">
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
          <h2 className="mb-4 text-lg font-semibold">Resumen del Pedido</h2>
          <ul className="mb-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.productos?.titulo} x {item.cantidad}
                </span>
                <span>
                  {(
                    (item.producto_variantes?.precio || 0) * item.cantidad
                  ).toFixed(2)}{" "}
                  €
                </span>
              </li>
            ))}
          </ul>
          <div className="space-y-3 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-700">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">
                Subtotal
              </span>
              <Price amount={cart.subtotal.toFixed(2)} currencyCode="EUR" />
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">
                Envío
              </span>
              <span>Gratis</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">
                Impuestos
              </span>
              <span>Calculados al pagar</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-neutral-700">
              <span>Total</span>
              <Price amount={cart.subtotal.toFixed(2)} currencyCode="EUR" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({ cart }: { cart: Carrito }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "An error occurred");
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md">
      <h2 className="mb-4 text-lg font-semibold">Detalles del Pago</h2>
      <div className="mb-6">
        <PaymentElement />
      </div>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:opacity-50"
      >
        {loading ? (
          <LoadingDots className="bg-white" />
        ) : (
          <>Pagar {cart.subtotal.toFixed(2)} €</>
        )}
      </button>
    </form>
  );
}
