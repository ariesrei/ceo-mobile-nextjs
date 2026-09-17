import { ConnectForm } from "@/components/ConnectForm";
import { appBrand, LANDING_BG } from "@/lib/brand";

const brand = appBrand();

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

        <header className="ceo-login__brand">
          <div className="ceo-login__lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logo} alt="" className="ceo-login__badge-mark" />
            <div className="ceo-login__lockup-text">
              <p className="ceo-login__company-name">
                <span className="ceo-login__company-name-bold">CE</span>{" "}
                ONESOURCE
              </p>
              <p className="ceo-login__company-variant">{brand.wordmark}</p>
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
