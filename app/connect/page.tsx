import { ConnectForm } from "@/components/ConnectForm";
import { COMPANY_MARK, COMPANY_TAGLINE, LANDING_BG } from "@/lib/brand";

export default function ConnectPage() {
  return (
    <main className="ceo-login-page">
      <div className="ceo-login">
        {/* Same single full-bleed photo layer as the login screen, so the two
            screens read as one background the user never leaves. */}
        <div
          className="ceo-login__hero"
          style={{ backgroundImage: `url(${LANDING_BG})` }}
          aria-hidden
        />

        {/* Company branding, not the app variant: no property has been chosen
            yet, so there is nothing property-specific to show. The login screen
            switches to the Operations/Warranty badge once it knows. */}
        <header className="ceo-login__brand">
          <div className="ceo-login__lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={COMPANY_MARK}
              alt=""
              className="ceo-login__company-mark"
            />
            <div>
              <p className="ceo-login__company-name">
                <span className="ceo-login__company-name-bold">CE</span>{" "}
                ONESOURCE
              </p>
              <p className="ceo-login__company-tagline">{COMPANY_TAGLINE}</p>
            </div>
          </div>
        </header>

        <div className="ceo-login__card">
          <ConnectForm />
        </div>
      </div>
    </main>
  );
}
