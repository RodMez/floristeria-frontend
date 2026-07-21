import type { LucideIcon } from "lucide-react";

export type AdminStatusVariant =
  | "warning"
  | "info"
  | "success"
  | "danger"
  | "muted";

type StatusBadgeProps = {
  variant: AdminStatusVariant;
  label: string;
  icon?: LucideIcon;
  pulse?: boolean;
  className?: string;
};

const VARIANT_STYLES: Record<
  AdminStatusVariant,
  { container: string; dot: string }
> = {
  warning: {
    container:
      "bg-[var(--admin-warning-soft)] text-[var(--admin-warning-foreground)] border-[var(--admin-warning)]/30",
    dot: "bg-[var(--admin-warning)]",
  },
  info: {
    container:
      "bg-[var(--admin-info-soft)] text-[var(--admin-info-foreground)] border-[var(--admin-info)]/30",
    dot: "bg-[var(--admin-info)]",
  },
  success: {
    container:
      "bg-[var(--admin-success-soft)] text-[var(--admin-success-foreground)] border-[var(--admin-success)]/30",
    dot: "bg-[var(--admin-success)]",
  },
  danger: {
    container:
      "bg-[var(--admin-danger-soft)] text-[var(--admin-danger-foreground)] border-[var(--admin-danger)]/30",
    dot: "bg-[var(--admin-danger)]",
  },
  muted: {
    container:
      "bg-[var(--admin-canvas)] text-[var(--admin-muted-foreground)] border-[var(--admin-border)]",
    dot: "bg-[var(--admin-muted-foreground)]",
  },
};

export function StatusBadge({
  variant,
  label,
  icon: Icon,
  pulse = false,
  className = "",
}: StatusBadgeProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-heading tracking-wide ${styles.container} ${className}`}
    >
      {Icon ? (
        <Icon className="h-3 w-3" />
      ) : (
        <span
          className={`size-1.5 rounded-full ${styles.dot} ${
            pulse ? "animate-pulse" : ""
          }`}
        />
      )}
      {label}
    </span>
  );
}
