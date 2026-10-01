import { SparklesIcon, TruckIcon } from "@heroicons/react/24/outline";
import { shippingHighlights } from "@/lib/site";

export default function AnnouncementBar() {
  return (
    <div className="bg-ink-950 text-white">
      <div className="page-container flex h-9 items-center justify-center gap-8 overflow-x-auto text-[11px] font-bold uppercase tracking-[0.14em] no-scrollbar">
        {shippingHighlights.slice(0, 3).map((item) => (
          <span
            key={item.title}
            className="flex flex-none items-center gap-1.5 whitespace-nowrap"
          >
            <TruckIcon
              className="h-3.5 w-3.5 text-brand-400"
              aria-hidden="true"
            />
            <span className="text-brand-400">{item.title}</span>
            <span className="font-medium normal-case tracking-normal text-ink-300">
              {item.text}
            </span>
          </span>
        ))}
        <span className="hidden flex-none items-center gap-1.5 whitespace-nowrap xl:flex">
          <SparklesIcon
            className="h-3.5 w-3.5 text-brand-400"
            aria-hidden="true"
          />
          <span className="text-brand-400">Importación directa</span>
          <span className="font-medium normal-case tracking-normal text-ink-300">
            desde Japón
          </span>
        </span>
      </div>
    </div>
  );
}
