"use client";

import type {
  Cart,
  CartItem,
  Product,
  ProductVariant,
} from "@/lib/commerce/types";
import React, {
  createContext,
  use,
  useContext,
  useMemo,
  useOptimistic,
} from "react";
import type { Carrito, CarritoItem } from "@/lib/supabase/types";

type UpdateType = "plus" | "minus" | "delete";

type CartAction =
  | { type: "UPDATE_ITEM"; payload: { itemId: string; updateType: UpdateType } }
  | {
      type: "ADD_ITEM";
      payload: {
        productoId: string;
        varianteId: string;
        titulo: string;
        imagen: string | null;
        varianteTitulo: string;
        precio: number;
      };
    };

type CartContextType = {
  cartPromise: Promise<Carrito | undefined>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function updateCartItem(
  item: CarritoItem,
  updateType: UpdateType,
): CarritoItem | null {
  if (updateType === "delete") return null;
  const newCantidad =
    updateType === "plus" ? item.cantidad + 1 : item.cantidad - 1;
  if (newCantidad === 0) return null;
  return { ...item, cantidad: newCantidad };
}

function createOrUpdateCartItem(
  existingItem: CarritoItem | undefined,
  payload: any,
): CarritoItem {
  const cantidad = existingItem ? existingItem.cantidad + 1 : 1;
  return {
    id: existingItem?.id || "",
    user_id: null,
    session_id: null,
    producto_id: payload.productoId,
    variante_id: payload.varianteId,
    cantidad,
    created_at: new Date().toISOString(),
    productos: {
      titulo: payload.titulo,
      slug: "",
      producto_imagenes: payload.imagen
        ? [{ url: payload.imagen, alt_text: payload.titulo }]
        : [],
    },
    producto_variantes: {
      titulo: payload.varianteTitulo,
      precio: payload.precio,
    },
  };
}

function updateCartTotals(
  items: CarritoItem[],
): Pick<Carrito, "totalItems" | "subtotal" | "moneda"> {
  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.producto_variantes?.precio || 0) * item.cantidad,
    0,
  );
  return { totalItems, subtotal, moneda: "EUR" };
}

function createEmptyCart(): Carrito {
  return { items: [], totalItems: 0, subtotal: 0, moneda: "EUR" };
}

function cartReducer(state: Carrito | undefined, action: CartAction): Carrito {
  const currentCart = state || createEmptyCart();

  switch (action.type) {
    case "UPDATE_ITEM": {
      const { itemId, updateType } = action.payload;
      const updatedItems = currentCart.items
        .map((item) =>
          item.id === itemId ? updateCartItem(item, updateType) : item,
        )
        .filter(Boolean) as CarritoItem[];
      return {
        ...currentCart,
        ...updateCartTotals(updatedItems),
        items: updatedItems,
      };
    }
    case "ADD_ITEM": {
      const existingItem = currentCart.items.find(
        (item) => item.variante_id === action.payload.varianteId,
      );
      const updatedItem = createOrUpdateCartItem(existingItem, action.payload);
      const updatedItems = existingItem
        ? currentCart.items.map((item) =>
            item.variante_id === action.payload.varianteId ? updatedItem : item,
          )
        : [...currentCart.items, updatedItem];
      return {
        ...currentCart,
        ...updateCartTotals(updatedItems),
        items: updatedItems,
      };
    }
    default:
      return currentCart;
  }
}

export function CartProvider({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Promise<Carrito | undefined>;
}) {
  return (
    <CartContext.Provider value={{ cartPromise }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined)
    throw new Error("useCart must be used within a CartProvider");

  const initialCart = use(context.cartPromise);
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    initialCart,
    cartReducer,
  );

  const updateCartItem = (itemId: string, updateType: UpdateType) => {
    updateOptimisticCart({
      type: "UPDATE_ITEM",
      payload: { itemId, updateType },
    });
  };

  const addCartItem = (payload: any) => {
    updateOptimisticCart({ type: "ADD_ITEM", payload });
  };

  return useMemo(
    () => ({ cart: optimisticCart, updateCartItem, addCartItem }),
    [optimisticCart],
  );
}
