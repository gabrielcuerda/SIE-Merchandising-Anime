import { marks } from "@/components/logo-candidates";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "Opciones de logo",
  robots: { index: false, follow: false },
};

function Wordmark({ tone }: { tone: "dark" | "light" }) {
  return (
    <span className="flex items-center gap-2 leading-none">
      <span
        className={`font-display text-xl font-extrabold tracking-[-0.03em] ${
          tone === "light" ? "text-white" : "text-ink-950"
        }`}
      >
        {siteConfig.name}
      </span>
    </span>
  );
}

export default function LogoPreviewPage() {
  return (
    <main className="min-h-dvh bg-ink-50 py-10">
      <div className="page-container">
        <h1 className="font-display text-3xl font-extrabold text-ink-950">
          Opciones de logo
        </h1>
        <p className="mt-2 max-w-2xl text-ink-600">
          Cuatro direcciones distintas. Cada una se muestra en tamano grande, en
          tamano real de cabecera (48px), a 32px y a 16px, y sobre fondo claro y
          oscuro.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {marks.map(({ id, name, note, Mark, badge }) => (
            <section
              key={id}
              className="overflow-hidden rounded-2xl border border-ink-200 bg-white"
            >
              <div className="border-b border-ink-200 p-6">
                <h2 className="font-display text-xl font-extrabold text-ink-950">
                  {name}
                </h2>
                <p className="mt-1 text-sm text-ink-600">{note}</p>

                <div className="mt-5 flex items-end gap-6">
                  <span
                    className={`flex h-24 w-24 flex-none items-center justify-center bg-ink-950 text-brand-500 ${badge}`}
                  >
                    <Mark className="h-14 w-14" />
                  </span>
                  <div className="flex items-end gap-4">
                    <span
                      className={`flex h-12 w-12 flex-none items-center justify-center bg-ink-950 text-brand-500 ${badge}`}
                    >
                      <Mark className="h-7 w-7" />
                    </span>
                    <span
                      className={`flex h-8 w-8 flex-none items-center justify-center bg-ink-950 text-brand-500 ${badge}`}
                    >
                      <Mark className="h-5 w-5" />
                    </span>
                    <span
                      className={`flex h-4 w-4 flex-none items-center justify-center bg-ink-950 text-brand-500 ${badge}`}
                    >
                      <Mark className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex h-20 items-center border-b border-ink-200 px-6">
                <span
                  className={`flex h-12 w-12 flex-none items-center justify-center bg-ink-950 text-brand-500 ${badge}`}
                >
                  <Mark className="h-7 w-7" />
                </span>
                <span className="ml-2.5">
                  <Wordmark tone="dark" />
                </span>
              </div>

              <div className="flex h-20 items-center bg-ink-950 px-6">
                <span
                  className={`flex h-12 w-12 flex-none items-center justify-center bg-ink-900 text-brand-500 ring-1 ring-ink-800 ring-inset ${badge}`}
                >
                  <Mark className="h-7 w-7" />
                </span>
                <span className="ml-2.5">
                  <Wordmark tone="light" />
                </span>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
