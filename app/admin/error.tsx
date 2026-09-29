"use client";

import Link from "next/link";

/**
 * Límite de error del panel. Next.js lo usa cuando una Server Component o una
 * Server Action lanza, así que es la red de seguridad cuando Supabase no
 * responde o falta la service role key: el admin ve qué hacer en lugar de un
 * error técnico en inglés.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-950">
      <p className="text-xs font-medium tracking-wide text-red-700 uppercase dark:text-red-400">
        Error del panel
      </p>

      <h2 className="mt-2 text-xl font-bold text-neutral-900 dark:text-white">
        No hemos podido cargar esta sección
      </h2>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        Suele deberse a un problema de conexión con la base de datos o a que
        falte la variable <code>SUPABASE_SERVICE_ROLE_KEY</code> en el entorno.
      </p>

      {/* `digest` correlaciona con los logs del servidor; el mensaje original
          no se muestra al cliente para no filtrar detalles de la base. */}
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
          Referencia: {error.digest}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Reintentar
        </button>
        <Link
          href="/admin"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Ir al resumen
        </Link>
        <Link
          href="/"
          className="px-2 py-2 text-sm text-neutral-600 hover:underline dark:text-neutral-300"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
