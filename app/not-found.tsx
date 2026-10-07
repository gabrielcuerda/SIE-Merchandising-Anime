import { HomeIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

import { getCategorias } from "@/lib/db/categorias";

async function getEnlaces() {
  try {
    return await getCategorias();
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const categorias = await getEnlaces();

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-(--breakpoint-xl) flex-col items-center justify-center px-4 py-16 text-center">
      <p
        aria-hidden="true"
        className="text-8xl font-black text-slate-200 sm:text-9xl"
      >
        404
      </p>

      <h1 className="-mt-6 text-2xl font-bold sm:text-3xl">
        Esta página no existe
      </h1>

      <p className="mt-3 max-w-lg text-sm text-slate-600 sm:text-base">
        Puede que la figura se haya agotado y la hayamos retirado del catálogo,
        o que la dirección esté mal escrita.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-ki-400 hover:text-ink-950 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
        >
          <HomeIcon className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
          Ver el catálogo
        </Link>
      </div>

      {categorias.length > 0 ? (
        <nav aria-label="Franquicias" className="mt-12">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            O sal directo a una franquicia
          </p>
          <ul className="mt-3 flex flex-wrap justify-center gap-2">
            {categorias.map((categoria) => (
              <li key={categoria.id}>
                <Link
                  href={`/search/${categoria.slug}`}
                  className="inline-block rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
                >
                  {categoria.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}
