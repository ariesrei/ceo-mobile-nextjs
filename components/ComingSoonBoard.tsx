const ICONS = {
  messages: (
    <path d="M4 6.2h16A2 2 0 0 1 22 8.2v8.2A2 2 0 0 1 20 18.4H9.2L4 22V6.2Z" />
  ),
  pay: (
    <>
      <rect x="2.6" y="6" width="18.8" height="12.2" rx="2.4" />
      <path d="M2.6 10.2h18.8M7.2 15.2h4.6" />
    </>
  ),
} as const;

export function ComingSoonBoard({
  kind,
  title = "Under construction",
  copy,
}: {
  kind: "messages" | "pay";
  title?: string;
  copy: string;
}) {
  return (
    <div className="ceo-coming">
      <span className="ceo-coming__icon" data-kind={kind} aria-hidden>
        <svg viewBox="0 0 24 24">{ICONS[kind]}</svg>
      </span>
      <p className="ceo-coming__title">{title}</p>
      <p className="ceo-coming__copy">{copy}</p>
    </div>
  );
}
