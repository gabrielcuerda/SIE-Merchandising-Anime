import type { ItemPedido, Pedido, Profile } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const USUARIOS_POR_PAGINA = 25;

export type UsuarioAdmin = {
  id: string;
  email: string;
  full_nombre: string | null;
  telefono: string | null;
  direccion_calle: string | null;
  direccion_ciudad: string | null;
  direccion_provincia: string | null;
  direccion_codigo_postal: string | null;
  direccion_pais: string | null;
  created_at: string;
  es_admin: boolean;
  confirmado: boolean;
  ultimo_acceso: string | null;
  num_pedidos: number;
  total_gastado: number;
  moneda: string;
};

/** `getUsuarioAdmin` devuelve los pedidos con sus líneas ya anidadas. */
export type PedidoConItems = Pedido & { items_pedido: ItemPedido[] };

type Contexto = {
  perfil: Profile | null;
  email: string;
  esAdmin: boolean;
  confirmado: boolean;
  ultimoAcceso: string | null;
  createdAt: string;
};

/**
 * El email **sólo** existe en `auth.users`, y leerlo requiere la service role.
 * Se pagina el listado de Auth y se cruza en memoria con `profiles`.
 */
async function cargarContextos(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Map<string, Contexto>> {
  const contextos = new Map<string, Contexto>();
  let pagina = 1;
  const porPagina = 200;

  // Tope de seguridad: 20 páginas = 5.000 cuentas.
  while (pagina <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: pagina,
      perPage: porPagina,
    });

    if (error || !data || data.users.length === 0) break;

    for (const user of data.users) {
      contextos.set(user.id, {
        perfil: null,
        email: user.email ?? "(sin email)",
        esAdmin: user.app_metadata?.role === "admin",
        confirmado: Boolean(user.email_confirmed_at),
        ultimoAcceso: user.last_sign_in_at ?? null,
        createdAt: user.created_at,
      });
    }

    if (data.users.length < porPagina) break;
    pagina += 1;
  }

  const { data: perfiles } = await admin
    .from("profiles")
    .select("*");

  for (const perfil of perfiles ?? []) {
    const contexto = contextos.get(perfil.id);

    contextos.set(perfil.id, {
      perfil,
      // Un perfil sin cuenta de Auth asociada es un dato huérfano: se muestra
      // igual, para que el admin pueda limpia la base.
      email: contexto?.email ?? "(cuenta eliminada)",
      esAdmin: contexto?.esAdmin ?? false,
      confirmado: contexto?.confirmado ?? false,
      ultimoAcceso: contexto?.ultimoAcceso ?? null,
      createdAt: contexto?.createdAt ?? perfil.created_at,
    });
  }

  return contextos;
}

export async function listUsuariosAdmin(
  page = 1,
  busqueda?: string,
): Promise<{
  usuarios: UsuarioAdmin[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const admin = createAdminClient();
  const pagina = Math.max(1, page);

  const [contextos, pedidosRes] = await Promise.all([
    cargarContextos(admin),
    admin.from("pedidos").select("usuario_id, total, moneda, status"),
  ]);

  // Agregado de pedidos por usuario, en una sola pasada.
  const pedidosPorUsuario = new Map<
    string,
    { num: number; total: number; moneda: string }
  >();

  for (const pedido of (pedidosRes.data ?? []) as Pick<
    Pedido,
    "usuario_id" | "total" | "moneda" | "status"
  >[]) {
    if (!pedido.usuario_id) continue;

    const actual = pedidosPorUsuario.get(pedido.usuario_id) ?? {
      num: 0,
      total: 0,
      moneda: pedido.moneda || "EUR",
    };

    actual.num += 1;
    // Un pedido cancelado no es dinero gastado.
    if (pedido.status !== "cancelled") {
      actual.total += Number(pedido.total ?? 0);
    }

    pedidosPorUsuario.set(pedido.usuario_id, actual);
  }

  let usuarios: UsuarioAdmin[] = [...contextos.entries()].map(
    ([id, contexto]) => {
      const agregado = pedidosPorUsuario.get(id);

      return {
        id,
        email: contexto.email,
        full_nombre: contexto.perfil?.full_nombre ?? null,
        telefono: contexto.perfil?.telefono ?? null,
        direccion_calle: contexto.perfil?.direccion_calle ?? null,
        direccion_ciudad: contexto.perfil?.direccion_ciudad ?? null,
        direccion_provincia: contexto.perfil?.direccion_provincia ?? null,
        direccion_codigo_postal: contexto.perfil?.direccion_codigo_postal ?? null,
        direccion_pais: contexto.perfil?.direccion_pais ?? null,
        created_at: contexto.createdAt,
        es_admin: contexto.esAdmin,
        confirmado: contexto.confirmado,
        ultimo_acceso: contexto.ultimoAcceso,
        num_pedidos: agregado?.num ?? 0,
        total_gastado: agregado?.total ?? 0,
        moneda: agregado?.moneda ?? "EUR",
      };
    },
  );

  if (busqueda) {
    const termino = busqueda.trim().toLowerCase();
    usuarios = usuarios.filter(
      (usuario) =>
        usuario.email.toLowerCase().includes(termino) ||
        (usuario.full_nombre ?? "").toLowerCase().includes(termino),
    );
  }

  // Los compradores van primero: es el público que más se consulta desde admin.
  usuarios.sort((a, b) => {
    if (b.total_gastado !== a.total_gastado) {
      return b.total_gastado - a.total_gastado;
    }
    return b.created_at.localeCompare(a.created_at);
  });

  const total = usuarios.length;
  const inicio = (pagina - 1) * USUARIOS_POR_PAGINA;

  return {
    usuarios: usuarios.slice(inicio, inicio + USUARIOS_POR_PAGINA),
    total,
    page: pagina,
    totalPages: Math.max(1, Math.ceil(total / USUARIOS_POR_PAGINA)),
  };
}

export async function getUsuarioAdmin(id: string) {
  const admin = createAdminClient();
  const contextos = await cargarContextos(admin);
  const contexto = contextos.get(id);

  const { data: pedidos } = await admin
    .from("pedidos")
    .select("*, items_pedido(*)")
    .eq("usuario_id", id)
    .order("created_at", { ascending: false });

  if (!contexto) return null;

  return {
    id,
    email: contexto.email,
    es_admin: contexto.esAdmin,
    confirmado: contexto.confirmado,
    ultimo_acceso: contexto.ultimoAcceso,
    created_at: contexto.createdAt,
    perfil: contexto.perfil,
    pedidos: (pedidos ?? []) as PedidoConItems[],
  };
}
