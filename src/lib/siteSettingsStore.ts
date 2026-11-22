export interface SocialLinkItem {
  id: string;
  platform: string;
  handle: string;
  url: string;
  active: boolean;
}

export interface SiteContactAndSocialSettings {
  socials: SocialLinkItem[];
  contact: {
    email: string;
    mobile: string; mobileContacts?: { label: string; number: string }[];
    whatsapp: string;
  };
}

export const DEFAULT_SITE_SETTINGS: SiteContactAndSocialSettings = {
  socials: [
    {
      id: "soc-telegram",
      platform: "Telegram Channel",
      handle: "@EternalCivilAcademy",
      url: "https://t.me/EternalCivilAcademy",
      active: true,
    },
    {
      id: "soc-whatsapp",
      platform: "WhatsApp Channel",
      handle: "ETERNAL CIVIL ACADEMY Official",
      url: "https://whatsapp.com/channel/eternalcivilacademy",
      active: true,
    },
    {
      id: "soc-youtube",
      platform: "YouTube",
      handle: "ETERNAL CIVIL ACADEMY",
      url: "https://youtube.com/@EternalCivilAcademy",
      active: true,
    },
    {
      id: "soc-instagram",
      platform: "Instagram",
      handle: "@eternalcivilacademy",
      url: "https://instagram.com/eternalcivilacademy",
      active: true,
    },
    {
      id: "soc-facebook",
      platform: "Facebook Page",
      handle: "ETERNAL CIVIL ACADEMY",
      url: "https://facebook.com/EternalCivilAcademy",
      active: true,
    },
    {
      id: "soc-linkedin",
      platform: "LinkedIn",
      handle: "ETERNAL CIVIL ACADEMY",
      url: "https://linkedin.com/company/eternalcivilacademy",
      active: true,
    },
  ],
  contact: {
    email: "support@eternalcivilacademy.com",
    mobile: "+91 98765 43210",
    whatsapp: "+91 98765 43210", mobileContacts: [{ label: "Batch & Admission Enquiry", number: "+91 98765 43210" }, { label: "Test Series & Notes Support", number: "" }, { label: "Technical & Payment Help", number: "" }],
  },
};

const STORAGE_KEY = "eca_super_admin_site_settings_v2";

export function loadSiteSettings(): SiteContactAndSocialSettings {
  if (typeof window === "undefined") return DEFAULT_SITE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_SETTINGS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export function saveSiteSettings(settings: SiteContactAndSocialSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("eca-settings-updated"));
}
