const fs = require("fs");
fs.writeFileSync("src/lib/premiumBooksStore.ts", `import { PREMIUM_BOOK_COVERS, BookCoverItem } from "@/lib/siteData";
import { getAdminAuthHeaders } from "@/lib/adminTokenHelper";
const STORAGE_KEY = "eca_premium_books_v1";
export function loadPremiumBooks(): BookCoverItem[] {
  if (typeof window === "undefined") return PREMIUM_BOOK_COVERS;
  try { const raw = window.localStorage.getItem(STORAGE_KEY); if (!raw) return PREMIUM_BOOK_COVERS; const p = JSON.parse(raw) as BookCoverItem[]; return Array.isArray(p) && p.length > 0 ? p : PREMIUM_BOOK_COVERS; } catch { return PREMIUM_BOOK_COVERS; }
}
export function savePremiumBooks(books: BookCoverItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  window.dispatchEvent(new Event("eca-premium-books-updated"));
  fetch("/api/cms-state", { method: "POST", headers: getAdminAuthHeaders(), body: JSON.stringify({ key: "premium_books", value: books }) }).catch(() => {});
}
`, "utf8");

let rt = fs.readFileSync("src/app/api/cms-state/route.ts", "utf8");
if (!rt.includes("premium_books")) rt = rt.replace('"live_tests"', '"live_tests", "premium_books"');
fs.writeFileSync("src/app/api/cms-state/route.ts", rt, "utf8");

let hy = fs.readFileSync("src/components/CloudStateHydrator.tsx", "utf8");
if (!hy.includes("premium_books")) hy = hy.replace("];", '  { apiKey: "premium_books", storageKey: "eca_premium_books_v1", eventName: "eca-premium-books-updated" },\n];');
fs.writeFileSync("src/components/CloudStateHydrator.tsx", hy, "utf8");

let mat = fs.readFileSync("src/app/material/page.tsx", "utf8").replace(/\r\n/g, "\n");
if (!mat.includes("loadPremiumBooks")) {
  mat = mat
    .replace("import { PREMIUM_BOOK_COVERS,", "import { PREMIUM_BOOK_COVERS, BookCoverItem,")
    .replace('from "@/lib/siteData";', 'from "@/lib/siteData";\nimport { loadPremiumBooks } from "@/lib/premiumBooksStore";')
    .replace("const [refreshTick, setRefreshTick] = useState(0);", "const [refreshTick, setRefreshTick] = useState(0);\n  const [premiumBooks, setPremiumBooks] = useState<BookCoverItem[]>(PREMIUM_BOOK_COVERS);")
    .replace('window.addEventListener("eca-upi-orders-updated", reload);', 'setPremiumBooks(loadPremiumBooks());\n    const rb = () => setPremiumBooks(loadPremiumBooks());\n    window.addEventListener("eca-premium-books-updated", rb);\n    window.addEventListener("eca-upi-orders-updated", reload);')
    .replace('window.removeEventListener("eca-upi-orders-updated", reload);', 'window.removeEventListener("eca-premiumm-books-updated", rb);\n      window.removeEventListener("eca-upi-orders-updated", reload);')
    .replace("{PREMIUM_BOOK_COVERS.map((book) => {", "{premiumBooks.map((book) => {");
}
fs.writeFileSync("src/app/material/page.tsx", mat, "utf8");

let adm = fs.readFileSync("src/app/admin/page.tsx", "utf8").replace(/\r\n/g, "\n");
if (!adm.includes("loadPremiumBooks")) {
  adm = adm
    .replace("import { PREMIUM_BOOK_COVERS, STRUCTURED_CURRENT_AFFAIRS }", "import { PREMIUM_BOOK_COVERS, BookCoverItem, STRUCTURED_CURRENT_AFFAIRS }")
    .replace('import { loadBatches, saveBatches, DEFAULT_BATCHES, BatchItem } from "@/lib/batchesStore";', 'import { loadBatches, saveBatches, DEFAULT_BATCHES, BatchItem } from "@/lib/batchesStore";\nimport { loadPremiumBooks, savePremiumBooks } from "@/lib/premiumBooksStore";')
    .replace("const [batches, setBatches] = useState<BatchItem[]>(DEFAULT_BATCHES);", 'const [batches, setBatches] = useState<BatchItem[]>(DEFAULT_BATCHES);\n  const [premiumBooks, setPremiumBooks] = useState<BookCoverItem[]>(PREMIUM_BOOK_COVERS);\n  const [booksSyncMsg, setBooksSyncMsg] = useState("");')
    .replace("setBatches(loadBatches());", 'setBatches(loadBatches());\n    setPre