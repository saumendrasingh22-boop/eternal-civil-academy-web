const fs = require("fs");
function patch(p, fn) {
  if (!fs.existsSync(p)) return;
  const old = fs.readFileSync(p, "utf8");
  const next = fn(old);
  if (next !== old) { fs.writeFileSync(p, next, "utf8"); console.log("Patched:", p); }
}
patch("src/app/api/current-affairs/route.ts", s => {
  if (!s.includes("force-dynamic")) s = s.replace("export async function GET", "export const dynamic = \"force-dynamic\";\n\nexport async function GET");
  if (!s.includes("published_date\", { ascending: false }")) s = s.replace(".order(\"created_at\", { ascending: false })", ".order(\"published_date\", { ascending: false })\n        .order(\"created_at\", { ascending: false })");
  if (!s.includes("Cache-Control")) s = s.replace(/return NextResponse\.json\(\{\s*source:[\s\S]*?\}\);/, m => m.replace("});", "}, { headers: { \"Cache-Control\": \"no-store, no-cache, must-revalidate, max-age=0\" } });"));
  return s;
});
patch("src/app/current-affairs/page.tsx", s => s.replace("fetch(\"/api/current-affairs\")", "fetch(\"/api/current-affairs?_t=\" + Date.now(), { cache: \"no-store\" })"));
patch("src/app/state-special/page.tsx", s => s.replace("fetch(`/api/current-affairs?state=${encodeURIComponent(selectedState)}`)", "fetch(`/api/current-affairs?state=${encodeURIComponent(selectedState)}&_t=${Date.now()}`, { cache: \"no-store\" })"));
patch("src/components/StateSpecialClientView.tsx", s => s.replace("fetch(`/api/current-affairs?state=${encodeURIComponent(stateName)}`)", "fetch(`/api/current-affairs?state=${encodeURIComponent(stateName)}&_t=${Date.now()}`, { cache: \"no-store\" })"));
patch("src/app/page.tsx", s => {
  if (!s.includes("liveCaList")) {
    s = s.replace("const [dailyMcqs, setDailyMcqs] = useState", "const [liveCaList, setLiveCaList] = useState(STRUCTURED_CURRENT_AFFAIRS);\n  const [dailyMcqs, setDailyMcqs] = useState");
    s = s.replace("const sync = () => {\n      const c =", "fetch(\"/api/current-affairs?_t=\" + Date.now(), { cache: \"no-store\" }).then(r => r.json()).then(d => { if (Array.isArray(d?.articles) && d.articles.length > 0) setLiveCaList(d.articles); }).catch(() => {});\n    const sync = () => {\n      const c =");
    s = s.replace("STRUCTURED_CURRENT_AFFAIRS.slice(0, 3)", "liveCaList.slice(0, 3)");
  }
  return s;
});
patch("src/app/schemes/page.tsx", s => {
  if (!s.includes("liveItems")) {
    s = s.replace("const [selectedState, setSelectedState] = useState(\"Uttar Pradesh\");", "const [selectedState, setSelectedState] = useState(\"Uttar Pradesh\");\n  const [liveItems, setLiveItems] = useState(STRUCTURED_CURRENT_AFFAIRS);");
    s = s.replace("const sync = () => {\n      const list = loadNoCodeCms().states;", "fetch(\"/api/current-affairs?_t=\" + Date.now(), { cache: \"no-store\" }).then(r => r.json()).then(d => { if (Array.isArray(d?.articles) && d.articles.length > 0) setLiveItems(d.articles); }).catch(() => {});\n    const sync = () => {\n      const list = loadNoCodeCms().states;");
    s = s.replace("const schemeItems = STRUCTURED_CURRENT_AFFAIRS.filter", "const schemeItems = liveItems.filter");
  }
  return s;
});
const fs = require("fs");