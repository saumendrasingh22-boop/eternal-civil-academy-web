import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { STRUCTURED_CURRENT_AFFAIRS, STATES_LIST } from "@/lib/siteData";
import { DEFAULT_BATCHES } from "@/lib/batchesStore";
import { STUDENT_HUB_TOOLS } from "@/lib/studentHubCatalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.eternalcivilacademy.com").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/batches",
    "/student-hub",
    "/current-affairs",
    "/test-series",
    "/material",
    "/pyq",
    "/state-special",
    "/monthly-magazine",
    "/schemes",
    "/toppers-copy",
    "/answer-evaluation",
    "/syllabus",
    "/notifications",
    "/join-us",
    "/contact-us",
    "/legal/privacy-policy",
    "/legal/terms",
    "/legal/refund-policy",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/current-affairs" || route === "/test-series" ? "hourly" : "daily",
    priority: ["", "/current-affairs", "/test-series", "/state-special", "/material", "/syllabus"].includes(route) ? 1.0 : 0.7,
  }));

  const caSlugs = new Set<string>(STRUCTURED_CURRENT_AFFAIRS.map((a) => a.slug));
  const batchSlugs = new Set<string>(DEFAULT_BATCHES.map((b) => b.slug));
  const customPageSlugs = new Set<string>(["about-us"]);

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const [{ data: caRows }, { data: batchRows }, { data: cmsRow }] = await Promise.all([
        supabase.from("current_affairs").select("slug").order("created_at", { ascending: false }).limit(200),
        supabase.from("batches").select("slug").order("created_at", { ascending: false }).limit(50),
        supabase.from("site_cms_state").select("state_value").eq("state_key", "nocode_cms").single(),
      ]);
      if (Array.isArray(cmsRow?.state_value?.customPages)) {
        cmsRow.state_value.customPages.forEach((p: { slug?: string; active?: boolean }) => {
          if (p.slug && p.active !== false) customPageSlugs.add(p.slug);
        });
      }
      caRows?.forEach((r: { slug?: string }) => {
        if (r.slug) caSlugs.add(r.slug);
      });
      batchRows?.forEach((r: { slug?: string }) => {
        if (r.slug) batchSlugs.add(r.slug);
      });
    } catch {}
  }

  const caEntries: MetadataRoute.Sitemap = Array.from(caSlugs).map((slug) => ({
    url: `${siteUrl}/current-affairs/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  const batchEntries: MetadataRoute.Sitemap = Array.from(batchSlugs).map((slug) => ({
    url: `${siteUrl}/batches/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const toolEntries: MetadataRoute.Sitemap = STUDENT_HUB_TOOLS.map((t) => ({
    url: `${siteUrl}/student-hub/${t.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const stateEntries: MetadataRoute.Sitemap = STATES_LIST.map((st) => ({
    url: `${siteUrl}/state-special/${st.toLowerCase().replace(/\s+/g, "-")}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));
  const customPageEntries: MetadataRoute.Sitemap = Array.from(customPageSlugs).map((slug) => ({
    url: `${siteUrl}/p/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));
  return [...staticRoutes, ...stateEntries, ...toolEntries, ...customPageEntries, ...caEntries, ...batchEntries];
}
