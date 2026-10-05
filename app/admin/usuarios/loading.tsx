/** Skeletons del listado de usuarios. */
function Bloque({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-card bg-ink-100 ${className}`} />
  );
}

export default function AdminUsuariosLoading() {
  return (
    <div>
      <div className="mb-8">
        <Bloque className="h-4 w-24" />
        <Bloque className="mt-2 h-9 w-48" />
      </div>

      <div className="mb-5">
        <Bloque className="h-10 w-full" />
      </div>

      <div className="rounded-card border border-ink-200 bg-white p-5">
        <Bloque className="mb-4 h-8 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Bloque key={i} className="mb-2 h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
