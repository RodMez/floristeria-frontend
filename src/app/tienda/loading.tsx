import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      <section className="container mx-auto px-4 py-16">
        <Skeleton className="h-6 w-48 mb-6 bg-[var(--color-brand-rose)]" />
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full max-w-xs rounded-lg border border-[var(--color-brand-rose)]/30 p-4 space-y-2 bg-white">
              <Skeleton className="h-4 w-3/4 bg-[var(--color-brand-rose)]" />
              <Skeleton className="h-3 w-1/2 bg-[var(--color-brand-rose)]" />
              <Skeleton className="h-3 w-2/5 bg-[var(--color-brand-rose)]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
