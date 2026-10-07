import {
  AcademicCapIcon,
  ArrowUturnLeftIcon,
  CreditCardIcon,
  SparklesIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";
import { translate } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/lang";
import {
  getAnnounceSlides,
  type AnnounceIcon,
} from "@/lib/navbar/announcement-slides";

const ICONOS: Record<AnnounceIcon, typeof TruckIcon> = {
  truck: TruckIcon,
  return: ArrowUturnLeftIcon,
  card: CreditCardIcon,
  import: SparklesIcon,
  academic: AcademicCapIcon,
};

/**
 * Tira de avisos del header. Mismo patrón de bucle continuo que los banners
 * por franquicia: w-max + translateX(-50%) sobre la lista duplicada.
 */
export default async function AnnouncementBar() {
  const lang = await getLang();
  const slides = getAnnounceSlides(lang);

  return (
    <div className="bg-blue-900 text-white">
      <div className="marquee-fade group relative overflow-hidden motion-reduce:overflow-x-auto">
        <ul className="flex w-max animate-marquee-quick items-center py-3.5 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none">
          {[...slides, ...slides].map((slide, i) => {
            const duplicado = i >= slides.length;
            const Icono = ICONOS[slide.icon];

            const contenido = (
              <>
                <Icono
                  className="h-3.5 w-3.5 shrink-0 text-ki-400"
                  aria-hidden="true"
                />
                <span
                  className={clsx(
                    "shrink-0",
                    slide.destacado ? "text-ki-300" : "text-ki-400",
                  )}
                >
                  {slide.title}
                </span>
                <span className="font-medium normal-case tracking-normal text-blue-100">
                  {slide.text}
                </span>
              </>
            );

            return (
              <li
                key={`${slide.id}-${i}`}
                aria-hidden={duplicado || undefined}
                className="flex flex-none items-center gap-1.5 pr-8 text-[11px] font-bold whitespace-nowrap tracking-[0.14em] uppercase"
              >
                {slide.href && !duplicado ? (
                  <Link
                    href={slide.href}
                    tabIndex={duplicado ? -1 : undefined}
                    className="flex items-center gap-1.5"
                  >
                    {contenido}
                  </Link>
                ) : (
                  contenido
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="border-t border-blue-200 bg-white px-6 py-2.5 text-center text-[10px] leading-tight font-medium text-blue-700">
        {translate(lang, "announce.disclaimer")}
      </p>
    </div>
  );
}
