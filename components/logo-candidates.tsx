import type { SVGProps } from "react";

const INK_950 = "#08080a";

type MarkProps = SVGProps<SVGSVGElement>;

/** 1. Sello circular: anillo + S trazado. */
export function MarkSeal(props: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      role="img"
      aria-label="Sello Animemerchan"
      {...props}
    >
      <circle
        cx="20"
        cy="20"
        r="16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.55"
      />
      <path
        d="M28 13.3a8 8 0 0 0-14.4 2.4c0 5.2 14.4 4.2 14.4 9a8 8 0 0 1-14.4 2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 2. Katana minimalista en diagonal. */
export function MarkKatana(props: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      role="img"
      aria-label="Katana Animemerchan"
      {...props}
    >
      <g transform="rotate(-40 20 20)" fill="currentColor">
        <path d="M18.3 21.5V7.2L20 3.2l1.7 4v14.3Z" />
        <rect x="14.6" y="21.2" width="10.8" height="2.4" rx="1.2" />
        <rect x="18.1" y="23.6" width="3.8" height="11.2" rx="1.9" />
      </g>
      <g
        transform="rotate(-40 20 20)"
        stroke={INK_950}
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      >
        <path d="M18.6 27.4h2.8" />
        <path d="M18.6 31h2.8" />
      </g>
    </svg>
  );
}

/** 3. S angular de tres rectas, uniones en bisagra. */
export function MarkAngular(props: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      role="img"
      aria-label="S angular Animemerchan"
      {...props}
    >
      <path
        d="M28 11.5H13V20h14v8.5H12"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
    </svg>
  );
}

/** 4. Disco solido con el S en negativo. */
export function MarkDisc(props: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      role="img"
      aria-label="Disco Animemerchan"
      {...props}
    >
      <circle cx="20" cy="20" r="19" fill="currentColor" />
      <path
        d="M28 13.3a8 8 0 0 0-14.4 2.4c0 5.2 14.4 4.2 14.4 9a8 8 0 0 1-14.4 2.4"
        fill="none"
        stroke={INK_950}
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const marks = [
  {
    id: "seal",
    name: "Sello circular",
    note: "Anillo + S trazado. Estetica de hanko japones.",
    Mark: MarkSeal,
    badge: "rounded-full",
  },
  {
    id: "katana",
    name: "Katana",
    note: "Silueta de espada en diagonal. Icono directo de anime.",
    Mark: MarkKatana,
    badge: "rounded-xl",
  },
  {
    id: "angular",
    name: "S angular",
    note: "Tres rectas y bisagras. Geometrico, nada de curvas.",
    Mark: MarkAngular,
    badge: "rounded-xl",
  },
  {
    id: "disc",
    name: "Disco solido",
    note: "Circulo naranja macizo con el S calado. Version pegatina.",
    Mark: MarkDisc,
    badge: "rounded-full",
  },
] as const;
