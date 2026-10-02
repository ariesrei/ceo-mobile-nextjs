const ICONS = {
  inbox: (
    <>
      <path d="M4.4 8.2h15.2A1.6 1.6 0 0 1 21.2 9.8v8.4A1.6 1.6 0 0 1 19.6 19.8H4.4A1.6 1.6 0 0 1 2.8 18.2V9.8A1.6 1.6 0 0 1 4.4 8.2Z" />
      <path d="M3.2 12.6h5.1l1.4 1.8h4.6l1.4-1.8h5.1" />
    </>
  ),
  folder: (
    <path d="M3.6 8.1A1.6 1.6 0 0 1 5.2 6.5h4.8l1.5 1.7h7.9A1.6 1.6 0 0 1 21 9.8v8.2a1.6 1.6 0 0 1-1.6 1.6H5.2A1.6 1.6 0 0 1 3.6 18V8.1Z" />
  ),
  file: (
    <>
      <path d="M7.2 3.8h6.8L19 8.8v11.2A1.6 1.6 0 0 1 17.4 21.6H7.2A1.6 1.6 0 0 1 5.6 20V5.4A1.6 1.6 0 0 1 7.2 3.8Z" />
      <path d="M13.8 3.8V9h5.2" />
    </>
  ),
  tag: (
    <path d="M4.4 10.2 10.1 4.5A1.6 1.6 0 0 1 11.2 4h6.6A1.6 1.6 0 0 1 19.4 5.6v6.6a1.6 1.6 0 0 1-.5 1.1l-5.7 5.7a1.6 1.6 0 0 1-2.3 0L4.4 12.5a1.6 1.6 0 0 1 0-2.3ZM15.2 8.4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
  ),
  calendar: (
    <>
      <rect x="4" y="5.4" width="16" height="14.2" rx="2" />
      <path d="M8 3.6V7M16 3.6V7M4 10.2h16" />
    </>
  ),
  chat: (
    <path d="M5 6.2h14A1.8 1.8 0 0 1 20.8 8v7.2A1.8 1.8 0 0 1 19 17H8.4L4.6 20v-3H5A1.8 1.8 0 0 1 3.2 15.2V8A1.8 1.8 0 0 1 5 6.2Z" />
  ),
  pass: (
    <>
      <rect x="3.5" y="6.2" width="17" height="11.6" rx="2" />
      <path d="M6.4 10.4h5.2M6.4 13.4h7.4" />
    </>
  ),
  horn: (
    <>
      <path d="M4.4 10h3.1L15.2 5.6v12.8L7.5 14H4.4A1.2 1.2 0 0 1 3.2 12.8v-1.6A1.2 1.2 0 0 1 4.4 10Z" />
      <path d="M16 9.2a3.6 3.6 0 0 1 0 5.6" />
      <path d="M18.2 7.4a6.4 6.4 0 0 1 0 9.2" />
      <path d="M7.2 14.1 6 18.8h2.3l1.2-4.2" />
    </>
  ),
  pet: (
    <path d="M7.2 9.2a2.1 2.1 0 1 1 2.1-2.1c0 .4-.1.7-.3 1L16.8 16a2.1 2.1 0 1 1-1 1.1L8 10.1c-.3.2-.6.3-1 .3Zm9.4-2.1a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 1 1 0-4.2ZM7.2 12.8a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 1 1 0-4.2Z" />
  ),
  vehicle: (
    <>
      <path d="M4.2 13.2 6 8.8A1.6 1.6 0 0 1 7.5 7.8h9a1.6 1.6 0 0 1 1.5 1l1.8 4.4H4.2Z" />
      <path d="M3.6 13.2h16.8v3.4A1.4 1.4 0 0 1 19 18H5a1.4 1.4 0 0 1-1.4-1.4v-3.4Z" />
      <circle cx="7.2" cy="16.6" r="1.1" />
      <circle cx="16.8" cy="16.6" r="1.1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="5.4" />
      <path d="M15.4 15.6 20 20.2" />
    </>
  ),
} as const;

export type EmptyIcon = keyof typeof ICONS;

function EmptyGlyph({ kind }: { kind: EmptyIcon }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {ICONS[kind]}
    </svg>
  );
}

/** Trailing glyph on rows you can open. Pets use a bone; events a calendar. */
export function ListGo({ icon }: { icon: EmptyIcon }) {
  return (
    <i className="ceo-list-go" aria-hidden>
      <EmptyGlyph kind={icon} />
    </i>
  );
}

export function SkelLine({
  width = "70%",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <span
      className={`ceo-skel ceo-skel-line${className ? ` ${className}` : ""}`}
      style={{ width }}
    />
  );
}

