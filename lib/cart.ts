import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import type { Carrito, CarritoItem, Pedido } from "@/lib/supabase/types";

async function getSessionId(options?: { readOnly?: boolean }): Promise<string | undefined> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("cart_session_id")?.value;

  if (sessionId) return sessionId;
  if (options?.readOnly) return undefined;

  const newSessionId = randomUUID();
  cookieStore.set("cart_session_id", newSessionId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });

  return newSessionId;
}

export async function getCart(): Promise<Carrito | undefined> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("carrito_items")
    .select(`*, productos:titulo, slug, producto_imagenes(url, alt_text), producto_variantes:titulo, precio`);

  if (user) {
    query = query.eq("user_id", user.id);
  } else {
    const sessionId = await getSessionId({ readOnly: true });
    if (!sessionId) return undefined;
    query = query.eq("session_id", sessionId);
  }

  const { data: items } = await query;

  if (!items || items.length === 0) return undefined;

  const totalItems = items.reduce((sum: number, item: CarritoItem) => sum + item.cantidad, 0);
  const subtotal = items.reduce(
    (sum: number, item: CarritoItem) => sum + (item.producto_variantes?.precio || 0) * item.cantidad,
    0
  );

  return {
    items: items as CarritoItem[],
    totalItems,
    subtotal,
    moneda: "EUR",
  };
}

export async function addToCart(payload: {
  productoId: string;
  varianteId: string;
  cantidad: number;
}): Promise<Carrito> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const sessionId = await getSessionId();

  // Check if item already exists
  let existingQuery = supabase
    .from("carrito_items")
    .select("*")
    .eq("producto_id", payload.productoId)
    .eq("variante_id", payload.varianteId);

  if (user) {
    existingQuery = existingQuery.eq("user_id", user.id);
  } else {
    existingQuery = existingQuery.eq("session_id", sessionId);
  }

  const { data: existingItem } = await existingQuery.maybeSingle();

  if (existingItem) {
    const { error } = await supabase
      .from("carrito_items")
      .update({ cantidad: existingItem.cantidad + payload.cantidad })
      .eq("id", existingItem.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("carrito_items").insert({
      user_id: user?.id || null,
      session_id: user ? null : sessionId,
      producto_id: payload.productoId,
      variante_id: payload.varianteId,
      cantidad: payload.cantidad,
    });
    if (error) throw error;
  }

  return getCart() as Promise<Carrito>;
}

export async function updateCartItem(itemId: string, cantidad: number): Promise<Carrito> {
  const supabase = await createSupabaseServerClient();

  if (cantidad <= 0) {
    const { error } = await supabase.from("carrito_items").delete().eq("id", itemId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("carrito_items")
      .update({ cantidad })
      .eq("id", itemId);
    if (error) throw error;
  }

  return getCart() as Promise<Carrito>;
}

export async function removeCartItem(itemId: string): Promise<Carrito> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("carrito_items").delete().eq("id", itemId);
  if (error) throw error;

  return getCart() as Promise<Carrito>;
}

export async function clearCart(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("carrito_items").delete().eq("user_id", user.id);
  } else {
    const sessionId = await getSessionId();
    await supabase.from("carrito_items").delete().eq("session_id", sessionId);
  }
}

export async function createPedido(payload: {
  userId: string | null;
  direccion: {
    nombre: string;
    calle: string;
    ciudad: string;
    provincia: string;
    codigo_postal: string;
    pais: string;
    telefono?: string;
  };
  pagoId: string;
  metodoPago: string;
}): Promise<Pedido> {
  const supabase = await createSupabaseServerClient();
  const cart = await getCart();

  if (!cart || cart.items.length === 0) {
    throw new Error("El carrito está vacío");
  }

  const subtotal = cart.subtotal;
  const costeEnvio = 0;
  const total = subtotal + costeEnvio;

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      usuario_id: payload.userId,
      status: "paid",
      subtotal,
      coste_envio: costeEnvio,
      total,
      moneda: "EUR",
      direccion_pedido: payload.direccion,
      metodo_pago: payload.metodoPago,
      pago_id: payload.pagoId,
    })
    .select()
    .single();

  if (pedidoError) throw pedidoError;

  const itemsPedido = cart.items.map((item: CarritoItem) => ({
    pedido_id: pedido.id,
    producto_id: item.producto_id,
    variante_id: item.variante_id,
    titulo_producto: item.productos?.titulo || "Producto",
    img_producto: item.productos?.producto_imagenes?.[0]?.url || null,
    cantidad: item.cantidad,
    precio: item.producto_variantes?.precio || 0,
  }));

  await supabase.from("items_pedido").insert(itemsPedido);
  await clearCart();

  return pedido as Pedido;
}