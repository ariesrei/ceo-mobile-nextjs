import { MenuSelect } from "./MenuSelect";

type Props = {
  label: string;
  name?: string;
  value?: string | number;
  onChange?: (e: { target: { name?: string; value: string } }) => void;
  options: Array<{ id: string | number; label: string }>;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
};

export function Select({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select…",
  className = "",
  id,
  disabled,
}: Props) {
  const inputId = id || name || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
      <MenuSelect
        id={inputId}
        variant="field"
        className={className}
        value={value == null ? "" : String(value)}
        disabled={disabled}
        placeholder={placeholder}
        options={options}
        onChange={(next) =>
          onChange?.({ target: { name, value: next } })
        }
      />
    </label>
  );
}
