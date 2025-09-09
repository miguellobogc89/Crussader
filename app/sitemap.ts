import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.configpanel.com";
  return [
    { url: `${base}/`, priority: 1.0 },
    { url: `${base}/legal/terms`, priority: 0.4 },
    { url: `${base}/legal/privacy`, priority: 0.6 },
    { url: `${base}/legal/support`, priority: 0.4 },
  ];
}
