import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className = "", id, ...props }: Props) {
  const inputId = id || props.name || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
      <input
        id={inputId}
        className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2 ${className}`}
        {...props}
      />
    </label>
  );
}
