import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg)$/i;

export async function GET() {
  const repo =
    process.env.GITHUB_REPO || "saumendrasingh22-boop/eternal-civil-academy-web";
  const githubUploadUrl = `https://github.com/${repo}/releases`;
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "fjqzthuhuvbxulicessf";
  const supabaseUploadUrl = `https://supabase.com/dashboard/project/${projectRef}/storage/buckets`;

  const githubFiles: Array<{
    name: string;
    value: string;
    previewUrl: string;
    size: number;
    tag: string;
    isImage: boolean;
  }> = [];

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "ECA-Vault-Picker",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases?per_page=20`,
      { headers, cache: "no-store" }
    );
    if (res.ok) {
      const releases = await res.json();
      if (Array.isArray(releases)) {
        for (const rel of releases) {
          const assets = Array.isArray(rel?.assets) ? rel.assets : [];
          for (const a of assets) {
            const url = a.browser_download_url || "";
            if (!url) continue;
            githubFiles.push({
              name: a.name || "file",
              value: url,
              previewUrl: url,
              size: a.size || 0,
              tag: rel.tag_name || rel.name || "release",
              isImage: IMAGE_EXT.test(a.name || ""),
            });
          }
        }
      }
    }
  } catch {}

  const supabasePrivateFiles: Array<{
    name: string;
    value: string;
    size: number;
    bucket: string;
  }> = [];

  const supabasePublicFiles: Array<{
    name: string;
    value: string;
    previewUrl: string;
    size: number;
    bucket: string;
    isImage: boolean;
  }> = [];

  if (supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: privList } = await sb.storage
        .from("PAID AND PREMIUM STORAGE")
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (Array.isArray(privList)) {
        for (const f of privList) {
          if (!f.name || f.name.startsWith(".")) continue;
          supabasePrivateFiles.push({
            name: f.name,
            value: f.name,
            size: (f.metadata as any)?.size || 0,
            bucket: "PAID AND PREMIUM STORAGE",
          });
        }
      }

      const { data: pubList } = await sb.storage
        .from("public-covers")
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (Array.isArray(pubList)) {
        for (const f of pubList) {
          if (!f.name || f.name.startsWith(".")) continue;
          const pubUrl = `${supabaseUrl}/storage/v1/object/public/public-covers/${encodeURIComponent(f.name)}`;
          supabasePublicFiles.push({
            name: f.name,
            value: pubUrl,
            previewUrl: pubUrl,
            size: (f.metadata as any)?.size || 0,
            bucket: "public-covers",
            isImage: IMAGE_EXT.test(f.name),
          });
        }
      }
    } catch {}
  }

  return NextResponse.json({
    githubUploadUrl,
    supabaseUploadUrl,
    githubFiles,
    supabasePrivateFiles,
    supabasePublicFiles,
  });
}
