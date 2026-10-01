import { supabase } from "@/lib/supabase/client";
import type { Categoria } from "./types";

export type CategoriaHija = Categoria & { hijas: Categoria[] };

export async function getCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("orden_cat", { ascending: true });

  if (error) throw error;
  return (data || []) as Categoria[];
}

export type CategoriaDestacada = Categoria & {
  totalProductos: number;
  totalOfertas: number;
};

/**
 * Categorías con el número de figuras de cada una.
 */
export async function getCategoriasDestacadas(): Promise<CategoriaDestacada[]> {
  // Las dos consultas van a la vez: no hay por qué esperar a la primera
  const [categorias, productos] = await Promise.all([
    getCategorias(),
    supabase.from('productos').select('categoria_id, status'),
  ]);

  if (productos.error) throw productos.error;

  const filas = (productos.data ?? []) as {
    categoria_id: string | null;
    status: string;
  }[];

  return categorias.map((categoria) => {
    const propias = filas.filter((p) => p.categoria_id === categoria.id);

    return {
      ...categoria,
      totalProductos: propias.length,
      totalOfertas: propias.filter((p) => p.status === 'oferta').length,
    };
  });
}

export async function getCategoriasJerarquicas() {
  const categorias = await getCategorias();

  const padres = categorias
    .filter((c) => !c.parent_id)
    .map((c) => ({
      ...c,
      hijas: categorias.filter((h) => h.parent_id === c.id),
    }));

  return padres as CategoriaHija[];
}

export async function getCategoria(slug: string) {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data as Categoria;
}
