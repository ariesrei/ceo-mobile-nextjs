import type { Metadata, Viewport } from "next";
import "@fontsource/fraunces/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import { getBuildAppProfile, productName } from "@/lib/app-profile";
import "./globals.css";
import { SplashGate } from "@/components/SplashGate";
import { WpDirectFetch } from "@/components/WpDirectFetch";
import { appBrand } from "@/lib/brand";

const brand = appBrand();

const buildProfile = getBuildAppProfile();
const product = productName(buildProfile);

export const metadata: Metadata = {
  title: product,
  description:
    buildProfile === "operations"
      ? "Operations mobile app for CE OneSource (headless WordPress)"
      : "ClaimTrack warranty app for CE OneSource properties",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: brand.splashTo,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-app-variant={brand.variant} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <WpDirectFetch />
        <SplashGate />
        {children}
      </body>
    </html>
  );
}
