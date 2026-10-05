import type { Metadata } from "next";

import Prose from "components/prose";
import Link from "next/link";
import { getPageEn } from "@/lib/i18n/pages.en";
import { getPage } from "@/lib/commerce/placeholders";
import { translate } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/lang";
import { notFound } from "next/navigation";

export async function generateMetadata(props: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  const lang = await getLang();
  const contenido = (lang === "es" ? null : getPageEn(params.page)) ?? page;

  return {
    title: contenido.title,
    description: contenido.seo.description || contenido.bodySummary,
    openGraph: {
      publishedTime: page.createdAt,
      modifiedTime: page.updatedAt,
      type: "article",
    },
  };
}

export default async function Page(props: {
  params: Promise<{ page: string }>;
}) {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  const lang = await getLang();
  const contenido = (lang === "es" ? null : getPageEn(params.page)) ?? page;

  return (
    <article>
      <header className="mb-8 border-b border-ink-200 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-950 uppercase md:text-5xl">
          {contenido.title}
        </h1>
        {contenido.seo?.description || contenido.bodySummary ? (
          <p className="mt-3 text-base text-ink-500">
            {contenido.seo?.description || contenido.bodySummary}
          </p>
        ) : null}
      </header>

      <Prose className="mb-10" html={contenido.body} />

      <footer className="mt-10 flex flex-col gap-4 border-t border-ink-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-400">
          {translate(lang, "page.updated")}{" "}
          <time dateTime={page.updatedAt}>
            {new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(page.updatedAt))}
          </time>
        </p>
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-950 underline-offset-4 hover:text-brand-600 hover:underline"
        >
          <span aria-hidden="true">&larr;</span>
          {translate(lang, "page.backHome")}
        </Link>
      </footer>
    </article>
  );
}
