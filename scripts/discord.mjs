// Ogłoszenia na Discordzie: po każdej automatycznej aktualizacji wysyła przez webhook wiadomość o nowych grach,
// nowych spolszczeniach i aktualizacjach w katalogu oraz o nowych wpisach w Aktualnościach.
// Porównuje stan sprzed tej aktualizacji (commit PRE) z obecnym (HEAD). Bez sekretu DISCORD_WEBHOOK nic nie robi.
// DISCORD_TEST=true – wysyła wiadomość testową z najnowszą pozycją katalogu (do sprawdzenia, czy webhook działa).
// DRY=1 – nic nie wysyła, tylko wypisuje, co by wysłało.
import fs from "node:fs";
import { execSync } from "node:child_process";

const SITE = "https://grypopolsku.pl";
const HOOK = process.env.DISCORD_WEBHOOK || "";               // kanał z katalogiem (#nowe-spolszczenia)
const HOOK_NEWS = process.env.DISCORD_WEBHOOK_NEWS || HOOK;     // kanał z wpisami (#aktualności); bez sekretu – ten sam co katalog
const DRY = process.env.DRY === "1";
const TEST = process.env.DISCORD_TEST === "true";
const PRE = process.env.PRE || "";
const MAX = 10; // tyle pojedynczych ogłoszeń w jednym przebiegu, reszta jako podsumowanie

