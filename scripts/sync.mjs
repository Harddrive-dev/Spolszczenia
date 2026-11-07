// Pobiera zatwierdzone zgłoszenia z Supabase i dopisuje je do spolszczenia.json
import fs from "node:fs";
const URL_="https://qbozpokxgtspwdxvbevv.supabase.co", KEY="sb_publishable_0StDDiTyHHv_ZIW0nh590g_ij3wNMTV";
const slug=t=>String(t).toLowerCase().replace(/ł/g,"l").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const keyOf=g=>g.id||slug(g.game||"");
const res=await fetch(URL_+"/rest/v1/rpc/approved_changes",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json"},body:"{}"});
if(!res.ok){console.error("Błąd Supabase",res.status,await res.text());process.exit(1)}
const rows=await res.json();
const list=JSON.parse(fs.readFileSync("spolszczenia.json","utf8")),before=JSON.stringify(list,null,2);
for(const g of list)if(g.status==="W toku")g.status="Beta";
const TYPES=["Napisy","Pełne","Dubbing"],DUBST=["Gotowe","Beta","Testy"],EDIT=["status","ver","author","genre","link"];
const YT=u=>/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[?&#\/]|$)/.test(String(u||"").trim());
const find=k=>list.find(g=>keyOf(g)===k);
// Numer gry na Steamie: sam numer, link do sklepu albo kilka po przecinku. Zwraca listę numerów albo null, gdy coś jest nie tak.
const steamParse=v=>{v=String(Array.isArray(v)?v.join(","):v??"").trim();if(!v)return[];const out=[];for(const x of v.split(/[\s,;]+/)){if(!x)continue;const m=/^(\d{1,8})$/.exec(x)||/steam(?:powered|community)\.com\/(?:app|agecheck\/app)\/(\d{1,8})/i.exec(x);if(!m)return null;if(!out.includes(+m[1]))out.push(+m[1])}return out};
const steamSet=(g,ids)=>{if(ids&&ids.length)g.steam=ids.length===1?ids[0]:ids;else delete g.steam};
// Kilka spolszczeń jednej gry: pierwsze zostaje w polach wpisu, kolejne trafiają do listy „spolszczenia”. Każde ma stałe id (przyda się do ocen).
const spNorm=a=>{const seen=new Set();return (Array.isArray(a)?a:[]).map(s=>({id:String(s.id||""),author:String(s.author||"—").slice(0,100),link:String(s.link||"").trim(),type:TYPES.includes(s.type)?s.type:"Napisy",status:["Gotowe","W trakcie","Beta","Testy","Premiera","Zapowiedź"].includes(s.status)?s.status:"Gotowe",prog:Math.max(0,Math.min(100,+s.prog||0)),ver:String(s.ver||"—").slice(0,40),upd:String(s.upd||"").slice(0,10),dodano:String(s.dodano||"").slice(0,10)})).filter(s=>{if(!/^https?:\/\//i.test(s.link)||seen.has(s.link))return false;seen.add(s.link);return true})};
// Aktualizacja = nowy numer wersji albo przejście na „Gotowe”. Uzupełnienie brakującego numeru (—) się nie liczy.
const spUpd=(o,n)=>!!(o&&n&&((o.ver&&o.ver!=="—"&&n.ver&&n.ver!=="—"&&o.ver!==n.ver)||(["W trakcie","Beta","Testy","Zapowiedź"].includes(o.status)&&n.status==="Gotowe")));
const spAdd=(g,d,link,day)=>{const a=Array.isArray(g.spolszczenia)?g.spolszczenia:[];if(g.link===link||a.some(s=>s.link===link))return;const base=keyOf(g)+"--"+(slug(d.author||"")||"autor");let id=base,n=2;while(a.some(s=>s.id===id))id=base+"-"+(n++);a.push(spNorm([{id,author:d.author,link,type:d.type,status:d.status==="W toku"?"Beta":d.status,prog:d.prog,ver:d.ver,upd:d.upd||day,dodano:day}])[0]);g.spolszczenia=a};
for(const r of rows){const d=r.data||{},day=String(r.created_at||"").slice(0,10);
 if(r.kind==="new"){const name=String(d.game||r.game||"").trim(),link=String(d.link||"");
  const URLOK=u=>/^https?:\/\//i.test(u||""),gOf=d.pl==="of";
  const exG=name&&find(slug(name));if(exG){if(URLOK(link))spAdd(exG,d,link,day);continue}
  if(!name||(!URLOK(link)&&!gOf&&!URLOK(d.lore)&&!URLOK(d.gamereader)&&!URLOK(d.dub)))continue;
  const e={game:name,platform:d.platform||"PC",type:TYPES.includes(d.type)?d.type:"Napisy",status:(d.status==="W toku"?"Beta":d.status)||"Gotowe",prog:Math.max(0,Math.min(100,+d.prog||0)),ver:d.ver||"—",author:d.author||"—"};
  if(URLOK(link))e.link=link;if(gOf){e.pl="of";delete e.status}if(URLOK(d.lore))e.lore=d.lore;if(URLOK(d.gamereader))e.gamereader=d.gamereader;if(URLOK(d.dub)){e.dub=d.dub;if(d.dubAuthor)e.dubAuthor=String(d.dubAuthor).slice(0,100);if(DUBST.includes(d.dubStatus))e.dubStatus=d.dubStatus}if(YT(d.yt))e.yt=d.yt;if(d.ytt)e.ytt=String(d.ytt).slice(0,80);
  if(d.genre)e.genre=d.genre;if(d.premiera&&/^\d{4}-\d{2}-\d{2}$/.test(d.premiera))e.premiera=d.premiera;e.dodano=day;if(d.img&&/^(https?:\/\/|img\/)/i.test(d.img))e.img=String(d.img);if(d.opis)e.opis=String(d.opis).slice(0,500);{const st=steamParse(d.steam);if(st&&st.length)steamSet(e,st)}e.upd=d.upd||day;list.push(e)}
 else if(r.kind==="edit"){const g=find(d.key);if(!g)continue;const przed={ver:g.ver,status:g.status};
  for(const c of d.changes||[]){if(!EDIT.includes(c.field))continue;const v=String(c.to==null?"":c.to).trim();
   if(c.field==="link"&&!/^https?:\/\//i.test(v))continue;if(c.field==="genre"||v)g[c.field]=v;if(c.field==="genre"&&!v)delete g.genre}
  if(day&&spUpd(przed,g))g.upd=day}
 else if(r.kind==="modedit"){const g=find(d.key);if(!g)continue;const przed={ver:g.ver,status:g.status};
  for(const c of d.changes||[]){const f=c.field,v=String(c.to==null?"":c.to).trim();
   if(f==="usun"){if(v==="1")g._usun=1;continue}
   if(f==="steam"){const st=steamParse(v);if(st)steamSet(g,st);continue}
   if(f==="spolszczenia"){let a=null;try{a=spNorm(JSON.parse(v||"[]"))}catch{continue}for(const s of a){const o=(g.spolszczenia||[]).find(x=>x.id===s.id);if(o&&spUpd(o,s))s.upd=day}if(a.length)g.spolszczenia=a;else delete g.spolszczenia;continue}
   if(!["game","platform","genre","type","status","prog","ver","author","link","img","opis","upd","premiera","pl","lore","gamereader","yt","ytt","dub","dubAuthor","dubStatus"].includes(f))continue;
   if(f==="status"){if(v)g.status=v==="W toku"?"Beta":v;continue}
   if(f==="yt"){if(YT(v))g.yt=v;else if(!v)delete g.yt;continue}
   if(f==="ytt"){if(v)g.ytt=v.slice(0,80);else delete g.ytt;continue}
   if(f==="pl"){if(v==="of")g.pl="of";else delete g.pl;continue}
   if(f==="lore"||f==="gamereader"||f==="dub"){if(/^https?:\/\//i.test(v))g[f]=v;else if(!v)delete g[f];continue}
   if(f==="dubAuthor"){if(v)g.dubAuthor=v.slice(0,100);else delete g.dubAuthor;continue}
   if(f==="dubStatus"){if(DUBST.includes(v))g.dubStatus=v;else if(!v)delete g.dubStatus;continue}
   if(f==="game"){if(!v)continue;if(!g.id)g.id=keyOf(g);g.game=v;continue}
   if(f==="link"){if(/^https?:\/\//i.test(v))g.link=v;else if(!v&&((d.changes||[]).some(x=>x.field==="pl"&&x.to==="of")||g.pl==="of"))delete g.link;continue}
   if(f==="img"){if(!v)delete g.img;else if(/^(https?:\/\/|img\/)/i.test(v))g.img=v;continue}
   if(f==="premiera"){if(/^\d{4}-\d{2}-\d{2}$/.test(v))g.premiera=v;else if(!v)delete g.premiera;continue}
   if(f==="genre"||f==="opis"){if(v)g[f]=f==="opis"?v.slice(0,500):v;else delete g[f];continue}
   if(f==="type"){if(TYPES.includes(v))g.type=v;continue}
   if(f==="prog"){g.prog=Math.max(0,Math.min(100,+v||0));continue}
   if(v)g[f]=v}
  if(day&&!(d.changes||[]).some(c=>c.field==="upd")&&spUpd(przed,g))g.upd=day;
  if(g._usun)list.splice(list.indexOf(g),1)}
 else if(r.kind==="link"){const g=find(d.key),nl=String(d.newLink||"");if(g&&/^https?:\/\//i.test(nl))g.link=nl}}
// dawne nazwy gatunków (np. z wcześniejszych edycji w panelu, które automat nanosi przy każdym przebiegu) -> obecne
const GENRE_ALIAS={"Survival Horror":"Horror","FPS":"Strzelanka","MMORPG":"RPG","Survival":"Akcja"};
for(const g of list)if(GENRE_ALIAS[g.genre])g.genre=GENRE_ALIAS[g.genre];
const after=JSON.stringify(list,null,2);
if(after===before){console.log("Brak zmian");process.exit(0)}
fs.writeFileSync("spolszczenia.json",after+"\n");console.log("Zaktualizowano spolszczenia.json, wpisów:",list.length);
