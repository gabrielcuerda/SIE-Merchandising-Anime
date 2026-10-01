"use server";

import { TAGS } from "@/lib/constants";
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
  clearCart,
} from "@/lib/cart";
import { revalidateTag } from "next/cache";

export async function addItem(prevState: any, formData: FormData) {
  try {
    const productoId = formData.get("productoId") as string;
    const varianteId = formData.get("varianteId") as string;
    const cantidad = Number(formData.get("cantidad")) || 1;

    await addToCart({
      productoId,
      varianteId,
      cantidad,
    });
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
  payload: {
    itemId: string;
    quantity: number;
  },
) {
  const { itemId, quantity } = payload;

  try {
    await updateCartItem(itemId, quantity);
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
