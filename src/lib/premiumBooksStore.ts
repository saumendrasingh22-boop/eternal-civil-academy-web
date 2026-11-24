import { PREMIUM_BOOK_COVERS, BookCoverItem } from "@/lib/siteData";
import { getAdminAuthHeaders } from "@/lib/adminTokenHelper";

const BOOKS_KEY = "eca_premium_books_v2";
const CONTENT_KEY = "eca_custom_content_v1";

export interface CustomContentItem {
  id: string;
  section: string;
  title: string;
  priceInr: number;
  englishPdfUrl: string;
  hindiPdfUrl: string;
  createdAt: string;
}

export function loadPremiumBooks(): BookCoverItem[] {
  if (typeof window === "undefined") return PREMIUM_BOOK_COVERS;
  try {
    const raw = window.localStorage.getItem(BOOKS_KEY);
    if (!raw) return PREMIUM_BOOK_COVERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : PREMIUM_BOOK_COVERS;
  } catch {
    return PREMIUM_BOOK_COVERS;
  }
}

export async function savePremiumBooks(books: BookCoverItem[]) {
  if (typeof window === "undefined") return { ok: false, status: 0 };
  window.localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  window.dispatchEvent(new Event("eca-premium-books-updated"));
  try {
    const res = await fetch("/api/cms-state", {
      method: "POST",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ key: "premium_books", value: books }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: -1 };
  }
}

export function loadCustomContent(): CustomContentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONTENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCustomContent(items: CustomContentItem[]) {
  if (typeof window === "undefined") return { ok: false, status: 0 };
  window.localStorage.setItem(CONTENT_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("eca-custom-content-updated"));
  try {
    const res = await fetch("/api/cms-state", {
      method: "POST",
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ key: "custom_content", value: items }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: -1 };
  }
}
