"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HERO_INTERVAL_MS,
  getHeroSlides,
  type HeroSlide,
} from "@/lib/home/hero-slides";
import { translate } from "@/lib/i18n/dict";
import { useLanguage } from "@/components/i18n/language-context";
import Image from "next/image";

function Slide({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  return (
    <div
      aria-hidden={!isActive}
      className={[
        "absolute inset-0 transition-opacity duration-700 ease-out",
        "motion-reduce:transition-none",
        slide.background,
        isActive ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      {slide.image ? (
        <Image
          src={slide.image}
          alt=""
          fill
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
          priority={isActive}
        />
      ) : null}
      {/* velo oscuro para que el texto se lea sobre la foto */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/70 via-ink-950/35 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-center gap-3 p-6 md:gap-4 md:p-14">
        <span
          className={`inline-flex w-fit rounded-sm px-3 py-1 text-xs font-bold uppercase tracking-wide ${slide.accent}`}
        >
          {slide.eyebrow}
        </span>
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white uppercase drop-shadow-lg md:text-5xl">
          {slide.title}
        </h2>
        <p className="max-w-xl text-sm text-white/90 drop-shadow md:text-base">
          {slide.description}
        </p>
        <Link
          href={slide.ctaHref}
          tabIndex={isActive ? undefined : -1}
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-blue-700 px-6 py-3 text-sm font-extrabold tracking-wide text-white uppercase transition hover:bg-ki-400 hover:text-ink-950 focus-visible:ring-blue-700 md:text-base"
        >
          {slide.ctaLabel}
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export default function HeroCarousel() {
  const { lang } = useLanguage();
  const slides = getHeroSlides(lang);
  const total = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Si el sistema operativo tiene desactivadas las animaciones, no autoplay:
  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  // Autoplay: se detiene al pasar el ratón, al enfocar con el tabulador
  // o si el usuario tiene reducida la animación.
  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % total),
      HERO_INTERVAL_MS,
    );
    return () => clearInterval(id); // limpieza: evita fugas de temporizadores
  }, [paused, reduceMotion, total]);

  const go = (next: number) => setActive((next + total) % total);

  return (
    <section
      aria-label="Promociones de la tienda"
      aria-roledescription="carrusel"
      className="mx-auto max-w-(--breakpoint-2xl) px-4 pt-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-card border border-ink-200 bg-white">
        <div className="relative min-h-[370px] sm:min-h-[430px] md:min-h-[500px]">
          {slides.map((slide, i) => (
            <Slide key={slide.id} slide={slide} isActive={i === active} />
          ))}
        </div>

        {/* Flechas */}
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label={translate(lang, "hero.prev")}
          className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-md border border-ink-200 bg-white/90 p-2 text-ink-950 shadow-card transition hover:bg-brand-500 hover:text-white sm:block"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label={translate(lang, "hero.next")}
          className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-md border border-ink-200 bg-white/90 p-2 text-ink-950 shadow-card transition hover:bg-brand-500 hover:text-white sm:block"
        >
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Puntos indicadores */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`${translate(lang, "hero.dot")} ${i + 1}: ${slide.title}`}
              aria-current={i === active}
              className={[
                "h-2.5 rounded-full transition-all motion-reduce:transition-none",
                i === active
                  ? "w-7 bg-brand-500"
                  : "w-2.5 bg-ink-300 hover:bg-blue-700",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
