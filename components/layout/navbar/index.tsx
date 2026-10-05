import { HeartIcon, UserIcon } from "@heroicons/react/24/outline";
import CartModal from "components/cart/modal";
import { LogoBadge, LogoWordmark } from "@/components/logo";
import { getNavCategorias } from "@/lib/navigation";
import Link from "next/link";
import { Suspense } from "react";
import AnnouncementBar from "./announcement-bar";
import CategoryNav from "./category-nav";
import MobileMenu from "./mobile-menu";
import MobileSearch from "./mobile-search";
import Search, { SearchSkeleton } from "./search";
import LangToggle from "@/components/i18n/lang-toggle";
import { translate } from "@/lib/i18n/dict";
import { getLang } from "@/lib/i18n/lang";

export async function Navbar() {
  const categorias = await getNavCategorias();
  const lang = await getLang();

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      <div className="relative bg-white">
        <div className="page-container flex h-16 items-center gap-2 lg:h-20 lg:gap-3">
          <Suspense fallback={null}>
            <MobileMenu categorias={categorias} />
          </Suspense>

          <Link
            href="/"
            prefetch={true}
            className="flex items-center gap-2.5 lg:mr-1"
            aria-label={translate(lang, "nav.home")}
          >
            <LogoBadge size="lg" />
            <LogoWordmark className="hidden sm:flex" />
          </Link>

          <CategoryNav categorias={categorias} />

          <div className="ml-auto hidden min-w-0 flex-1 xl:flex xl:max-w-xl">
            <Suspense fallback={<SearchSkeleton />}>
              <Search />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0 lg:gap-2">
            <MobileSearch className="lg:border-0" />
            <LangToggle />

            <Link
              href="/account"
              prefetch={true}
              aria-label={translate(lang, "nav.account")}
              title={translate(lang, "nav.account")}
              className="flex h-10 w-10 items-center justify-center rounded-md text-ink-800 transition hover:bg-ink-50 hover:text-brand-600"
            >
              <UserIcon className="h-5 w-5" aria-hidden="true" />
            </Link>

            <Link
              href="/wishlist"
              prefetch={true}
              aria-label={translate(lang, "nav.wishlist")}
              title={translate(lang, "nav.wishlist")}
              className="hidden h-10 w-10 items-center justify-center rounded-md text-ink-800 transition hover:bg-ink-50 hover:text-brand-600 sm:flex"
            >
              <HeartIcon className="h-5 w-5" aria-hidden="true" />
            </Link>

            <CartModal />
          </div>
        </div>
      </div>
    </header>
  );
}