const slug = t => String(t).toLowerCase().replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const sh = c => { try { return execSync(c, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 << 20 }); } catch { return ""; } };
const img = u => (/^https?:\/\//i.test(u || "") ? u : /^img\//.test(u || "") ? SITE + "/" + u : null);
const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const recent = d => d === today || d === yesterday;
const onlyZap = g => g.status === "Zapowiedź" && !(g.spolszczenia || []).some(x => x && x.status && x.status !== "Zapowiedź");
const authors = g => [g.author, ...(g.spolszczenia || []).map(x => x && x.author)].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
const kind = g => (g.pl === "of" ? "Oficjalna PL" : g.type || "Napisy");
const COLORS = { nowa: 0x4fcf8a, sp: 0x4fcf8a, dub: 0xe8905f, aktualizacja: 0x4fb3ff, wpis: 0xb57cff, test: 0xe8905f };

function gameEmbed(g, typ, extra) {
  const fields = [];
  const au = authors(g);
  if (au.length) fields.push({ name: "Autor", value: au.join(", ").slice(0, 200), inline: true });
  fields.push({ name: "Zakres", value: kind(g), inline: true });
  if (g.status && g.pl !== "of") fields.push({ name: "Status", value: g.status + (g.status === "W trakcie" && g.prog ? ` (${g.prog}%)` : ""), inline: true });
  if (g.ver && g.ver !== "—") fields.push({ name: "Wersja", value: String(g.ver).slice(0, 40), inline: true });
  if (g.platform) fields.push({ name: "Platforma", value: String(g.platform).slice(0, 80), inline: true });
  const head = { nowa: "🆕 Nowe w katalogu", sp: "🆕 Nowe spolszczenie", dub: "🎭 Nowy dubbing", aktualizacja: "🔄 Aktualizacja", test: "🧪 Test ogłoszeń" }[typ];
  const e = {
    title: `${head}: ${g.game}`.slice(0, 250),
    url: `${SITE}/gra/${slug(g.game)}/`,
    color: COLORS[typ],
    fields,
    footer: { text: "GryPoPolsku.pl – katalog polskich wersji gier" },
  };
  if (extra) e.description = extra;
  const t = img(g.img);
  if (t) e.thumbnail = { url: t };
  return e;
}

// Zmiany w katalogu między PRE a HEAD
function catalogEvents() {
  const oldTxt = sh(`git show ${PRE}:spolszczenia.json`);
  if (!oldTxt) return [];
  let oldL, newL;
  try { oldL = JSON.parse(oldTxt); newL = JSON.parse(fs.readFileSync("spolszczenia.json", "utf8")); } catch { return []; }
  const O = new Map(oldL.map(g => [slug(g.game || ""), g]));
  const ev = [];
  for (const g of newL) {
    if (!g.game || onlyZap(g)) continue;
    const o = O.get(slug(g.game));
    if (!o) { if (recent(g.dodano || g.upd || today)) ev.push(gameEmbed(g, "nowa")); continue; }
    const nSp = (g.spolszczenia || []).filter(x => !(o.spolszczenia || []).some(y => y && x && y.id === x.id));
    if (nSp.length && nSp.some(x => x.link)) {
      const s = nSp[0];
      const dub = s.type === "Dubbing";
      // pola (autor, zakres, status, wersja) opisują nowe spolszczenie, a nie główne
      const gs = { ...g, author: s.author, spolszczenia: [], type: s.type, status: s.status, ver: s.ver, prog: s.prog, pl: undefined };
      ev.push(gameEmbed(gs, dub ? "dub" : "sp", `${dub ? "Nowy dubbing" : "Kolejne spolszczenie"}${s.author ? ` od **${s.author}**` : ""}${s.status ? ` (${s.status})` : ""}.`));
      continue;
    }
    const wasZap = onlyZap(o);
    const verUp = g.ver && o.ver && g.ver !== o.ver;
    const ready = g.status === "Gotowe" && o.status && o.status !== "Gotowe";
    if ((g.upd || "") > (o.upd || "") && recent(g.upd) && (verUp || ready || wasZap)) {
      const why = wasZap ? "Spolszczenie już dostępne!" : verUp ? `Nowa wersja: **${o.ver} → ${g.ver}**` : "Status zmieniony na **Gotowe**.";
      ev.push(gameEmbed(g, "aktualizacja", why));
    }
  }
  return ev;
}

// Nowe wpisy w Aktualnościach (nowe katalogi aktualnosci/<adres>/ między PRE a HEAD)
function newsEvents() {
  const out = sh(`git diff --name-status ${PRE} HEAD -- aktualnosci`);
  const ev = [];
  for (const line of out.split("\n")) {
    const m = /^A\s+aktualnosci\/([a-z0-9-]+)\/index\.html$/.exec(line.trim());
    if (!m) continue;
    let html = "";
    try { html = fs.readFileSync(`aktualnosci/${m[1]}/index.html`, "utf8"); } catch { continue; }
    const meta = p => { const r = new RegExp(`<meta (?:property|name)="${p}" content="([^"]*)"`).exec(html); return r ? r[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'") : ""; };
    const title = meta("og:title") || (/<title>([^<]*)<\/title>/.exec(html) || [])[1] || m[1];
    const e = { title: ("📰 " + title.replace(/ – GryPoPolsku\.pl$/, "")).slice(0, 250), url: `${SITE}/aktualnosci/${m[1]}/`, color: COLORS.wpis, description: meta("description").slice(0, 300), footer: { text: "GryPoPolsku.pl – Aktualności" } };
    const im = meta("og:image");
    if (im) e.image = { url: im };
    ev.push(e);
  }
  return ev;
}

async function send(embeds, content, hook = HOOK) {
  const body = { username: "GryPoPolsku.pl", avatar_url: SITE + "/icon-192.png", embeds, allowed_mentions: { parse: [] } };
  if (content) body.content = content;
  if (DRY || !HOOK) { console.log(JSON.stringify(body, null, 1)); return; }
  for (let i = 0; i < 3; i++) {
    const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await new Promise(z => setTimeout(z, ((j.retry_after || 2) + 0.5) * 1000)); continue; }
    if (!r.ok) console.log("Discord:", r.status, (await r.text()).slice(0, 200));
    return;
  }
}

if (!HOOK && !DRY) { console.log("Brak sekretu DISCORD_WEBHOOK – pomijam ogłoszenia."); process.exit(0); }

if (TEST) {
  const list = JSON.parse(fs.readFileSync("spolszczenia.json", "utf8")).filter(g => !onlyZap(g));
  const last = list.slice().sort((a, b) => String(b.upd || b.dodano || "").localeCompare(String(a.upd || a.dodano || "")))[0];
  await send([gameEmbed(last, "test", "To jest wiadomość testowa dla kanału z katalogiem. Jeśli ją widzisz, ogłoszenia działają.")]);
  if (HOOK_NEWS !== HOOK) await send([{ title: "🧪 Test ogłoszeń: Aktualności", url: SITE + "/aktualnosci/", color: COLORS.wpis, description: "To jest wiadomość testowa dla kanału z Aktualnościami. Jeśli ją widzisz, nowe wpisy będą trafiać tutaj.", footer: { text: "GryPoPolsku.pl – Aktualności" } }], null, HOOK_NEWS);
  console.log("Wysłano wiadomość testową.");
  process.exit(0);
}

if (process.env.PUSHED !== "1" && !DRY) { console.log("Nic nie wysłano na GitHuba w tym przebiegu – brak ogłoszeń."); process.exit(0); }
const head = sh("git rev-parse HEAD").trim();
if (!PRE || PRE === head) { console.log("Brak nowego commitu – nic do ogłoszenia."); process.exit(0); }

const news = newsEvents(), all = catalogEvents();
if (!news.length && !all.length) { console.log("Brak zmian do ogłoszenia."); process.exit(0); }
for (let i = 0; i < news.length; i += 10) await send(news.slice(i, i + 10), null, HOOK_NEWS);
const shown = all.slice(0, MAX);
for (let i = 0; i < shown.length; i += 10) await send(shown.slice(i, i + 10));
if (all.length > MAX) await send([], `…i jeszcze ${all.length - MAX} zmian w katalogu. Wszystkie nowości: ${SITE}/#katalog`);
console.log(`Ogłoszono: wpisy ${news.length}, katalog ${shown.length}${all.length > MAX ? ` (+ podsumowanie ${all.length - MAX})` : ""}.`);
