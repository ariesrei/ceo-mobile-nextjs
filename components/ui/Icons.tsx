/**
 * Inline field icons. The project has no icon package, so these follow the
 * hand-rolled SVG approach already used by DateField.
 */

type IconProps = { className?: string };

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17.6 17.6 0 0 1-3.3 3.9" />
      <path d="M6.7 6.9A17.4 17.4 0 0 0 2 12s3.6 6 10 6a9.7 9.7 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M20 12H4" />
      <path d="m10 6-6 6 6 6" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="m5 13 4.5 4.5L19 7" />
    </svg>
  );
}

export function ClipboardIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5H9V4Z" />
      <path d="M9 11h6M9 15h4" />
    </svg>
  );
}

export function UserCheckIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h4" />
      <path d="m15 17 2 2 4-4" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V7M17 20v-9" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3.2a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3.2a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4.9Z" />
    </svg>
  );
}

export function FolderOpenIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M3 8V6a1 1 0 0 1 1-1h5l2 2.5h8a1 1 0 0 1 1 1V10" />
      <path d="m3 8 2.2 10.2a1 1 0 0 0 1 .8h11.6a1 1 0 0 0 1-.8L21 10H5.2a1 1 0 0 0-1 .8" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.4 2.4 4.6-4.8" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20v-1.5A4.5 4.5 0 0 1 7 14h4a4.5 4.5 0 0 1 4.5 4.5V20" />
      <path d="M16.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.2a4.5 4.5 0 0 1 3.5 4.3V20" />
    </svg>
  );
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M4 21V6.5L11 3v18" />
      <path d="M11 10.5 20 7v14" />
      <path d="M7 9.5h1M7 13h1M7 16.5h1M14.5 12h1.5M14.5 15.5h1.5" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4Z" />
      <path d="M14 3v4h4" />
    </svg>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 17 4.8-4.4L13 16l2.6-2.2 3.9 3.4" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M20.5 3.5 10.5 13.5" />
      <path d="M20.5 3.5 14.2 20.5l-3.7-7-7-3.7 17-6.3Z" />
    </svg>
  );
}

export function ArchiveIcon({ className }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      <rect x="3.5" y="4" width="17" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}
