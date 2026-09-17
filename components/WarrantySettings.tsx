"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { WarrantyChoice, WarrantyOptions } from "@/lib/warranties";
import {
  DEFAULT_WARRANTY_SETTINGS,
  readWarrantySettings,
  writeWarrantySettings,
  type WarrantySettingsState,
} from "@/lib/warranty-settings";
import { MenuSelect } from "./ui/MenuSelect";
import {
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClipboardIcon,
  SettingsIcon,
  UserCheckIcon,
  UsersIcon,
} from "./ui/Icons";

export function WarrantySettings() {
  const [settings, setSettings] = useState<WarrantySettingsState>(
    DEFAULT_WARRANTY_SETTINGS
  );
  const [statuses, setStatuses] = useState<WarrantyChoice[]>([]);
  const [subcontractors, setSubcontractors] = useState<WarrantyChoice[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(readWarrantySettings());
    setReady(true);
    fetch("/api/wp/warranties/options?lite=1")
      .then((r) => r.json())
      .then((data: WarrantyOptions) => {
        setStatuses(data.statuses || []);
        setSubcontractors(data.subcontractors || []);
      })
      .catch(() => undefined);
  }, []);

  function update(patch: Partial<WarrantySettingsState>) {
    setSettings((prev) => writeWarrantySettings({ ...prev, ...patch }));
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="ceo-section-label">Notifications</p>
        <div className="ceo-warranty-menu ceo-warranty-menu--pills">
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
            icon={<CalendarIcon className="h-[18px] w-[18px]" />}
            checked={settings.dailySummary}
            disabled={!ready}
            onChange={(dailySummary) => update({ dailySummary })}
          />
        </div>
      </section>

      <section className="space-y-2">
        <p className="ceo-section-label">Preferences</p>
        <div className="ceo-warranty-menu ceo-warranty-menu--pills">
          <SelectRow
            label="Default Status"
            icon={<ClipboardIcon className="h-[18px] w-[18px]" />}
            value={settings.defaultStatus}
            placeholder={statuses[0]?.label || "New Warranty Approved"}
            options={statuses}
            onChange={(defaultStatus) => update({ defaultStatus })}
          />
          <SelectRow
            label="Default Assignee"
            icon={<UserCheckIcon className="h-[18px] w-[18px]" />}
            value={settings.defaultAssignee}
            placeholder="Unassigned"
            options={subcontractors}
            onChange={(defaultAssignee) => update({ defaultAssignee })}
          />
          <div className="ceo-warranty-menu__row ceo-warranty-menu__row--static">
            <span className="ceo-warranty-menu__icon">
              <SettingsIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="ceo-warranty-menu__label">Custom Fields</span>
            <span className="ceo-warranty-menu__meta">Desktop</span>
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
  icon,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  placeholder: string;
  options: WarrantyChoice[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="ceo-warranty-menu__row ceo-warranty-menu__row--static">
      <span className="ceo-warranty-menu__icon">{icon}</span>
      <span className="ceo-warranty-menu__label">{label}</span>
      <MenuSelect
        variant="inline"
        aria-label={label}
        className="ceo-inline-select"
        value={value}
        placeholder={placeholder}
        options={options}
        onChange={onChange}
      />
      <ChevronRightIcon className="ceo-warranty-menu__chev" />
    </label>
  );
}
