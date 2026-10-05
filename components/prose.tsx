import clsx from "clsx";

const Prose = ({ html, className }: { html: string; className?: string }) => {
  return (
    <div
      className={clsx(
        "prose max-w-none text-base leading-7 text-ink-800",
        // Títulos con la escala del tema, no los tamaños por defecto de prose
        "prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-ink-950",
        "prose-h2:mt-10 prose-h2:border-b prose-h2:border-ink-200 prose-h2:pb-2 prose-h2:text-2xl",
        "prose-h3:mt-6 prose-h3:text-xl",
        "prose-h4:mt-5 prose-h4:text-lg",
        "prose-p:my-4",
        "prose-a:font-semibold prose-a:text-brand-600 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-brand-700",
        "prose-strong:font-bold prose-strong:text-ink-950",
        "prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6",
        "prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6",
        "prose-li:my-1.5",
        "prose-li::marker:text-brand-500",
        // Tablas con bordes visibles, las usan envíos / privacidad / cookies
        "prose-table:my-6 prose-table:text-sm",
        "prose-thead:border-b prose-thead:border-ink-300",
        "prose-th:text-left prose-th:font-extrabold prose-th:text-ink-950",
        "prose-td:border-b prose-td:border-ink-100",
        "prose-blockquote:border-l-brand-500 prose-blockquote:text-ink-600",
        "prose-hr:border-ink-200",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Prose;
