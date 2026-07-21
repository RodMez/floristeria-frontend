import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: React.ElementType;
  className?: string;
};

export function AdminPageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
  className = "",
}: AdminPageHeaderProps) {
  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--admin-warning-soft)] border border-[var(--admin-border)]">
            <Icon className="h-5 w-5 text-[var(--admin-accent)]" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[var(--admin-foreground)] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[var(--admin-muted-foreground)] text-sm mt-1 font-heading italic">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
