import type { Metadata, Viewport } from "next";
import "@fontsource/fraunces/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";
import { cookies } from "next/headers";
import { SplashScreen } from "@/components/SplashScreen";
import { appBrand } from "@/lib/brand";
import { COOKIE_BASE_URL } from "@/lib/wp";

const brand = appBrand();

export const metadata: Metadata = {
  title: brand.appName,
  description: `${brand.appName} — ${brand.tagline}`,
  applicationName: brand.appName,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: brand.logo,
    apple: brand.logo,
  },
  appleWebApp: {
    capable: true,
    title: brand.appName,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: brand.splashTo,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* Resolved here rather than inside the splash so the very first paint already
     shows the right branding. The cookie is set at connect time. */
  const jar = await cookies();
  const connected = Boolean(jar.get(COOKIE_BASE_URL)?.value?.trim());

  return (
    <html lang="en" data-app-variant={brand.variant}>
      <body className="antialiased">
        <SplashScreen connected={connected} />
        {children}
      </body>
    </html>
  );
}
