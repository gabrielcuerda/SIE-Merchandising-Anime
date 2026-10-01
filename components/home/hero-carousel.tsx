"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HERO_INTERVAL_MS, heroSlides, type HeroSlide } from "@/lib/home/hero-slides";

function Slide({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  return (
    <div
      // aria-hidden: los lectores de pantalla ignoran las slides que no se ven
      // pointer-events-none: los enlaces de una slide oculta no se pueden clicar
      aria-hidden={!isActive}
      className={[
        "absolute inset-0 flex flex-col justify-center gap-3 bg-gradient-to-br p-6 transition-opacity duration-700 ease-out md:gap-4 md:p-14",
        "motion-reduce:transition-none", // accesibilidad: sin animación si el usuario la tiene desactivada
        slide.background,
        isActive ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      <span
        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${slide.accent}`}
      >
        {slide.eyebrow}
      </span>
      <h2 className="max-w-2xl text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
        {slide.title}
      </h2>
      <p className="max-w-xl text-sm text-slate-700 md:text-base">
        {slide.description}
      </p>
      <Link
        href={slide.ctaHref}
        tabIndex={isActive ? undefined : -1} // el tabulador salta los enlaces ocultos
        className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 md:text-base"
      >
        {slide.ctaLabel}
        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function HeroCarousel() {
  const total = heroSlides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Si el sistema operativo tiene desactivadas las animaciones, no autoplay:
  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Autoplay: se detiene al pasar el ratón, al enfocar con el tabulador
  // o si el usuario tiene reducida la animación.
  useEffect(() => {
    if (paused || reduceMotion) return;
    const id = setInterval(() => setActive((i) => (i + 1) % total), HERO_INTERVAL_MS);
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
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="relative min-h-[340px] sm:min-h-[400px] md:min-h-[460px]">
          {heroSlides.map((slide, i) => (
            <Slide key={slide.id} slide={slide} isActive={i === active} />
          ))}
        </div>

        {/* Flechas */}
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label="Diapositiva anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white/90 p-2 text-slate-800 shadow-sm transition hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label="Diapositiva siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white/90 p-2 text-slate-800 shadow-sm transition hover:bg-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Puntos indicadores */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir a la diapositiva ${i + 1}: ${slide.title}`}
              aria-current={i === active}
              className={[
                "h-2.5 rounded-full transition-all motion-reduce:transition-none",
                i === active ? "w-7 bg-slate-900" : "w-2.5 bg-slate-400 hover:bg-slate-600",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}