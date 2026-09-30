"use server";

import { TAGS } from "@/lib/constants";
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCart,
} from "@/lib/commerce/placeholders";
import { revalidateTag } from "next/cache";

export async function addItem(prevState: any, payload: { productoId: string; varianteId: string; cantidad: number }) {
  try {
    await addToCart([{ merchandiseId: payload.varianteId, quantity: payload.cantidad }]);
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error adding item to cart";
  }
}

export async function removeItem(prevState: any, itemId: string) {
  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === itemId,
    );

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id]);
    } else {
      return "Item not found in cart";
    }

    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error removing item from cart";
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  },
) {
  const { merchandiseId, quantity } = payload;

  try {
    const cart = await getCart();

    if (!cart) {
      return "Error fetching cart";
    }

    const lineItem = cart.lines.find(
      (line) => line.merchandise.id === merchandiseId,
    );

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id]);
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity,
          },
        ]);
      }
    } else if (quantity > 0) {
      await addToCart([{ merchandiseId, quantity }]);
    }

    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
    return "Error updating item quantity";
  }
}

export async function clearCartAction() {
  try {
    revalidateTag(TAGS.cart, "seconds");
  } catch (e) {
    console.error(e);
  }
}
