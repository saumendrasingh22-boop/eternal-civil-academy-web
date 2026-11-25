import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = [
  "github.com",
  "objects.githubusercontent.com",
  "raw.githubusercontent.com",
  "release-assets.githubusercontent.com",
  "drive.google.com",
  "eternalcivilacademy.com",
  "www.eternalcivilacademy.com",
];

function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_HOSTS.includes(h) || h.endsWith(".githubusercontent.com") || h.endsWith(".supabase.co");
}

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url") || "";
  if (!rawUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !isAllowedHost(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (ECA-PDF-Download)" },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Upstream fetch failed" }, { status: upstream.status });
    }

    const buf = await upstream.arrayBuffer();
    const rawName = decodeURIComponent(parsed.pathname.split("/").pop() || "ECA_Current_Affairs.pdf");
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_") || "ECA_Current_Affairs.pdf";
    const fileName = safeName.toLowerCase().endsWith(".pdf") ? safeName : safeName + ".pdf";

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 502 });
  }
}
