import { HeartIcon, UserIcon } from "@heroicons/react/24/outline";
import CartModal from "components/cart/modal";
import { LogoBadge, LogoWordmark } from "components/logo";
import { getNavCategorias } from "@/lib/navigation";
import Link from "next/link";
import { Suspense } from "react";
import AnnouncementBar from "./announcement-bar";
import CategoryNav from "./category-nav";
import MobileMenu from "./mobile-menu";
import MobileSearch from "./mobile-search";
import Search, { SearchSkeleton } from "./search";

export async function Navbar() {
  const categorias = await getNavCategorias();

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      <div className="relative border-b border-ink-200 bg-white">
        <div className="page-container flex h-16 items-center gap-2 lg:h-20 lg:gap-6">
          <Suspense fallback={null}>
            <MobileMenu categorias={categorias} />
          </Suspense>

          <Link
            href="/"
            prefetch={true}
            className="flex items-center gap-2.5 lg:mr-2"
            aria-label="SIE Merchandising, ir al inicio"
          >
            <LogoBadge size="lg" />
            <LogoWordmark className="hidden sm:flex" />
          </Link>

          <div className="hidden flex-1 lg:flex lg:justify-center">
            <div className="w-full max-w-xl">
              <Suspense fallback={<SearchSkeleton />}>
                <Search />
              </Suspense>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0 lg:gap-2">
            <MobileSearch />

            <Link
              href="/account"
              prefetch={true}
              aria-label="Mi cuenta"
              title="Mi cuenta"
              className="flex h-10 w-10 items-center justify-center rounded-md text-ink-800 transition hover:bg-ink-50 hover:text-brand-600"
            >
              <UserIcon className="h-5 w-5" aria-hidden="true" />
            </Link>

            <Link
              href="/wishlist"
              prefetch={true}
              aria-label="Lista de deseos"
              title="Lista de deseos"
              className="hidden h-10 w-10 items-center justify-center rounded-md text-ink-800 transition hover:bg-ink-50 hover:text-brand-600 sm:flex"
            >
              <HeartIcon className="h-5 w-5" aria-hidden="true" />
            </Link>

            <CartModal />
          </div>
        </div>
      </div>

      <CategoryNav categorias={categorias} />
    </header>
  );
}
