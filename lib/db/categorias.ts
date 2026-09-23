import { supabase } from '@/lib/supabase/client'
import type { Categoria } from './types'

export type CategoriaHija = Categoria & { hijas: Categoria[] }

export async function getCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('orden_cat', { ascending: true })

  if (error) throw error
  return (data || []) as Categoria[]
}

export async function getCategoriasJerarquicas() {
  const categorias = await getCategorias()

  const padres = categorias
    .filter((c) => !c.parent_id)
    .map((c) => ({
      ...c,
      hijas: categorias.filter((h) => h.parent_id === c.id),
    }))

  return padres as CategoriaHija[]
}

export async function getCategoria(slug: string) {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as Categoria
}