"use client";

import { MissingSupabaseEnvError } from "@/lib/supabase/env";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isSupabaseEnvError = error instanceof MissingSupabaseEnvError;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 dark:border-neutral-800 dark:bg-black">
      <h2 className="text-xl font-bold">No hemos podido cargar la tienda</h2>

      {isSupabaseEnvError ? (
        <>
          <p className="my-2">Falta configurar Supabase en el entorno local.</p>
          <ol className="my-2 list-decimal space-y-1 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
            <li>
              Copia <code className="font-mono">.env.example</code> en{" "}
              <code className="font-mono">.env.local</code>.
            </li>
            <li>
              Rellena{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code className="font-mono">
                NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </code>{" "}
              con los datos de <strong>Project Settings &gt; API</strong>.
            </li>
            <li>Reinicia el servidor de desarrollo.</li>
          </ol>
        </>
      ) : (
        <p className="my-2">
          Puede ser un problema puntual. Vuelve a intentarlo en unos segundos.
        </p>
      )}

      {error.digest ? (
        <p className="mt-2 text-xs text-neutral-400">
          Referencia: {error.digest}
        </p>
      ) : null}

      <button
        className="mx-auto mt-4 flex w-full items-center justify-center rounded-full bg-blue-600 p-4 tracking-wide text-white hover:opacity-90"
        onClick={() => reset()}
      >
        Reintentar
      </button>
    </div>
  );
}
