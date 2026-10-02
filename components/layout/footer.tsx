import FooterMenu from "components/layout/footer-menu";
import { ContactDetails, SocialLinks } from "components/layout/social-links";
import { siteConfig, getFooterColumns } from "@/lib/site";
import { translate } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/lang";

export default async function Footer() {
  const lang = await getLang();
  const year = new Date().getFullYear();
  const columnas = getFooterColumns(lang);

  return (
    <footer className="mt-16 bg-ink-950 text-ink-300">
      {/* Enlaces y datos de contacto */}
      <div className="page-container grid gap-10 py-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="max-w-sm text-sm text-ink-400">
            {translate(lang, "footer.claim")}
          </p>

          <ContactDetails className="mt-6" />

          <SocialLinks tone="light" className="mt-6" />
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
          {columnas.map((column) => (
            <nav key={column.i18nKey} aria-label={column.title}>
              <h2 className="text-xs font-extrabold tracking-[0.2em] text-white uppercase">
                {column.title}
              </h2>
              <FooterMenu links={column.links} className="mt-4" />
            </nav>
          ))}
        </div>
      </div>

      {/* Barra legal */}
      <div className="border-t border-ink-800">
        <div className="page-container py-5 text-xs">
          <p>
            © {year} {siteConfig.name}. {translate(lang, "footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
