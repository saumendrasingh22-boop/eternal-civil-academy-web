import { createClient, SupabaseClient } from "@supabase/supabase-js";

const TOKEN_KEY = "eca_supabase_access_token_v1";
let cachedSupabase: SupabaseClient | null = null;
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function getBrowserSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  if (!cachedSupabase) {
    cachedSupabase = createClient(url, anon);
  }
  return cachedSupabase;
}

export function saveAdminAccessToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

export function getAdminAccessToken(): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(TOKEN_KEY) || "";
}

export function clearAdminAccessToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
}

export function getAdminAuthHeaders(): Record<string, string> {
  const token = getAdminAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getFreshAdminAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let token = getAdminAccessToken();
  try {
    const sb = getBrowserSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data?.session?.access_token) {
        token = data.session.access_token;
        saveAdminAccessToken(token);
      }
    }
  } catch {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function syncCmsKeyNow(
  key: string,
  value: unknown
): Promise<{ ok: boolean; status: number; error?: string }> {
  if (typeof window === "undefined") return { ok: false, status: 0 };
  window.dispatchEvent(
    new CustomEvent("eca-cloud-sync-status", {
      detail: { state: "syncing", key, message: `Syncing ${key} to Cloud...` },
    })
  );
  try {
    const headers = await getFreshAdminAuthHeaders();
    const res = await fetch("/api/cms-state", {
      method: "POST",
      headers,
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) {
      window.dispatchEvent(
        new CustomEvent("eca-cloud-sync-status", {
          detail: {
            state: "ok",
            key,
            message: `Saved & Synced to Cloud (${key})`,
          },
        })
      );
      return { ok: true, status: res.status };
    }
    const errText =
      res.status === 401
        ? "Session expired (401) — Please Sign Out and Sign In again to save to Cloud."
        : `Cloud Sync Failed (HTTP ${res.status})`;
    window.dispatchEvent(
      new CustomEvent("eca-cloud-sync-status", {
        detail: { state: "error", key, status: res.status, message: errText },
      })
    );
    return { ok: false, status: res.status, error: errText };
  } catch (e: any) {
    const msg = e?.message || "Network error during Cloud Sync";
    window.dispatchEvent(
      new CustomEvent("eca-cloud-sync-status", {
        detail: { state: "error", key, status: 0, message: msg },
      })
    );
    return { ok: false, status: 0, error: msg };
  }
}

export function syncCmsKeyToCloud(key: string, value: unknown, delayMs = 350) {
  if (typeof window === "undefined") return;
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(() => {
    syncCmsKeyNow(key, value);
  }, delayMs);
}
