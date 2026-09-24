"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type WishlistActionResult = {
  saved?: boolean;
  error?: string;
};

export async function toggleWishlist(
  productId: string,
  currentlySaved: boolean,
): Promise<WishlistActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Inicia sesión para usar tu lista de deseos." };
  }

  const query = currentlySaved
    ? supabase
        .from("wishlist")
        .delete()
        .eq("usuario_id", user.id)
        .eq("producto_id", productId)
    : supabase
        .from("wishlist")
        .insert({ usuario_id: user.id, producto_id: productId });

  const { error } = await query;

  if (error && error.code !== "23505") {
    return { error: "No hemos podido actualizar tu lista de deseos." };
  }

  revalidatePath("/wishlist");
  revalidatePath("/account");
  revalidatePath("/account/wishlist");

  return { saved: !currentlySaved };
}
