import { FieldLabel } from "./FieldLabel";
import { MenuSelect } from "./MenuSelect";
import { Typeahead } from "./Typeahead";

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
  searchable?: boolean;
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
  required,
  searchable,
}: Props) {
  const inputId = id || name || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="block space-y-1.5">
      <FieldLabel label={label} required={required} />
      {searchable ? (
        <Typeahead
          id={inputId}
          aria-label={label}
          value={value == null ? "" : String(value)}
          disabled={disabled}
          placeholder={placeholder}
          options={options}
          onChange={(next) =>
            onChange?.({ target: { name, value: next } })
          }
        />
      ) : (
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
      )}
    </div>
  );
}
