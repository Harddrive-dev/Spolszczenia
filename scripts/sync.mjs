// Pobiera zatwierdzone zgłoszenia z Supabase i dopisuje je do spolszczenia.json
import fs from "node:fs";
const URL_="https://qbozpokxgtspwdxvbevv.supabase.co", KEY="sb_publishable_0StDDiTyHHv_ZIW0nh590g_ij3wNMTV";
const slug=t=>String(t).toLowerCase().replace(/ł/g,"l").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const keyOf=g=>g.id||slug(g.game||"");
const res=await fetch(URL_+"/rest/v1/rpc/approved_changes",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json"},body:"{}"});
if(!res.ok){console.error("Błąd Supabase",res.status,await res.text());process.exit(1)}
const rows=await res.json();
const list=JSON.parse(fs.readFileSync("spolszczenia.json","utf8")),before=JSON.stringify(list,null,2);
const TYPES=["Napisy","Pełne","Dubbing"],EDIT=["status","ver","author","genre","link"];
const find=k=>list.find(g=>keyOf(g)===k);
for(const r of rows){const d=r.data||{},day=String(r.created_at||"").slice(0,10);
 if(r.kind==="new"){const name=String(d.game||r.game||"").trim(),link=String(d.link||"");
  if(!name||!/^https?:\/\//i.test(link)||find(slug(name)))continue;
  const e={game:name,platform:d.platform||"PC",type:TYPES.includes(d.type)?d.type:"Napisy",status:d.status||"Gotowe",prog:Math.max(0,Math.min(100,+d.prog||0)),ver:d.ver||"—",author:d.author||"—",link};
  if(d.genre)e.genre=d.genre;e.upd=d.upd||day;list.push(e)}
 else if(r.kind==="edit"){const g=find(d.key);if(!g)continue;
  for(const c of d.changes||[]){if(!EDIT.includes(c.field))continue;const v=String(c.to==null?"":c.to).trim();
   if(c.field==="link"&&!/^https?:\/\//i.test(v))continue;if(c.field==="genre"||v)g[c.field]=v;if(c.field==="genre"&&!v)delete g.genre}
  if(day)g.upd=day}
 else if(r.kind==="link"){const g=find(d.key),nl=String(d.newLink||"");if(g&&/^https?:\/\//i.test(nl))g.link=nl}}
const after=JSON.stringify(list,null,2);
if(after===before){console.log("Brak zmian");process.exit(0)}
fs.writeFileSync("spolszczenia.json",after+"\n");console.log("Zaktualizowano spolszczenia.json, wpisów:",list.length);
