import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type AdminEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="py-16 text-center">
      {Icon && (
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-[var(--admin-warning-soft)] mb-4">
          <Icon className="h-7 w-7 text-[var(--admin-accent)]" />
        </div>
      )}
      <p className="font-heading italic text-base text-[var(--admin-foreground)]">
        {title}
      </p>
      {description && (
        <p className="text-sm text-[var(--admin-muted-foreground)] mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
