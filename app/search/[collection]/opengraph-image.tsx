import OpengraphImage from "components/opengraph-image";
import { getCategoria } from "@/lib/db/categorias";

export default async function Image({
  params,
}: {
  params: { collection: string };
}) {
  const categoria = await getCategoria(params.collection);
  const title = categoria?.nombre || params.collection;

  return await OpengraphImage({ title });
}