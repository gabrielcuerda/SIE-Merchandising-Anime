import type { ItemPedido, Pedido, Profile } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { PEDIDO_STATUS_VALUES } from "@/lib/admin/constants";
import type { PedidoStatus } from "@/lib/admin/constants";

export const PEDIDOS_POR_PAGINA = 20;

/** Techo de pedidos que se trae para filtrar en memoria (ver `listPedidosAdmin`). */
const MAX_PEDIDOS_BUSCADOS = 500;

export type PedidoAdmin = Pedido & {
  items_pedido: ItemPedido[];
  profiles: Profile | null;
};

export type FiltrosPedidos = {
  status?: string;
  busqueda?: string;
  page?: number;
};

export function isPedidoStatus(value: string): value is PedidoStatus {
  return (PEDIDO_STATUS_VALUES as string[]).includes(value);
}

/**
 * `profiles` no tiene columna `email` — el email vive en `auth.users` y sólo
 * se puede leer con la service role. Además, el nombre no se puede filtrar
 * desde Postgres sin depender de una FK `pedidos → profiles` que el proyecto
 * no garantiza. Por eso el texto se filtra en memoria sobre un conjunto acotado
 * (ver `listPedidosAdmin`) y el email se resuelve antes, en `auth.users`.
 */
export async function listPedidosAdmin({
  status,
  busqueda,
  page = 1,
}: FiltrosPedidos = {}) {
  const supabase = createAdminClient();
  const pagina = Math.max(1, page);
  const desde = (pagina - 1) * PEDIDOS_POR_PAGINA;

  const termino = busqueda?.trim().toLowerCase() ?? "";
  const filtrandoTexto = termino.length > 0;
  /**
   * Sólo si el término lleva "@" se sabe que se busca por email, y entonces
   * se resuelve en `auth.users` (el email no está en `profiles`) y se acota
   * la consulta en la base de datos. Con cualquier otro término el filtrado
   * es en memoria sobre un conjunto acotado, para que buscar un nombre no
   * descarte de salida a un usuario cuyo email sí coincide.
   */
  const buscandoEmail = filtrandoTexto && termino.includes("@");

  const emailPorUsuario = buscandoEmail
    ? await buscarEmailsPorTermino(supabase, termino)
    : new Map<string, string>();

  let query = supabase.from("pedidos").select("*, items_pedido(*)");

  if (status && isPedidoStatus(status)) {
    query = query.eq("status", status);
  }

  if (buscandoEmail && emailPorUsuario.size > 0) {
    query = query.or(
      `usuario_id.in.(${[...emailPorUsuario.keys()].join(",")})`,
    );
  }

  // Sin búsqueda textual se pagina en la base de datos. Con búsqueda, se trae
  // un conjunto acotado y se filtra en memoria, para que "página 3" siga
  // significando lo mismo que con el filtro puesto.
  const { data, error } = filtrandoTexto
    ? await query
        .order("created_at", { ascending: false })
        .limit(MAX_PEDIDOS_BUSCADOS)
    : await query
        .order("created_at", { ascending: false })
        .range(desde, desde + PEDIDOS_POR_PAGINA - 1);

  if (error) {
    throw new Error("No hemos podido cargar los pedidos.");
  }

  let pedidos = (data ?? []) as PedidoAdmin[];

  // El perfil se pide aparte: no se depende de que exista la FK
  // `pedidos.usuario_id → profiles.id` en la base de datos.
  const perfilPorUsuario = await cargarPerfiles(
    supabase,
    pedidos.map((pedido) => pedido.usuario_id).filter((id): id is string => Boolean(id)),
  );

  pedidos = pedidos.map((pedido) => ({
    ...pedido,
    profiles: pedido.usuario_id
      ? (perfilPorUsuario.get(pedido.usuario_id) ?? null)
      : null,
  }));

  if (filtrandoTexto) {
    pedidos = pedidos.filter((pedido) => {
      if (pedido.id.toLowerCase().includes(termino)) return true;

      if ((pedido.profiles?.full_nombre ?? "").toLowerCase().includes(termino)) {
        return true;
      }

      // El email del cliente, resuelto en `auth.users` sólo si la búsqueda
      // era por email.
      const email = pedido.usuario_id
        ? emailPorUsuario.get(pedido.usuario_id)
        : undefined;

      return Boolean(email?.toLowerCase().includes(termino));
    });

    const inicio = desde;
    const total = pedidos.length;

    return {
      pedidos: pedidos.slice(inicio, inicio + PEDIDOS_POR_PAGINA),
      total,
      page: pagina,
      totalPages: Math.max(1, Math.ceil(total / PEDIDOS_POR_PAGINA)),
    };
  }

  let consultaConteo = supabase
    .from("pedidos")
    .select("id", { count: "exact", head: true });

  if (status && isPedidoStatus(status)) {
    consultaConteo = consultaConteo.eq("status", status);
  }

  const { count } = await consultaConteo;

  const total = count ?? 0;

  return {
    pedidos,
    total,
    page: pagina,
    totalPages: Math.max(1, Math.ceil(total / PEDIDOS_POR_PAGINA)),
  };
}

