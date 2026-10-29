// Generuje osobne strony gier: gra/<adres>/index.html z katalogu spolszczenia.json.
// Generuje strony wszystkich gier. Zmienna GRY_ONLY="a|b" ogranicza do wybranych (test).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const SITE="https://grypopolsku.pl",OUT=process.env.GRY_OUT||"gra",SITEMAP=process.env.GRY_SITEMAP||"sitemap.xml",DATA=process.env.GRY_DATA||"spolszczenia.json",NEWS="aktualnosci";
const ONLY=(process.env.GRY_ONLY?process.env.GRY_ONLY.split("|"):[]).filter(Boolean);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug=t=>String(t).toLowerCase().replace(/ł/g,"l").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const safe=u=>/^https?:\/\//i.test(u||"")?u:"#";
const MONTHS=["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];
const dateLong=s=>{const d=new Date(s+"T12:00:00");return isNaN(d)?"":d.getDate()+" "+MONTHS[d.getMonth()]+" "+d.getFullYear()};
const newsSrc=fs.readFileSync(path.join("scripts","news.mjs"),"utf8");
const THEMES_HTML=JSON.parse(newsSrc.match(/const THEMES_HTML=("(?:[^"\\]|\\.)*");/)[1]);
const ver=f=>{try{return crypto.createHash("md5").update(fs.readFileSync(path.join(NEWS,f))).digest("hex").slice(0,8)}catch(e){return "0"}};
const V={css:ver("news.css"),js:ver("news.js"),theme:ver("theme.js"),decor:ver("decor.js")};
const all=JSON.parse(fs.readFileSync(DATA,"utf8"));
const games=all.filter(g=>g.game&&(!ONLY.length||ONLY.includes(g.game)));
const STY='<style>.gh{display:flex;gap:22px;flex-wrap:wrap}.gc{flex:0 0 200px;max-width:100%}.gc img{width:100%;border-radius:12px;display:block;background:var(--line)}.gc .ph{aspect-ratio:2/3;border-radius:12px;background:linear-gradient(135deg,#3a2a3f,#5a3320);display:grid;place-items:center;font-size:56px;font-weight:800;color:#ffffff66}.gi{flex:1 1 300px;min-width:0}.gi h1{margin:0 0 8px}.gp{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.gl{display:grid;grid-template-columns:auto 1fr;gap:6px 20px;margin:0 0 16px}.gl dt{color:var(--muted)}.gl dd{margin:0;font-weight:600}.gb{display:flex;gap:10px;flex-wrap:wrap}.gb a{display:inline-block;font-weight:700;padding:10px 20px;border-radius:12px;border:2px solid var(--accent);text-decoration:none}.gb a.p{background:var(--accent);color:#fff}.gb a.p:hover{opacity:.9}.yt{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#241a2d center/cover;cursor:pointer;display:grid;place-items:center;border:0;width:100%;padding:0}.yt:before{content:"";position:absolute;inset:0;background:rgba(0,0,0,.45)}.yt .pl{position:relative;width:72px;height:50px;border-radius:14px;background:#ff0033;display:grid;place-items:center;transition:transform .15s}.yt:hover .pl{transform:scale(1.1)}.yt .pl:after{content:"";border-left:20px solid #fff;border-top:12px solid transparent;border-bottom:12px solid transparent;margin-left:5px}.yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.yic{display:inline-grid;place-items:center;width:28px;height:20px;border-radius:6px;background:#ff0033;vertical-align:middle;margin-right:8px}.yic:after{content:"";border-left:8px solid #fff;border-top:5px solid transparent;border-bottom:5px solid transparent;margin-left:2px}.gn{font-size:13px;color:var(--muted);border-left:3px solid var(--accent);padding-left:10px;margin:16px 0 0}</style>';
function page({title,desc,url,body,image,ld,key}){
  return '<!DOCTYPE html>\n<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'+
  '<title>'+esc(title)+'</title><meta name="description" content="'+esc(desc)+'"><link rel="canonical" href="'+esc(url)+'"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#14120f">\n'+
  '<meta property="og:site_name" content="GryPoPolsku.pl"><meta property="og:locale" content="pl_PL"><meta property="og:type" content="website"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(desc)+'"><meta property="og:url" content="'+esc(url)+'"><meta property="og:image" content="'+esc(image)+'"><meta name="twitter:card" content="summary"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(desc)+'"><meta name="twitter:image" content="'+esc(image)+'">\n'+
  '<script type="application/ld+json">'+JSON.stringify(ld).replace(/</g,"\\u003c")+'</script>\n'+
  '<link rel="stylesheet" href="/aktualnosci/news.css?v='+V.css+'"><script src="/aktualnosci/theme.js?v='+V.theme+'"></script>'+STY+'</head>\n<body data-page="post" data-key="'+esc(key)+'">\n<div class="uchip" id="uchip"></div>\n'+THEMES_HTML+'\n<div class="wrap">\n'+
  '<header><h1><a href="/" class="logo" aria-label="GryPoPolsku – strona główna">GryPoPolsku<span>.pl</span></a></h1><p class="tag">Katalog fanowskich polskich wersji językowych gier</p>\n'+
  '<div class="btns"><a class="btn" href="/#/dodaj">Dodaj spolszczenie</a><a class="btn" href="/#/glosowanie">Głosowanie</a><a class="btn" href="/aktualnosci/">Aktualności</a><a class="btn" href="/#/lektor">Polski Lektor</a></div></header>\n<main class="main">\n'+
  body+'\n</main>\n<footer>Strona nie hostuje plików gier ani spolszczeń, tylko linkuje do projektów. Do każdego spolszczenia potrzebna jest własna, legalnie nabyta kopia gry. <a href="/polityka-prywatnosci.html">Polityka prywatności</a></footer>\n</div>\n'+
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.js"></script><script src="/aktualnosci/news.js?v='+V.js+'"></script><script src="/aktualnosci/decor.js?v='+V.decor+'"></script>\n</body></html>\n'}
const ytId=u=>{const m=String(u||"").trim().match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#\/]|$)/);return m?m[1]:""};
const YTJS='<script>function ytGo(b){if(!b||b.classList.contains("on"))return;var f=document.createElement("iframe");f.src="https://www.youtube-nocookie.com/embed/"+b.getAttribute("data-yt")+"?autoplay=1&rel=0";f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.setAttribute("allowfullscreen","");f.title="Film z YouTube";b.innerHTML="";b.appendChild(f);b.style.cursor="default";b.removeAttribute("role");b.classList.add("on")}document.addEventListener("click",function(e){ytGo(e.target.closest&&e.target.closest(".yt"))});document.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){var b=e.target.closest&&e.target.closest(".yt");if(b&&b===e.target){e.preventDefault();ytGo(b)}}});</script>';
const built=[];
for(const g of games){
  const s=slug(g.game);if(!s)continue;
  const key=g.id||s,url=SITE+"/gra/"+s+"/",plat=g.platform||"PC";
  const hasSp=!!g.link&&g.pl!=="of",ofi=g.pl==="of",lore=/^https?:\/\//.test(g.lore||"")?g.lore:"",gr=/^https?:\/\//.test(g.gamereader||"")?g.gamereader:"",hasLk=!!(lore||gr);
  const typ=hasSp?({Napisy:"polskie napisy","Pełne":"pełne polskie spolszczenie",Dubbing:"polski dubbing"}[g.type]||"polskie spolszczenie"):(hasLk?"polski lektor":"polska wersja");
  const title=g.game+" – "+typ+(hasSp?" ("+plat.split(",")[0].trim()+")":"")+" | GryPoPolsku.pl";
  const lkNames=[lore?"LoreSpeak":"",gr?"GameReader 2.0":""].filter(Boolean).join(" i ");
  const desc=(hasSp?("Fanowskie "+typ+" do gry "+g.game+" ("+plat+"). Autor: "+(g.author&&g.author!=="—"?g.author:"nieznany")+". Status: "+String(g.status||"").toLowerCase()+(g.ver&&g.ver!=="—"?", wersja "+g.ver:"")+". Link do pobrania"+(hasLk?", lektor ("+lkNames+")":"")+" i komentarze."):(g.game+(ofi?" ma oficjalną polską wersję językową":" – informacje o polskiej wersji")+(hasLk?". Polski lektor w aplikacji "+lkNames+".":".")+" Komentarze i linki.")).slice(0,300);
  const img=g.img&&/^https:\/\//.test(g.img)?g.img:"";
  const rows=[["Platforma",plat]];
  if(hasSp)rows.push(["Zakres",g.type||"—"],["Status",g.status||"—"],["Wersja",g.ver||"—"],["Autor",g.author||"—"]);
  if(ofi)rows.push(["Polska wersja","Oficjalna (od twórców)"]);
  if(hasLk)rows.push(["Lektor",lkNames]);
  if(g.genre)rows.splice(1,0,["Gatunek",g.genre]);
  if(g.upd)rows.push(["Ostatnia aktualizacja",dateLong(g.upd)]);
  const yid=ytId(g.yt);
  const ytSec=yid?'<div class="panel"><h2 class="ch"><span class="yic"></span>Zobacz, jak to wygląda</h2><div role="button" tabindex="0" class="yt" data-yt="'+yid+'" aria-label="Odtwórz film"'+(img?' style="background-image:url(\''+esc(img)+'\')"':'')+'><span class="pl"></span></div><p class="gn" style="margin-top:10px">Film na YouTube'+(g.ytt?' · '+esc(g.ytt):'')+'. Włączy się dopiero po kliknięciu, wcześniej YouTube nie dostaje żadnych danych o odwiedzających.</p></div>':"";
  const body='<div class="panel"><a class="back" href="/">← Wróć do katalogu</a><article><div class="gh"><div class="gc">'+(img?'<img src="'+esc(img)+'" alt="Okładka gry '+esc(g.game)+'">':'<div class="ph">'+esc(g.game.charAt(0).toUpperCase())+'</div>')+'</div><div class="gi"><h1>'+esc(g.game)+' – '+esc(typ)+'</h1>'+
   '<div class="gp">'+(g.genre?'<span class="etag c-strona">'+esc(g.genre)+'</span>':'')+(hasSp?'<span class="etag c-akt">'+esc(g.type||"Napisy")+'</span><span class="etag c-nowe">'+esc(g.status||"")+'</span>':'')+(ofi?'<span class="etag c-akt">Oficjalna PL</span>':'')+(hasLk?'<span class="etag c-premiera">Lektor</span>':'')+'</div>'+
   '<dl class="gl">'+rows.map(r=>'<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>').join("")+'</dl>'+
   '<div class="gb">'+(hasSp?'<a class="p" href="'+esc(safe(g.link))+'" target="_blank" rel="noopener">Pobierz spolszczenie ↗</a><a href="/#/glosowanie">🗳️ Głosuj na spolszczenie tygodnia</a>':'')+(lore?'<a class="'+(hasSp?'':'p')+'" href="'+esc(lore)+'" target="_blank" rel="noopener">🎙 Odwiedź lektora (LoreSpeak) ↗</a>':'')+(gr?'<a class="'+(hasSp||lore?'':'p')+'" href="'+esc(gr)+'" target="_blank" rel="noopener">🎙 Odwiedź lektora (GameReader 2.0) ↗</a>':'')+'</div>'+
   '<p class="gn">'+(hasSp?'Strona nie hostuje plików. Link prowadzi do projektu twórcy, a do działania potrzebna jest własna, legalnie nabyta kopia gry. Instrukcja instalacji jest u autora spolszczenia.':'Strona nie hostuje plików ani lektorów, tylko linkuje do aplikacji i projektów twórców.')+'</p></div></div></article></div>'+ytSec+
   '<div class="panel" id="komentarze"><h2 class="ch">Komentarze (<span id="ccount">0</span>)</h2><div id="cform"></div><div id="clist"><p class="msg">Wczytywanie komentarzy…</p></div></div>';
  const ld={"@context":"https://schema.org","@type":"WebPage",name:title,url,inLanguage:"pl",description:desc,about:{"@type":"VideoGame",name:g.game,gamePlatform:plat,inLanguage:"pl",genre:g.genre||undefined,image:img||undefined},isPartOf:{"@type":"WebSite",name:"GryPoPolsku.pl",url:SITE+"/"}};
  const dir=path.join(OUT,s);fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,"index.html"),page({title,desc,url,body:body+(yid?YTJS:""),image:img||SITE+"/icon-192.png",ld,key}));
  built.push({s,upd:g.upd});
}
// sprzątanie stron gier spoza listy
if(fs.existsSync(OUT)){const keep=new Set(built.map(b=>b.s));for(const e of fs.readdirSync(OUT,{withFileTypes:true}))if(e.isDirectory()&&!keep.has(e.name))fs.rmSync(path.join(OUT,e.name),{recursive:true,force:true})}
// sitemap
let sm=fs.existsSync(SITEMAP)?fs.readFileSync(SITEMAP,"utf8"):'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n';
sm=sm.replace(/<url>\s*<loc>[^<]*\/gra\/[^<]*<\/loc>[\s\S]*?<\/url>\s*/g,"");
sm=sm.replace("</urlset>",built.map(b=>'<url><loc>'+SITE+'/gra/'+b.s+'/</loc><lastmod>'+(b.upd||new Date().toISOString().slice(0,10))+'</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n').join("")+"</urlset>");
fs.writeFileSync(SITEMAP,sm);
console.log("Strony gier: "+built.length);
