import Collections from "@/components/layout/search/collections";
import FilterList from "@/components/layout/search/filter";
import { estados, precios, sorting } from "@/lib/constants";
import ChildrenWrapper from "./children-wrapper";
import { Suspense } from "react";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-container flex flex-col gap-8 pb-4 md:flex-row">
      <div className="order-first w-full flex-none md:max-w-[220px]">
        <Collections />
      </div>
      <div className="order-last min-h-screen w-full md:order-none">
        <Suspense fallback={null}>
          <ChildrenWrapper>{children}</ChildrenWrapper>
        </Suspense>
      </div>
      <div className="order-none flex-none md:order-last md:w-[220px]">
        <FilterList list={sorting} title="Ordenar" />
        <FilterList list={estados} title="Estado" />
        <FilterList list={precios} title="Precio" />
      </div>
    </div>
  );
}
