"use server";

import { TAGS } from "@/lib/constants";
import {
  addToCart,
  clearCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/cart";
import { revalidateTag } from "next/cache";

export async function addItem(
  prevState: any,
  payload: { productoId: string; varianteId: string; cantidad: number },
) {
  try {
    await addToCart(payload);
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: any, itemId: string) {
  try {
    await removeCartItem(itemId);
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: { itemId: string; cantidad: number },
) {
  try {
    await updateCartItem(payload.itemId, payload.cantidad);
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error updating item quantity";
  }
}

export async function clearCartAction() {
  try {
    await clearCart();
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
  }
}
