/** Skeletons del panel, siguiendo el patrón de `app/search/loading.tsx`. */
function Bloque({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-card bg-ink-100 ${className}`} />
  );
}

export default function AdminLoading() {
  return (
    <div>
      <div className="mb-8">
        <Bloque className="h-4 w-24" />
        <Bloque className="mt-2 h-9 w-56" />
        <Bloque className="mt-2 h-4 w-72" />
      </div>

      <Bloque className="mb-3 h-3 w-24" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bloque key={i} className="h-28" />
        ))}
      </div>

      <Bloque className="mb-3 h-3 w-24" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bloque key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}
