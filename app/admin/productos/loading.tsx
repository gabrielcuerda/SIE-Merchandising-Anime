/** Skeletons del listado de productos. */
function Bloque({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-card bg-ink-100 ${className}`} />
  );
}

export default function AdminProductosLoading() {
  return (
    <div>
      <div className="mb-8">
        <Bloque className="h-4 w-24" />
        <Bloque className="mt-2 h-9 w-48" />
      </div>

      <div className="mb-5 flex gap-3">
        <Bloque className="h-10 flex-1" />
        <Bloque className="h-10 w-56" />
      </div>

      <div className="rounded-card border border-ink-200 bg-white p-5">
        <Bloque className="mb-4 h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Bloque key={i} className="mb-2 h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
