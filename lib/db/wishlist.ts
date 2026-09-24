import { createClient } from "@/lib/supabase/server";
import type { Wishlist, Producto, ProductoImagen } from "./types";

export type WishlistProducto = Wishlist & {
  productos: Producto & {
    producto_imagenes: ProductoImagen[];
  };
};

export async function getWishlistProductos(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist")
    .select("*, productos(*, producto_imagenes(*))")
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("No hemos podido cargar tu lista de deseos.");
  }

  return (data || []) as WishlistProducto[];
}
