"use client";

import { useState } from "react";

import { deleteCategoria } from "@/app/admin/actions/categorias";
import type { AdminActionState } from "@/app/admin/actions/productos";
import { Button } from "@/components/admin/ui/button";

export function DeleteCategoryButton({
  categoriaId,
  nombre,
  productos,
  hijas,
}: {
  categoriaId: string;
  nombre: string;
  productos: number;
  hijas: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const bloqueado = productos > 0 || hijas > 0;

  return (
    <div>
      <Button
        type="button"
        variant="danger"
        disabled={bloqueado || pending}
        onClick={async () => {
          if (
            !window.confirm(
              `¿Eliminar la categoría "${nombre}"? Esta acción no se puede deshacer.`,
            )
          ) {
            return;
          }

          setError(null);
          setPending(true);

          try {
            const formData = new FormData();
            formData.set("id", categoriaId);

            const resultado: AdminActionState = await deleteCategoria(
              {},
              formData,
            );

            if (resultado.error) setError(resultado.error);
          } catch {
            setError("No hemos podido eliminar la categoría.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Eliminando..." : "Eliminar"}
      </Button>

      {bloqueado ? (
        <p className="mt-1 max-w-xs text-xs text-neutral-500 dark:text-neutral-400">
          No se puede eliminar: {productos > 0 ? `${productos} producto(s)` : ""}
          {productos > 0 && hijas > 0 ? " y " : ""}
          {hijas > 0 ? `${hijas} subcategoría(s)` : ""}.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-1 max-w-xs text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
