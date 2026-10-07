import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  getCategoriasDestacadas,
  type CategoriaDestacada,
} from "@/lib/db/categorias";
import { translate, type Lang } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/lang";
import Image from "next/image";

/**
 * Tira de banners promocionales por franquicia.
 */

// Degradado propio por franquicia.
const GRADIENTES: Record<string, string> = {
  "dragon-ball": "from-orange-500 via-amber-500 to-red-600",
  "one-piece": "from-red-600 via-rose-500 to-orange-600",
  naruto: "from-amber-400 via-yellow-500 to-orange-600",
  "jujutsu-kaisen": "from-violet-600 via-purple-700 to-indigo-800",
  "demon-slayer": "from-teal-600 via-cyan-700 to-slate-900",
  "chainsaw-man": "from-zinc-800 via-red-700 to-zinc-900",
};

const GRADIENTE_POR_DEFECTO = "from-blue-700 via-blue-800 to-blue-950";

const STORAGE =
  "https://utekksdmegnoxrrqpaoa.supabase.co/storage/v1/object/public/productos";

// Una foto por franquicia (cambiables en 1 línea cada una).
const FOTOS: Record<string, string> = {
  "dragon-ball": `${STORAGE}/DB.jpg`,
  "one-piece": `${STORAGE}/OP.jpg`,
  naruto: `${STORAGE}/N.jpg`,
  "jujutsu-kaisen": `${STORAGE}/JK.jpg`,
  "demon-slayer": `${STORAGE}/KnY.jpg`,
  "chainsaw-man": `${STORAGE}/CM.jpg`,
  "attack-on-titan": `${STORAGE}/AOT.jpg`,
};

type BannerProps = {
  categoria: CategoriaDestacada;
  duplicado?: boolean;
  lang: Lang;
};

function Banner({ categoria, duplicado = false, lang }: BannerProps) {
  const degradado = GRADIENTES[categoria.slug] ?? GRADIENTE_POR_DEFECTO;
  const etiqueta = translate(
    lang,
    `promo.item.${categoria.tipo}.${categoria.totalProductos === 1 ? "one" : "other"}`,
  );

  return (
    <Link
      href={`/search/${categoria.slug}`}
      tabIndex={duplicado ? -1 : undefined}
      className={`group/banner relative flex h-40 w-72 flex-none flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:h-44 sm:w-80 ${degradado}`}
    >
      {FOTOS[categoria.slug] ? (
        <>
          <Image
            src={FOTOS[categoria.slug] as string}
            alt=""
            fill
            sizes="(min-width: 640px) 320px, 288px"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* velo para que el texto se lea; el degradado queda detrás por si falla */}
          <span
            aria-hidden="true"
            className={`absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/25 to-transparent`}
          />
        </>
      ) : (
        /* Inicial gigante solo si no hay foto */
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-4 select-none text-[8rem] leading-none font-black text-white/10"
        >
          {categoria.nombre.charAt(0)}
        </span>
      )}

      <span className="relative inline-flex w-fit rounded-full bg-blue-950/30 px-2.5 py-1 text-[0.65rem] font-semibold tracking-widest uppercase">
        {translate(lang, "promo.franchise")}
      </span>

      <div className="relative">
        <p className="text-xl font-bold sm:text-2xl">{categoria.nombre}</p>
        <p className="mt-0.5 text-xs text-white/85">
          {categoria.totalProductos} {etiqueta}
          {categoria.totalOfertas > 0
            ? ` · ${categoria.totalOfertas} ${translate(lang, "promo.onSale")}`
            : ""}
        </p>
      </div>

      <span className="relative inline-flex items-center gap-1 text-sm font-semibold">
        {translate(lang, "promo.viewFigures")}
        <ChevronRightIcon
          aria-hidden="true"
          className="h-4 w-4 transition-transform group-hover/banner:translate-x-1"
        />
      </span>
    </Link>
  );
}

export default async function PromoCarousel() {
  const lang = await getLang();
  const categorias = await getCategoriasDestacadas();

  if (categorias.length === 0) return null;

  return (
    <section
      aria-label={translate(lang, "promo.aria")}
      className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-6 pb-8"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-blue-900">
            {translate(lang, "promo.title")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {translate(lang, "promo.subtitle")}
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-900 underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          {translate(lang, "promo.viewAll")}
          <ChevronRightIcon aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      <div className="group relative overflow-hidden motion-reduce:overflow-x-auto">
        {/* w-max + translateX(-50%) = bucle continuo sin costura */}
        <ul className="flex w-max animate-marquee gap-4 py-1 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
          {[...categorias, ...categorias].map((categoria, indice) => {
            const duplicado = indice >= categorias.length;
            return (
              <li
                key={`${categoria.id}-${indice}`}
                aria-hidden={duplicado || undefined}
              >
                <Banner
                  categoria={categoria}
                  duplicado={duplicado}
                  lang={lang}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
