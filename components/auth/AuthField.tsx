import type { InputHTMLAttributes, ReactNode } from "react";
import { EyeIcon, EyeOffIcon } from "../ui/Icons";

type Props = {
  icon: ReactNode;
  secret?: boolean;
  revealed?: boolean;
  onRevealChange?: (next: boolean) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export function AuthField({
  icon,
  secret,
  revealed,
  onRevealChange,
  ...input
}: Props) {
  return (
    <div className="ceo-field">
      {icon}
      <input
        {...input}
        className={
          secret
            ? "ceo-field__input ceo-field__input--password"
            : "ceo-field__input"
        }
        type={secret ? (revealed ? "text" : "password") : input.type}
      />
      {secret ? (
        <button
          type="button"
          className="ceo-field__eye"
          onClick={() => onRevealChange?.(!revealed)}
          aria-label={revealed ? "Hide secret" : "Show secret"}
          aria-pressed={Boolean(revealed)}
        >
          {revealed ? (
            <EyeOffIcon className="ceo-field__eye-svg" />
          ) : (
            <EyeIcon className="ceo-field__eye-svg" />
          )}
        </button>
      ) : null}
    </div>
  );
}
