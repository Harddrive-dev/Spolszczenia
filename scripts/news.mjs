// Generuje strony Aktualności z tabeli `news` w Supabase:
//   aktualnosci/index.html (lista) i aktualnosci/<adres>/index.html (wpisy), oraz uzupełnia sitemap.xml.
// Uruchamiany przez GitHub Action razem z sync.mjs. Zmienna NEWS_FILE (test): czyta wpisy z pliku JSON zamiast z Supabase.
import fs from "node:fs";
import path from "node:path";
const SB="https://qbozpokxgtspwdxvbevv.supabase.co",KEY="sb_publishable_0StDDiTyHHv_ZIW0nh590g_ij3wNMTV";
const SITE="https://grypopolsku.pl",OUT=process.env.NEWS_OUT||"aktualnosci",SITEMAP=process.env.NEWS_SITEMAP||"sitemap.xml";
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const SLUG=/^[a-z0-9]+(-[a-z0-9]+)*$/;
const CATS={"Premiera":"c-premiera","Nowe spolszczenie":"c-nowe","Aktualizacja":"c-akt","Strona":"c-strona","Ogłoszenie":"c-ogl"};

let rows;
if(process.env.NEWS_FILE){rows=JSON.parse(fs.readFileSync(process.env.NEWS_FILE,"utf8"))}
else{
  const res=await fetch(SB+"/rest/v1/news?select=*&published=eq.true&order=created_at.desc&limit=500",{headers:{apikey:KEY,Authorization:"Bearer "+KEY}});
  if(!res.ok){const t=await res.text();
    if(res.status===404||/PGRST205|42P01|does not exist|schema cache/i.test(t)){console.log("Tabela news jeszcze nie istnieje (uruchom aktualnosci.sql w Supabase). Generuję pustą listę.");rows=[]}
    else{console.error("Błąd Supabase",res.status,t);process.exit(1)}}
  else rows=await res.json();
}
rows=rows.filter(r=>r&&SLUG.test(r.slug||"")&&r.title&&r.body&&r.published!==false);

