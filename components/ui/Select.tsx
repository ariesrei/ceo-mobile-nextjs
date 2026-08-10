import { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Array<{ id: string | number; label: string }>;
  placeholder?: string;
};

export function Select({
  label,
  options,
  placeholder = "Select…",
  className = "",
  id,
  ...props
}: Props) {
  const inputId = id || props.name || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
      <select
        id={inputId}
        className={`w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] focus:ring-2 ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={String(opt.id)} value={String(opt.id)}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
