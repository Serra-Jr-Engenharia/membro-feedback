import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant = "primary" | "secondary";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ActionButtonVariant, string> = {
  primary:
    "border-accent-600 bg-accent-500 text-white shadow-lg hover:bg-accent-600",
  secondary:
    "border-white/15 text-white hover:border-accent-500 hover:text-accent-500",
};

export default function ActionButton({
  variant = "primary",
  fullWidth = true,
  className = "",
  children,
  type = "button",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex ${fullWidth ? "w-full sm:w-auto" : "w-auto"} cursor-pointer items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:active:translate-y-0 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
