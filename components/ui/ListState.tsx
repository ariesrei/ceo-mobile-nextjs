import type { ReactNode } from "react";

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
      <SkelChip />
    </div>
  );
}

function SkeletonNews() {
  return (
    <div className="ceo-skel-news">
      <SkelThumb size="3.1rem" />
      <div className="ceo-skel-col">
        <SkelLine width="74%" />
        <SkelLine width="48%" />
      </div>
    </div>
  );
}

function SkeletonBlock({ height = 163 }: { height?: number }) {
  return (
    <article className="ceo-amenity__card ceo-skel-amenity">
      <div className="ceo-amenity__photo" style={{ height }}>
        <span className="ceo-skel ceo-skel-media" />
      </div>
      <div className="ceo-amenity__body">
        <div className="ceo-skel-col">
          <SkelLine width="58%" />
          <SkelLine width="36%" />
        </div>
        <SkelButton width="5.6rem" />
      </div>
    </article>
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

function SkeletonDetail({ fields = 4 }: { fields?: number }) {
  return (
    <div className="ceo-skel-detail">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="ceo-skel-field">
          <SkelLine width="28%" />
          <SkelLine width={index % 2 ? "62%" : "74%"} />
        </div>
      ))}
      <SkelButton width="100%" />
    </div>
  );
}

function SkelProfileField({
  label = "28%",
  value = "62%",
}: {
  label?: string;
  value?: string;
}) {
  return (
    <div className="ceo-profile-field">
      <small>
        <SkelLine width={label} />
      </small>
      <p>
        <SkelLine width={value} />
      </p>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="ceo-profile" role="status" aria-label="Loading">
      <div className="ceo-profile__hero">
        <div className="ceo-profile__avatar">
          <SkelAvatar size="6.4rem" />
        </div>
        <b>
          <SkelLine width="9.5rem" />
        </b>
        <em>
          <SkelLine width="6.2rem" />
        </em>
      </div>
      <div className="ceo-vendor-tab-head">
        <SkelLine width="4.2rem" />
        <SkelButton width="5.6rem" />
      </div>
      <section className="ceo-profile__card">
        <h2>
          <SkelLine width="9.2rem" />
        </h2>
        <SkelProfileField label="24%" value="18%" />
        <SkelProfileField label="28%" value="42%" />
        <SkelProfileField label="26%" value="36%" />
        <SkelProfileField label="18%" value="72%" />
        <SkelProfileField label="22%" value="48%" />
      </section>
      <section className="ceo-profile__card">
        <h2>
          <SkelLine width="5.4rem" />
        </h2>
        <SkelProfileField label="26%" value="44%" />
      </section>
      <section className="ceo-profile__card">
        <h2>
          <SkelLine width="7.2rem" />
        </h2>
        <SkelProfileField label="42%" value="16%" />
        <SkelProfileField label="38%" value="16%" />
      </section>
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
        <p className="text-sm font-semibold">
          <SkelLine width="8.5rem" />
        </p>
        <div className="ceo-warranty-stats">
          {["a", "b", "c"].map((id) => (
            <div key={id} className="ceo-warranty-stat">
              <span className="ceo-warranty-stat__n">
                <SkelLine width="2rem" className="ceo-skel-line--lg" />
              </span>
              <span className="ceo-warranty-stat__l">
                <SkelLine width="3.2rem" />
              </span>
            </div>
          ))}
        </div>
      </section>
      <SkelButton width="100%" className="ceo-skel-btn--lg" />
      <nav className="ceo-warranty-menu ceo-warranty-menu--home">
        {["52%", "64%", "70%", "58%"].map((width) => (
          <div key={width} className="ceo-warranty-menu__row ceo-warranty-menu__row--static">
            <SkelAvatar size="1.35rem" />
            <SkelLine width={width} />
          </div>
        ))}
      </nav>
    </div>
  );
}

export function ListSkeleton({
  rows = 3,
  height = 163,
  variant = "row",
}: {
  rows?: number;
  height?: number;
  variant?: "row" | "news" | "block" | "detail" | "pref";
}) {
  if (variant === "detail") {
    return (
      <div className="ceo-list-skel" role="status" aria-label="Loading">
        <SkeletonDetail fields={rows} />
      </div>
    );
  }

  return (
    <div
      className={`ceo-list-skel${
        variant === "news"
          ? " ceo-list-skel--news"
          : variant === "block"
            ? " ceo-list-skel--block"
            : ""
      }`}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: rows }, (_, index) => {
        if (variant === "block") return <SkeletonBlock key={index} height={height} />;
        if (variant === "pref") return <SkeletonPref key={index} />;
        if (variant === "news") return <SkeletonNews key={index} />;
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
  action,
}: {
  children: string;
  subtitle?: string;
  icon?: EmptyIcon;
  compact?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className={`ceo-empty${compact ? " ceo-empty--compact" : ""}`}>
      <span className="ceo-empty__icon" aria-hidden>
        <EmptyGlyph kind={icon} />
      </span>
      <p className="ceo-empty__title">{children}</p>
      {subtitle ? <p className="ceo-empty__copy">{subtitle}</p> : null}
      {action ? <div className="ceo-empty__action">{action}</div> : null}
    </div>
  );
}