export function SkelAvatar({
  size = "2.5rem",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <span
      className={`ceo-skel ceo-skel-avatar${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkelThumb({
  size = "3.2rem",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <span
      className={`ceo-skel ceo-skel-thumb${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SkelButton({
  width = "6.5rem",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <span
      className={`ceo-skel ceo-skel-btn${className ? ` ${className}` : ""}`}
      style={{ width }}
    />
  );
}

export function SkelChip({
  width = "3.4rem",
  className = "",
}: {
  width?: string;
  className?: string;
}) {
  return (
    <span
      className={`ceo-skel ceo-skel-chip${className ? ` ${className}` : ""}`}
      style={{ width }}
    />
  );
}

function SkeletonRow() {
  return (
    <div className="ceo-skel-card">
      <SkelThumb />
      <div className="ceo-skel-col">
        <SkelLine width="68%" />
        <SkelLine width="42%" />
      </div>
      <div className="ceo-skel-aside">
        <SkelChip />
        <SkelAvatar size="1.35rem" />
      </div>
    </div>
  );
}

function SkeletonPref() {
  return (
    <div className="ceo-skel-pref">
      <SkelLine width="46%" />
      <span className="ceo-skel ceo-skel-toggle" />
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="ceo-skel-detail">
      <SkelLine width="52%" />
      <SkelLine width="78%" />
      <SkelLine width="64%" />
      <SkelLine width="36%" />
      <SkelButton width="100%" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="ceo-skel-profile" role="status" aria-label="Loading">
      <SkelAvatar size="6.4rem" />
      <SkelLine width="9.5rem" />
      <SkelLine width="6.2rem" />
      <div className="ceo-skel-profile__bar">
        <SkelLine width="4rem" />
        <SkelButton width="5.4rem" />
      </div>
      <div className="ceo-skel-detail">
        <SkelLine width="34%" />
        <SkelLine width="72%" />
        <SkelLine width="30%" />
        <SkelLine width="58%" />
        <SkelLine width="28%" />
        <SkelLine width="64%" />
      </div>
    </div>
  );
}

export function WarrantyHomeSkeleton() {
  return (
    <div
      className="ceo-warranty-home-skel"
      role="status"
      aria-label="Loading warranty home"
    >
      <section className="ceo-warranty-overview">
        <SkelLine width="8.5rem" />
        <div className="ceo-warranty-stats">
          {["a", "b", "c"].map((id) => (
            <div key={id} className="ceo-warranty-stat">
              <SkelLine width="2.1rem" className="ceo-skel-line--lg" />
              <SkelLine width="3.2rem" />
            </div>
          ))}
        </div>
      </section>
      <SkelButton width="100%" className="ceo-skel-btn--lg" />
      <nav className="ceo-warranty-menu ceo-warranty-menu--home">
        {["a", "b", "c", "d"].map((id) => (
          <div key={id} className="ceo-warranty-menu__row ceo-warranty-menu__row--static">
            <SkelAvatar size="1.35rem" />
            <SkelLine width="58%" />
          </div>
        ))}
      </nav>
    </div>
  );
}

export function ListSkeleton({
  rows = 3,
  height = 72,
  variant = "row",
}: {
  rows?: number;
  height?: number;
  variant?: "row" | "block" | "detail" | "pref";
}) {
  return (
    <div className="ceo-list-skel" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => {
        if (variant === "block") {
          return (
            <div key={index} className="ceo-skel rounded-2xl" style={{ height }} />
          );
        }
        if (variant === "detail") return <SkeletonDetail key={index} />;
        if (variant === "pref") return <SkeletonPref key={index} />;
        return <SkeletonRow key={index} />;
      })}
    </div>
  );
}

export function LoadingDots({ label = "Loading more" }: { label?: string }) {
  return (
    <div className="ceo-dots" role="status" aria-label={label}>
      <span />
      <span />
      <span />
    </div>
  );
}

export function EmptyState({
  children,
  subtitle,
  icon = "inbox",
  compact = false,
}: {
  children: string;
  subtitle?: string;
  icon?: EmptyIcon;
  compact?: boolean;
}) {
  return (
    <div className={`ceo-empty${compact ? " ceo-empty--compact" : ""}`}>
      <span className="ceo-empty__icon" aria-hidden>
        <EmptyGlyph kind={icon} />
      </span>
      <p className="ceo-empty__title">{children}</p>
      {subtitle ? <p className="ceo-empty__copy">{subtitle}</p> : null}
    </div>
  );
}
