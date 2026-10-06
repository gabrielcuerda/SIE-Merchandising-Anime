import clsx from "clsx";

/**
 * Símbolo de marca: sello circular (estilo hanko japonés) con un monograma
 * "S" trazado con un solo trazo de thickness constante y remates redondos.
 * La forma circular lo distingue de las tarjetas cuadradas del catálogo.
 */
export default function LogoMark(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      role="img"
      aria-label="Animemerchan"
      {...props}
      className={clsx(props.className ?? "h-6 w-6")}
    >
      {/* Anillo del sello */}
      <circle
        cx="20"
        cy="20"
        r="16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.55"
      />
      {/* Monograma S trazado en un solo trazo */}
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
