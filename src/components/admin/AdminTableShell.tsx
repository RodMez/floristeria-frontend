import type { ReactNode } from "react";

type AdminTableShellProps = {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function AdminTableShell({
  toolbar,
  children,
  className = "",
}: AdminTableShellProps) {
  return (
    <div
      className={`rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-sm overflow-hidden ${className}`}
    >
      {toolbar && (
        <div className="p-4 border-b border-[var(--admin-border)] bg-[var(--admin-canvas)]/40">
          {toolbar}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
