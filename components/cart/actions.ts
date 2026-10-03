"use server";

import {
  addToCart as addToCartDB,
  updateCartItem as updateCartItemDB,
  removeCartItem as removeCartItemDB,
  clearCart as clearCartDB,
} from "@/lib/cart";
import { revalidatePath } from "next/cache";

export type CartActionResult = {
  ok: boolean;
  error?: string;
};

const ok: CartActionResult = { ok: true };

/** Los mensajes del SQL llegan al usuario tal cual ("Solo quedan 2 unidades..."). */
function toMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message.replace(/\s*\(\w{0,5}: .*\)$/, "");
  }
  return "Ha ocurrido un error inesperado.";
}

export async function addItem(
  _prevState: unknown,
  payload: { productoId: string; varianteId: string; cantidad: number },
): Promise<CartActionResult> {
  try {
    await addToCartDB(payload);
    revalidatePath("/cart");
    return ok;
  } catch (e) {
    console.error("[carrito] addItem:", e);
    return { ok: false, error: toMessage(e) };
  }
}

export async function removeItem(
  _prevState: unknown,
  itemId: string,
): Promise<CartActionResult> {
  try {
    await removeCartItemDB(itemId);
    revalidatePath("/cart");
    return ok;
  } catch (e) {
    console.error("[carrito] removeItem:", e);
    return { ok: false, error: toMessage(e) };
  }
}

export async function updateItemQuantity(
  _prevState: unknown,
  payload: { itemId: string; cantidad: number },
): Promise<CartActionResult> {
  try {
    await updateCartItemDB(payload.itemId, payload.cantidad);
    revalidatePath("/cart");
    return ok;
  } catch (e) {
    console.error("[carrito] updateItemQuantity:", e);
    return { ok: false, error: toMessage(e) };
  }
}

export async function clearCartAction(): Promise<CartActionResult> {
  try {
    await clearCartDB();
    revalidatePath("/cart");
    return ok;
  } catch (e) {
    console.error("[carrito] clearCart:", e);
    return { ok: false, error: toMessage(e) };
  }
}
