"use client";

import { useEffect } from "react";

const KEY_MAP: { apiKey: string; storageKey: string; eventName: string }[] = [
  { apiKey: "nocode_cms", storageKey: "eca_nocode_cms_state_v2", eventName: "eca-nocode-cms-updated" },
  { apiKey: "batches", storageKey: "eca_batches_store_v1", eventName: "eca-batches-updated" },
  { apiKey: "cover_slides", storageKey: "eca_cover_page_slides_v1", eventName: "eca-cover-slides-updated" },
  { apiKey: "live_tests", storageKey: "eca_live_mock_tests_v1", eventName: "eca-live-tests-updated" },
  { apiKey: "site_settings", storageKey: "eca_super_admin_site_settings_v2", eventName: "eca-settings-updated" },
];

export default function CloudStateHydrator() {
  useEffect(() => {
    let active = true;
    fetch("/api/cms-state?key=all", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.synced || !data?.values) return;
        for (const item of KEY_MAP) {
          const val = data.values[item.apiKey];
          if (val !== undefined && val !== null) {
            try {
              window.localStorage.setItem(item.storageKey, JSON.stringify(val));
              window.dispatchEvent(new Event(item.eventName));
            } catch {}
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return null;
}
