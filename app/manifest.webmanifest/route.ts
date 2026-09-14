import { appBrand } from "@/lib/brand";

export const dynamic = "force-static";

export function GET() {
  const brand = appBrand();
  return Response.json(
    {
      name: brand.appName,
      short_name:
        brand.variant === "operations" ? "CE1 Operations" : "CE1 Warranty",
      description: `${brand.appName} — ${brand.tagline}`,
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: brand.splashTo,
      theme_color: brand.splashTo,
      icons: [
        { src: brand.logo, sizes: "512x512", type: "image/png" },
        {
          src: brand.logo,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } }
  );
}
