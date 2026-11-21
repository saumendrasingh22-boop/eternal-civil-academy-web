import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { PREMIUM_BOOK_COVERS } from "@/lib/siteData";
import { DEFAULT_BATCHES } from "@/lib/batchesStore";

const ALLOWED_ITEM_TYPES = new Set([
  "premium_notes",
  "test_series",
  "answer_evaluation",
  "batch",
]);

function resolveServerMinimumPrice(itemId: string, itemType: string, clientPrice: number): number | null {
  if (!Number.isFinite(clientPrice) || clientPrice <= 0) return null;
  // Server-side catalog floor validation (allows up to 90% valid coupon discount, blocks ₹0/tampered prices)
  if (itemType === "premium_notes") {
    const book = PREMIUM_BOOK_COVERS.find((b) => b.id === itemId);
    if (book && book.isPaid && clientPrice < Math.floor(book.priceInr * 0.1)) return null;
  }
  if (itemType === "batch") {
    const batch = DEFAULT_BATCHES.find((b) => b.id === itemId);
    if (batch && batch.isPaid && clientPrice < Math.floor(batch.priceInr * 0.1)) return null;
  }
  return Math.round(clientPrice * 100) / 100;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode } = body;

    // Mode 1: Razorpay Automatic Cryptographic Signature Verification
    if (mode === "razorpay") {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 400 });
      }
      const expected = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expected !== razorpay_signature) {
        return NextResponse.json({ verified: false, error: "Invalid payment signature" }, { status: 400 });
      }
      return NextResponse.json({ verified: true, status: "Approved" });
    }

    // Mode 2: Direct UPI QR Order Submission (Hardened Validation + Duplicate UTR Rejection)
    const { itemId, itemType, itemTitle, priceInr, studentName, studentContact, utrNumber } = body;
    const cleanUtr = String(utrNumber || "").trim();
    const cleanName = String(studentName || "").trim();
    const cleanContact = String(studentContact || "").trim();

    if (!cleanName || !cleanContact) {
      return NextResponse.json({ error: "Student name and contact are required." }, { status: 400 });
    }
    if (!ALLOWED_ITEM_TYPES.has(String(itemType))) {
      return NextResponse.json({ error: "Invalid item type." }, { status: 400 });
    }
    if (!/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json(
        { error: "Valid 12-digit numeric UPI UTR number is required." },
        { status: 400 }
      );
    }

    const validatedPrice = resolveServerMinimumPrice(String(itemId || ""), String(itemType), Number(priceInr));
    if (validatedPrice === null) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Strict Duplicate UTR Check (never overwrite an existing UTR record)
      const { data: existing } = await supabase
        .from("upi_orders")
        .select("id")
        .eq("utr_number", cleanUtr)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "This 12-digit UTR number has already been submitted. Duplicate UTR is not allowed." },
          { status: 409 }
        );
      }

      const { error: insertErr } = await supabase.from("upi_orders").insert([
        {
          student_name: cleanName,
          student_contact: cleanContact,
          item_type: String(itemType),
          item_id: String(itemId || ""),
          amount_inr: validatedPrice,
          utr_number: cleanUtr,
          is_approved: false,
        },
      ]);

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      status: "Pending Verification",
      message: "UPI UTR recorded safely. Access unlocks permanently once verified by Super Admin.",
      itemId,
      itemTitle,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
