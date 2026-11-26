import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = (searchParams.get("file") || "").replace(/^\/+/, "").trim();
  const itemId = (searchParams.get("itemId") || "").trim();
  const utr = (searchParams.get("utr") || "").trim();

  if (!filePath || filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Verify approved payment order in Supabase if itemId & utr are supplied
  if (itemId) {
    if (!utr) {
      return NextResponse.json({ error: "Payment UTR required to unlock this PDF." }, { status: 403 });
    }
    const { data: order } = await supabase
      .from("upi_orders")
      .select("status")
      .eq("item_id", itemId)
      .eq("utr_number", utr)
      
      .limit(1)
      .maybeSingle();

    if (!order) {
      return NextResponse.json(
        { error: "Payment not yet approved by Super Admin." },
        { status: 403 }
      );
    }
  }

  const { data, error } = await supabase.storage
    .from("PAID AND PREMIUM STORAGE")
    .createSignedUrl(filePath, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || "File not found in premium-pdfs" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, { status: 302 });
}