async function cargarPerfiles(
  supabase: ReturnType<typeof createAdminClient>,
  usuarioIds: string[],
): Promise<Map<string, Profile>> {
  const perfiles = new Map<string, Profile>();
  const unicos = [...new Set(usuarioIds)];

  if (unicos.length === 0) return perfiles;

  // `in()` acepta miles de valores, pero se trocea por seguridad.
  for (let i = 0; i < unicos.length; i += 200) {
    const lote = unicos.slice(i, i + 200);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("id", lote);

    for (const perfil of (data ?? []) as Profile[]) {
      perfiles.set(perfil.id, perfil);
    }
  }

  return perfiles;
}

export async function getPedidoAdmin(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("pedidos")
    .select("*, items_pedido(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("No hemos podido cargar el pedido.");
  if (!data) return null;

  const pedido = data as Pedido & { items_pedido: ItemPedido[] };

  let perfil: Profile | null = null;
  if (pedido.usuario_id) {
    const perfiles = await cargarPerfiles(supabase, [pedido.usuario_id]);
    perfil = perfiles.get(pedido.usuario_id) ?? null;
  }

  return { ...pedido, profiles: perfil } as PedidoAdmin;
}

/** Direcciones guardadas como JSONB; el cliente no valida su forma. */
export type Direccion = {
  nombre?: string;
  calle?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  pais?: string;
  telefono?: string;
};

/** Normaliza el JSONB de `direccion_pedido` / `direccion_pago`. */
export function leerDireccion(valor: unknown): Direccion | null {
  if (!valor || typeof valor !== "object") return null;

  const direccion = valor as Direccion;
  const hayAlgo = Object.values(direccion).some(Boolean);

  return hayAlgo ? direccion : null;
}

/**
 * `auth.admin.listUsers()` trae el email, que `profiles` no tiene. Se pagina
 * para no arrastrar un número ilimitado de cuentas a memoria.
 *
 * Devuelve un mapa `id de usuario → email` con las coincidencias, que es
 * justo lo que necesitan tanto el filtro de Postgres como la comprobación
 * final en memoria.
 */
async function buscarEmailsPorTermino(
  supabase: ReturnType<typeof createAdminClient>,
  termino: string,
): Promise<Map<string, string>> {
  const coincidencias = new Map<string, string>();
  let pagina = 1;
  const porPagina = 200;

  // Tope de seguridad: 20 páginas = 4.000 cuentas.
  while (pagina <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });

    if (error || !data || data.users.length === 0) break;

    for (const user of data.users) {
      const email = user.email ?? "";
      if (email.toLowerCase().includes(termino)) {
        coincidencias.set(user.id, email);
      }
    }

    if (data.users.length < porPagina) break;
    pagina += 1;
  }

  return coincidencias;
}
