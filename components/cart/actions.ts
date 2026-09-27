"use server";

import { addToCart as addToCartDB, updateCartItem as updateCartItemDB, removeCartItem as removeCartItemDB, clearCart as clearCartDB } from "@/lib/cart";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/constants";

export async function addItem(prevState: any, payload: { productoId: string; varianteId: string; cantidad: number }) {
  try {
    await addToCartDB(payload);
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: any, itemId: string) {
  try {
    await removeCartItemDB(itemId);
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(prevState: any, payload: { itemId: string; cantidad: number }) {
  try {
    await updateCartItemDB(payload.itemId, payload.cantidad);
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error updating item quantity";
  }
}

export async function clearCartAction() {
  try {
    await clearCartDB();
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
  }
}