const MONTHS=["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];
function parts(iso){const d=new Date(iso);const f=new Intl.DateTimeFormat("pl-PL",{timeZone:"Europe/Warsaw",day:"numeric",month:"numeric",year:"numeric"}).formatToParts(d);const g=t=>+f.find(x=>x.type===t).value;return{d:g("day"),m:g("month"),y:g("year")}}
const dateLong=iso=>{const p=parts(iso);return p.d+" "+MONTHS[p.m-1]+" "+p.y};
const cover=r=>!r.cover?"":/^img\//.test(r.cover)?"/"+r.cover:/^https:\/\//.test(r.cover)?r.cover:"";
const imgOf=r=>!r.image?"":/^img\//.test(r.image)?"/"+r.image:/^https:\/\//.test(r.image)?r.image:"";
const initials=t=>String(t).replace(/[^\p{L}\p{N} ]/gu,"").trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"G.";
const coverBox=(r,u)=>{const c=cover(r);return '<a class="cov" href="'+u+'" aria-label="'+esc(r.title)+'">'+(c?'<img src="'+esc(c)+'" alt="" loading="lazy">':esc(initials(r.title)))+'</a>'};

// prosty format: pusty wiersz = akapit, "## " = nagłówek, "- " = lista, **pogrubienie**, [tekst](https://adres)
function inline(s){let t=esc(s);
  t=t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,(m,a,u)=>'<a href="'+u+'" target="_blank" rel="noopener">'+a+'</a>');
  t=t.replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>");return t}
function fmt(body){
  return String(body).replace(/\r/g,"").split(/\n{2,}/).map(b=>{b=b.trim();if(!b)return"";
    if(/^## /.test(b)&&!b.includes("\n"))return"<h2>"+inline(b.slice(3))+"</h2>";
    const ls=b.split("\n");
    if(ls.every(l=>/^- /.test(l)))return"<ul>"+ls.map(l=>"<li>"+inline(l.slice(2))+"</li>").join("")+"</ul>";
    return"<p>"+ls.map(inline).join("<br>")+"</p>"}).join("\n")}

const THEMES_HTML="<div class=\"themes\" role=\"group\" aria-label=\"Motyw strony\">\n  <button type=\"button\" class=\"tb\" data-t=\"light\" aria-label=\"Motyw jasny\" title=\"Jasny\"><svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#c97a00\" stroke-width=\"2\" stroke-linecap=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"4.5\" fill=\"#f5b83d\"/><path d=\"M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8\"/></svg></button>\n  <button type=\"button\" class=\"tb\" data-t=\"dark\" aria-label=\"Motyw ciemny (brązowy)\" title=\"Ciemny\"><svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z\" fill=\"#d9b88a\"/></svg></button>\n  <button type=\"button\" class=\"tb tb-hw\" data-t=\"halloween\" aria-label=\"Motyw Halloween\" title=\"Halloween\"><svg width=\"24\" height=\"22\" viewBox=\"0 0 72 64\" aria-hidden=\"true\"><path d=\"M36 14c-3-6-1-10 4-12\" stroke=\"#7cc14a\" stroke-width=\"6\" fill=\"none\" stroke-linecap=\"round\"/><ellipse cx=\"22\" cy=\"38\" rx=\"18\" ry=\"22\" fill=\"#e8730c\"/><ellipse cx=\"50\" cy=\"38\" rx=\"18\" ry=\"22\" fill=\"#e8730c\"/><ellipse cx=\"36\" cy=\"38\" rx=\"16\" ry=\"24\" fill=\"#ff8a1f\"/><path d=\"M24 34l6 6-9 1zM48 34l-6 6 9 1z\" fill=\"#ffe27a\"/></svg></button>\n</div>";
function page({title,desc,url,body,og,ld,pageType,key}){
  return '<!DOCTYPE html>\n<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'+
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'+
  '<title>'+esc(title)+'</title><meta name="description" content="'+esc(desc)+'"><link rel="canonical" href="'+esc(url)+'"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#14120f">\n'+
  '<meta property="og:site_name" content="GryPoPolsku.pl"><meta property="og:locale" content="pl_PL"><meta property="og:type" content="'+(og.type||"website")+'"><meta property="og:title" content="'+esc(og.title||title)+'"><meta property="og:description" content="'+esc(desc)+'"><meta property="og:url" content="'+esc(url)+'"><meta property="og:image" content="'+esc(og.image)+'"><meta name="twitter:card" content="'+(og.big?"summary_large_image":"summary")+'"><meta name="twitter:title" content="'+esc(og.title||title)+'"><meta name="twitter:description" content="'+esc(desc)+'"><meta name="twitter:image" content="'+esc(og.image)+'">\n'+
  (ld?'<script type="application/ld+json">'+JSON.stringify(ld).replace(/</g,"\\u003c")+'</script>\n':'')+
  '<link rel="stylesheet" href="/aktualnosci/news.css?v='+V.css+'"><script src="/aktualnosci/theme.js?v='+V.theme+'"></script></head>\n<body data-page="'+pageType+'"'+(key?' data-key="'+esc(key)+'"':'')+'>\n<div class="uchip" id="uchip"></div>\n'+THEMES_HTML+'\n<div class="wrap">\n'+
  '<header><h1><a href="/" class="logo" aria-label="GryPoPolsku – strona główna">GryPoPolsku<span>.pl</span></a></h1><p class="tag">Katalog fanowskich polskich wersji językowych gier</p>\n'+
  '<div class="btns"><a class="btn" href="/#/dodaj">Dodaj spolszczenie</a><a class="btn" href="/#/glosowanie">Głosowanie</a><a class="btn on" href="/aktualnosci/">Aktualności</a><a class="btn" href="/#/lektor">Polski Lektor</a><a class="btn navmem" id="navMem" href="/#/memory" style="display:none">🏆 Turniej</a></div></header>\n<main class="main">\n'+
  body+'\n</main>\n<footer>Strona nie hostuje plików gier ani spolszczeń, tylko linkuje do projektów. Do każdego spolszczenia potrzebna jest własna, legalnie nabyta kopia gry. <a href="/polityka-prywatnosci.html">Polityka prywatności</a></footer>\n</div>\n'+
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/dist/umd/supabase.js"></script><script src="/aktualnosci/news.js?v='+V.js+'"></script><script src="/aktualnosci/decor.js?v='+V.decor+'"></script>\n</body></html>\n'}

import crypto from "node:crypto";
const ver=f=>{try{return crypto.createHash("md5").update(fs.readFileSync(path.join(OUT,f))).digest("hex").slice(0,8)}catch(e){return "0"}};
const V={css:ver("news.css"),js:ver("news.js"),theme:ver("theme.js"),decor:ver("decor.js")};
const DEF_IMG=SITE+"/icon-192.png";
function item(r,hero){
  const u="/aktualnosci/"+r.slug+"/",cc=CATS[r.category]||"c-ogl";
  const ex=r.excerpt||String(r.body).replace(/[#*\[\]()\-]/g," ").replace(/\s+/g," ").trim().slice(0,160);
  const t=(r.title+" "+ex+" "+r.category).toLowerCase();
  const inner='<span class="etag '+cc+'">'+esc(r.category)+'</span> <span class="d">'+dateLong(r.created_at)+'</span><h3><a href="'+u+'">'+esc(r.title)+'</a></h3><p class="ex">'+esc(ex)+'</p><div class="bar"><a class="pb" href="'+u+'#komentarze" data-cnt="'+esc(r.slug)+'">💬 0</a><a class="more" href="'+u+'">Czytaj i komentuj →</a></div>';
  return hero?'<div class="hero" data-t="'+esc(t)+'" data-c="'+esc(r.category)+'">'+coverBox(r,u)+'<div>'+inner+'</div></div>':'<div class="it" data-t="'+esc(t)+'" data-c="'+esc(r.category)+'">'+inner+'</div>'}

fs.mkdirSync(OUT,{recursive:true});
// lista
const cats=[...new Set(rows.map(r=>r.category))];
const listBody='<div class="panel"><h2 class="pt">Aktualności</h2>'+
  (rows.length?'<input class="srch" id="q" type="search" placeholder="🔍 Szukaj w aktualnościach…" aria-label="Szukaj w aktualnościach"><div class="chips"><button type="button" class="chip on" data-c="">Wszystko</button>'+cats.map(c=>'<button type="button" class="chip" data-c="'+esc(c)+'">'+esc(c)+'</button>').join("")+'</div>'+item(rows[0],true)+rows.slice(1).map(r=>item(r,false)).join("")+'<p class="empty" id="empty" style="display:none">Brak wpisów pasujących do wyszukiwania.</p>'
  :'<p class="empty">Na razie nie ma jeszcze żadnych aktualności. Zajrzyj tu wkrótce!</p><input id="q" type="hidden"><span id="empty" style="display:none"></span>')+'</div>';
const listDesc="Aktualności ze świata polskich wersji językowych gier: premiery, nowe spolszczenia, aktualizacje i ogłoszenia GryPoPolsku.pl.";
fs.writeFileSync(path.join(OUT,"index.html"),page({title:"Aktualności – GryPoPolsku.pl",desc:listDesc,url:SITE+"/aktualnosci/",body:listBody,og:{title:"Aktualności – GryPoPolsku.pl",image:DEF_IMG},pageType:"list",
  ld:{"@context":"https://schema.org","@type":"CollectionPage",name:"Aktualności – GryPoPolsku.pl",url:SITE+"/aktualnosci/",inLanguage:"pl"}}));
// wpisy
for(const r of rows){
  const dir=path.join(OUT,r.slug);fs.mkdirSync(dir,{recursive:true});
  const url=SITE+"/aktualnosci/"+r.slug+"/",cc=CATS[r.category]||"c-ogl",c=imgOf(r),th=cover(r);
  const desc=(r.excerpt||String(r.body).replace(/[#*\[\]()]/g," ").replace(/\s+/g," ").trim()).slice(0,200);
  const ogi=c||th,img=ogi?(ogi.startsWith("/")?SITE+ogi:ogi):DEF_IMG;
  const body='<div class="panel"><a class="back" href="/aktualnosci/">← Aktualności</a><article><span class="etag '+cc+'">'+esc(r.category)+'</span> <span class="d"><time datetime="'+esc(r.created_at)+'">'+dateLong(r.created_at)+'</time>'+(r.author?' · '+esc(r.author):'')+'</span><h1>'+esc(r.title)+'</h1>'+(c?'<div class="cover"><img src="'+esc(c)+'" alt="'+esc(r.title)+'"></div>':'')+'<div class="body">'+fmt(r.body)+'</div></article></div>'+
   '<div class="panel" id="komentarze"><h2 class="ch">Komentarze (<span id="ccount">0</span>)</h2><div id="cform"></div><div id="clist"><p class="msg">Wczytywanie komentarzy…</p></div></div>';
  fs.writeFileSync(path.join(dir,"index.html"),page({title:r.title+" – GryPoPolsku.pl",desc,url,body,og:{type:"article",title:r.title,image:img,big:!!ogi},pageType:"post",key:"news:"+r.slug,
   ld:{"@context":"https://schema.org","@type":"NewsArticle",headline:r.title.slice(0,110),description:desc,image:[img],datePublished:r.created_at,dateModified:r.updated_at||r.created_at,inLanguage:"pl",author:{"@type":"Organization",name:r.author||"GryPoPolsku.pl"},publisher:{"@type":"Organization",name:"GryPoPolsku.pl",logo:{"@type":"ImageObject",url:DEF_IMG}},mainEntityOfPage:url}}))}
// sprzątanie usuniętych wpisów
const keep=new Set(rows.map(r=>r.slug));
for(const e of fs.readdirSync(OUT,{withFileTypes:true}))if(e.isDirectory()&&!keep.has(e.name))fs.rmSync(path.join(OUT,e.name),{recursive:true,force:true});
// sitemap
let sm=fs.existsSync(SITEMAP)?fs.readFileSync(SITEMAP,"utf8"):'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n';
sm=sm.replace(/<url>\s*<loc>[^<]*\/aktualnosci\/[^<]*<\/loc>[\s\S]*?<\/url>\s*/g,"");
const day=i=>String(i||"").slice(0,10)||new Date().toISOString().slice(0,10);
const urls='<url><loc>'+SITE+'/aktualnosci/</loc><lastmod>'+day(rows[0]&&(rows[0].updated_at||rows[0].created_at))+'</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n'+
  rows.map(r=>'<url><loc>'+SITE+'/aktualnosci/'+r.slug+'/</loc><lastmod>'+day(r.updated_at||r.created_at)+'</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n').join("");
sm=sm.replace("</urlset>",urls+"</urlset>");
fs.writeFileSync(SITEMAP,sm);
console.log("Aktualności: wygenerowano "+rows.length+" wpisów");
