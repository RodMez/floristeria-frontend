import type { ReactNode } from "react";
import { List } from "lucide-react";

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-semibold text-stone-800 md:text-2xl">
        <span
          aria-hidden="true"
          className="h-6 w-1.5 shrink-0 rounded-full bg-brand-mustard"
        />
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function LegalToc({
  items,
}: {
  items: { id: string; label: string }[];
}) {
  return (
    <div className="mb-8 rounded-xl border-2 border-brand-rose bg-white/70 p-6">
      <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold uppercase tracking-wider text-stone-500">
        <List className="size-4 text-brand-mustard" />
        Contenido
      </h2>
      <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-baseline gap-2 text-sm">
            <span className="shrink-0 font-semibold text-brand-rose-dark">
              {index + 1}.
            </span>
            <a
              href={`#${item.id}`}
              className="text-stone-600 transition-colors hover:text-brand-mustard-dark"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
