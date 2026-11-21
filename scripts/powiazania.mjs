// Łączy wpisy z Aktualności z grami z katalogu: szuka nazwy gry w tytule wpisu.
// Używane przez news.mjs (ramka „Gra z tego wpisu”) i gry.mjs (sekcja „Wiadomości o tej grze”).
export const slug=t=>String(t).toLowerCase().replace(/ł/g,"l").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

// Liczby rzymskie jako osobne słowa (II–XX) -> arabskie, np. „grand-theft-auto-vi” = „grand-theft-auto-6”.
const RZ={ii:2,iii:3,iv:4,v:5,vi:6,vii:7,viii:8,ix:9,x:10,xi:11,xii:12,xiii:13,xiv:14,xv:15,xvi:16,xvii:17,xviii:18,xix:19,xx:20};
const arab=s=>s.split("-").map(w=>RZ[w]?String(RZ[w]):w).join("-");

// Nazwy, pod którymi gra może wystąpić w tytule: pełna nazwa (z liczbą arabską) oraz skrót
// z pierwszych liter + numer, gdy nazwa ma co najmniej 3 słowa i kończy się numerem
// (np. „Grand Theft Auto VI” -> „gta-6”, „Red Dead Redemption 2” -> „rdr-2”).
function nazwy(game){
  const s=arab(slug(game)),out=[s];
  let w=s.split("-");if(w[0]==="the"&&w.length>3)w=w.slice(1);
  const nr=w[w.length-1],slowa=w.slice(0,-1);
  if(/^\d+$/.test(nr)&&slowa.length>=3&&slowa.every(x=>/^[a-z]/.test(x)))out.push(slowa.map(x=>x[0]).join("")+"-"+nr);
  return out;
}

// Zwraca do 3 gier, których nazwa występuje w tytule (całymi słowami).
// Jednowyrazowe nazwy muszą mieć co najmniej 5 znaków, a krótsze dopasowania
// zawarte w dłuższym (np. „World of Warcraft” w „World of Warcraft: Forever”) są pomijane.
export function gryWTytule(title,list){
  const t="-"+arab(slug(title))+"-",found=[];
  for(const g of list){
    if(!g||!g.game)continue;const n=nazwy(g.game),a=n[0];if(!a)continue;
    if(!a.includes("-")&&a.length<5)continue;
    // s = zwykły adres gry (klucz w powiazania.json, tak jak szuka go gry.mjs), a = wersja z liczbą arabską do porównań
    if(n.some(x=>t.includes("-"+x+"-")))found.push({s:slug(g.game),a,g});
  }
  const uniq=[...new Map(found.map(x=>[x.s,x])).values()];
  return uniq.filter(x=>!uniq.some(y=>y!==x&&y.a.length>x.a.length&&("-"+y.a+"-").includes("-"+x.a+"-"))).slice(0,3);
}
