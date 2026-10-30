// Jednorazowy import: wczytuje import-lektor.json, dopisuje gry do spolszczenia.json
// (nie nadpisuje istniejących wpisów - tylko uzupełnia brakujące pola), po czym usuwa plik importu.
import fs from "node:fs";
const F="import-lektor.json";
if(!fs.existsSync(F)){console.log("Brak pliku importu - pomijam.");process.exit(0);}
const imp=JSON.parse(fs.readFileSync(F,"utf8"));
const list=JSON.parse(fs.readFileSync("spolszczenia.json","utf8"));
const norm=s=>String(s).toLowerCase().replace(/\[.*?\]|\(.*?\)/g,"").replace(/[^a-z0-9]/g,"");
const map=new Map();for(const g of list){const k=norm(g.game);if(!map.has(k))map.set(k,g);}
let add=0,upd=0;
for(const e of imp){
  const k=norm(e.game),g=map.get(k);
  if(g){let ch=false;
    if(e.popraw&&typeof e.popraw==="object"){for(const [f,v] of Object.entries(e.popraw)){if(v===null)delete g[f];else g[f]=v;}ch=true;}
    for(const f of ["lore","gamereader","yt","ytt","img","genre","opis"]) if(e[f]&&!g[f]){g[f]=e[f];ch=true;}
    if(ch)upd++;
  }else{list.push(e);map.set(k,e);add++;}
}
fs.writeFileSync("spolszczenia.json",JSON.stringify(list,null,2)+"\n");
fs.unlinkSync(F);
console.log("Import: dodano",add,"gier, uzupełniono",upd,"wpisów.");
