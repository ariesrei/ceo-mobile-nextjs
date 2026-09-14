"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { WarrantyChoice, WarrantyOptions } from "@/lib/warranties";
import {
  BellIcon,
  ChartIcon,
  ChevronRightIcon,
  UsersIcon,
} from "./ui/Icons";

const STORE_KEY = "ceo_warranty_settings_v1";

type Settings = {
  claimUpdates: boolean;
  subcontractorUpdates: boolean;
  dailySummary: boolean;
  defaultStatus: string;
  defaultAssignee: string;
};

const DEFAULTS: Settings = {
  claimUpdates: true,
  subcontractorUpdates: true,
  dailySummary: false,
  defaultStatus: "",
  defaultAssignee: "",
};

function read(): Settings {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

export function WarrantySettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [statuses, setStatuses] = useState<WarrantyChoice[]>([]);
  const [subcontractors, setSubcontractors] = useState<WarrantyChoice[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(read());
    setReady(true);
    fetch("/api/wp/warranties/options?lite=1")
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        setStatuses(data.statuses || []);
        setSubcontractors(data.subcontractors || []);
      })
      .catch(() => undefined);
  }, []);

  function update(patch: Partial<Settings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="ceo-section-label">Notifications</p>
        <div className="ceo-warranty-menu">
          <ToggleRow
            label="Claim Updates"
            icon={<BellIcon className="h-[18px] w-[18px]" />}
            checked={settings.claimUpdates}
            disabled={!ready}
            onChange={(claimUpdates) => update({ claimUpdates })}
          />
          <ToggleRow
            label="Subcontractor Updates"
            icon={<UsersIcon className="h-[18px] w-[18px]" />}
            checked={settings.subcontractorUpdates}
            disabled={!ready}
            onChange={(subcontractorUpdates) =>
              update({ subcontractorUpdates })
            }
          />
          <ToggleRow
            label="Daily Summary"
            icon={<ChartIcon className="h-[18px] w-[18px]" />}
            checked={settings.dailySummary}
            disabled={!ready}
            onChange={(dailySummary) => update({ dailySummary })}
          />
        </div>
      </section>

      <section className="space-y-2">
        <p className="ceo-section-label">Preferences</p>
        <div className="ceo-warranty-menu">
          <SelectRow
            label="Default Status"
            value={settings.defaultStatus}
            placeholder={statuses[0]?.label || "New Warranty Approved"}
            options={statuses}
            onChange={(defaultStatus) => update({ defaultStatus })}
          />
          <SelectRow
            label="Default Assignee"
            value={settings.defaultAssignee}
            placeholder="Unassigned"
            options={subcontractors}
            onChange={(defaultAssignee) => update({ defaultAssignee })}
          />
          <div className="ceo-warranty-menu__row ceo-warranty-menu__row--static">
            <span className="ceo-warranty-menu__label">Custom Fields</span>
            <ChevronRightIcon className="ceo-warranty-menu__chev" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  icon,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="ceo-warranty-menu__row ceo-warranty-menu__row--static">
      <span className="ceo-warranty-menu__icon">{icon}</span>
      <span className="ceo-warranty-menu__label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={`ceo-toggle${checked ? " is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

function SelectRow({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: WarrantyChoice[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="ceo-warranty-menu__row ceo-warranty-menu__row--static">
      <span className="ceo-warranty-menu__label">{label}</span>
      <select
        className="ceo-inline-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={String(o.id)} value={String(o.id)}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronRightIcon className="ceo-warranty-menu__chev" />
    </label>
  );
}
