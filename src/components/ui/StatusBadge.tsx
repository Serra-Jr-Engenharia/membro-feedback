import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "info" | "neutral";

interface StatusBadgeProps {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}

const toneStyles: Record<StatusTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-accent-500/30 bg-accent-500/10 text-accent-500",
  info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400",
  neutral: "border-white/10 bg-white/5 text-brand-200",
};

const dotStyles: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-accent-500",
  info: "bg-cyan-400",
  neutral: "bg-brand-400",
};

export default function StatusBadge({
  tone = "neutral",
  children,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${toneStyles[tone]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[tone]}`} />
      {children}
    </span>
  );
}
