"use client";

import { useState } from "react";
import type { Carrito } from "@/lib/supabase/types";
import Price from "@/components/price";
import LoadingDots from "@/components/loading-dots";
import { IVA_PORCENTAJE } from "@/lib/constants";

/**
 * El pago ocurre en la página alojada de Stripe Checkout: aquí se pide la
 * dirección de envío y el email, que viajan a Stripe para la factura y para el
 * pedido.
 *
 * El email es obligatorio y va aparte de la dirección a propósito. Stripe lo pide
 * también en su página, pero lo que el cliente escriba ahí no se guarda en
 * ninguna parte de nuestra base de datos: es el dato que permite mandar la
 * factura a un invitado y poder reenviarla a mano desde el panel.
 *
 * Con sesión iniciada el campo viene relleno y no se puede tocar: la factura va
 * a la dirección con la que se registró la cuenta.
 */
export default function CheckoutForm({
  cart,
  emailInicial,
  emailBloqueado,
}: {
  cart: Carrito;
  emailInicial?: string | null;
  emailBloqueado?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const campo = (name: string) =>
      (formData.get(name) as string)?.trim() ?? "";

    const direccion = {
      nombre: campo("shipping_name"),
      calle: campo("shipping_address_line1"),
      ciudad: campo("shipping_city"),
      provincia: campo("shipping_state"),
      codigo_postal: campo("shipping_postal_code"),
      pais: campo("shipping_country"),
      telefono: campo("shipping_phone") || undefined,
      email: campo("shipping_email") || undefined,
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? "No se ha podido iniciar el pago.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("No se ha podido conectar con el servidor de pago.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold">Dirección de Envío</h2>
            <p className="mb-4 text-sm text-neutral-500">
              Te mandamos la factura a este correo.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="shipping_email"
                  className="mb-1 block text-sm font-medium"
                >
                  Email
                </label>
                <input
                  id="shipping_email"
                  name="shipping_email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly={emailBloqueado}
                  defaultValue={emailInicial ?? ""}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm read-only:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:read-only:bg-neutral-800"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="shipping_name"
                  className="mb-1 block text-sm font-medium"
                >
                  Nombre Completo
                </label>
                <input
                  id="shipping_name"
                  type="text"
                  name="shipping_name"
                  autoComplete="name"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="shipping_address_line1"
                  className="mb-1 block text-sm font-medium"
                >
                  Dirección (Calle y número)
                </label>
                <input
                  id="shipping_address_line1"
                  type="text"
                  name="shipping_address_line1"
                  autoComplete="address-line1"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label
                  htmlFor="shipping_city"
                  className="mb-1 block text-sm font-medium"
                >
                  Ciudad
                </label>
                <input
                  id="shipping_city"
                  type="text"
                  name="shipping_city"
                  autoComplete="address-level2"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label
                  htmlFor="shipping_state"
                  className="mb-1 block text-sm font-medium"
                >
                  Provincia
                </label>
                <input
                  id="shipping_state"
                  type="text"
                  name="shipping_state"
                  autoComplete="address-level1"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label
                  htmlFor="shipping_postal_code"
                  className="mb-1 block text-sm font-medium"
                >
                  Código Postal
                </label>
                <input
                  id="shipping_postal_code"
                  type="text"
                  name="shipping_postal_code"
                  autoComplete="postal-code"
                  required
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label
                  htmlFor="shipping_country"
                  className="mb-1 block text-sm font-medium"
                >
                  País
                </label>
                <input
                  id="shipping_country"
                  type="text"
                  name="shipping_country"
                  autoComplete="country-name"
                  required
                  defaultValue="España"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="shipping_phone"
                  className="mb-1 block text-sm font-medium"
                >
                  Teléfono (opcional)
                </label>
                <input
                  id="shipping_phone"
                  type="tel"
                  name="shipping_phone"
                  autoComplete="tel"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-blue-600 p-3 text-center text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:opacity-50"
          >
            {loading ? (
              <LoadingDots className="bg-white" />
            ) : (
              `Pagar ${cart.total.toFixed(2)} €`
            )}
          </button>

          <p className="text-center text-xs text-neutral-500">
            En el siguiente paso pagarás con tarjeta en la página segura de
            Stripe. Recibirás tu factura por email en cuanto se confirme el
            pago.
          </p>
        </form>
      </div>

      <div className="w-full lg:w-80">
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
          <h2 className="mb-4 text-lg font-semibold">Resumen del Pedido</h2>
          <ul className="mb-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 text-sm">
                <span className="min-w-0">
                  {item.productos?.titulo} × {item.cantidad}
                </span>
                <span className="shrink-0">
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
                IVA ({IVA_PORCENTAJE} %)
              </span>
              <Price amount={cart.iva.toFixed(2)} currencyCode="EUR" />
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">
                Envío
              </span>
              <span>
                {cart.costeEnvio > 0
                  ? `${cart.costeEnvio.toFixed(2)} €`
                  : "Gratis"}
              </span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold dark:border-neutral-700">
              <span>Total</span>
              <Price amount={cart.total.toFixed(2)} currencyCode="EUR" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
