import { getAdminAuthHeaders, syncCmsKeyToCloud } from "@/lib/adminTokenHelper";
export interface BatchItem {
  id: string;
  slug: string;
  title: string;
  examTag: string;
  batchType: string;
  startDate: string;
  duration: string;
  mode: string;
  medium: "Bilingual (English & Hindi)" | "English Medium" | "Hindi Medium";
  faculty: string;
  highlights: string[];
  description: string;
  coverImage: string;
  isPaid: boolean;
  priceInr: number;
  mrpInr: number;
  status: string;
  syllabusPdfUrl: string;
  telegramGroupUrl: string;
  uploadedBy: string;
  isLocked: boolean;
  createdAt: string;
}

export const DEFAULT_BATCHES: BatchItem[] = [];

const STORAGE_KEY = "eca_batches_store_v1";

export function loadBatches(): BatchItem[] {
  if (typeof window === "undefined") return DEFAULT_BATCHES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BATCHES;
    const parsed = JSON.parse(raw) as BatchItem[];
    return Array.isArray(parsed) ? parsed : DEFAULT_BATCHES;
  } catch {
    return DEFAULT_BATCHES;
  }
}

export function saveBatches(batches: BatchItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
  window.dispatchEvent(new Event("eca-batches-updated"));
  syncCmsKeyToCloud("batches", batches, 150);
}
