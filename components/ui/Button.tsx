import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-[var(--accent)] text-[#081014] hover:bg-[var(--accent-hover)] shadow-sm"
      : variant === "danger"
        ? "bg-red-600 text-white hover:bg-red-700"
        : "bg-transparent text-[var(--ink)] hover:bg-[var(--surface-2)]";

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
