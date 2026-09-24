import OpengraphImage from "components/opengraph-image";
import { getPage } from "@/lib/commerce/placeholders";

export default async function Image({ params }: { params: { page: string } }) {
  const page = await getPage(params.page);
  const title = page?.seo?.title || page?.title || params.page;

  return await OpengraphImage({ title });
}
