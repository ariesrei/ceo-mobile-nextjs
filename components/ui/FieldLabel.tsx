export function FieldLabel({
  label,
  required,
  id,
}: {
  label: string;
  required?: boolean;
  id?: string;
}) {
  return (
    <span className="text-sm font-medium text-[var(--muted)]" id={id}>
      {label}
      {required ? (
        <span className="font-bold text-[var(--danger)]" aria-hidden>
          {" "}
          *
        </span>
      ) : null}
    </span>
  );
}
