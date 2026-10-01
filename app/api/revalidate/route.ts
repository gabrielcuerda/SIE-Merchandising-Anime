import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Revalida la tienda a demanda (por ejemplo tras un despliegue).
 *
 * 🔒 Este endpoint queda fuera de `/admin` y lo puede llamar cualquiera, así
 * que va protegido con un secreto compartido. `proxy.ts` no lo cubre: su
 * matcher sólo reescribe la sesión, no bloquea la ruta.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secreto = process.env.REVALIDATE_SECRET;

  if (!secreto) {
    return NextResponse.json(
      { revalidated: false, error: "REVALIDATE_SECRET no está configurada." },
      { status: 503 },
    );
  }

  const recibido = request.headers.get("x-revalidate-secret") ?? "";

  if (!secretoValido(recibido, secreto)) {
    return NextResponse.json(
      { revalidated: false, error: "Secreto inválido." },
      { status: 401 },
    );
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ revalidated: true });
}

/** Comparación en tiempo constante para no filtrar el secreto por temporización. */
function secretoValido(recibido: string, esperado: string): boolean {
  const a = createHmac("sha256", "revalidate").update(recibido).digest();
  const b = createHmac("sha256", "revalidate").update(esperado).digest();

  return timingSafeEqual(a, b);
}
