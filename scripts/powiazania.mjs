// Łączy wpisy z Aktualności z grami z katalogu: szuka pełnej nazwy gry w tytule wpisu.
// Używane przez news.mjs (ramka „Gra z tego wpisu”) i gry.mjs (sekcja „Wiadomości o tej grze”).
export const slug=t=>String(t).toLowerCase().replace(/ł/g,"l").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

// Zwraca do 3 gier, których pełna nazwa występuje w tytule (całymi słowami).
// Jednowyrazowe nazwy muszą mieć co najmniej 5 znaków, a krótsze dopasowania
// zawarte w dłuższym (np. „World of Warcraft” w „World of Warcraft: Forever”) są pomijane.
export function gryWTytule(title,list){
  const t="-"+slug(title)+"-",found=[];
  for(const g of list){
    const s=g&&g.game?slug(g.game):"";if(!s)continue;
    if(!s.includes("-")&&s.length<5)continue;
    if(t.includes("-"+s+"-"))found.push({s,g});
  }
  const uniq=[...new Map(found.map(x=>[x.s,x])).values()];
  return uniq.filter(x=>!uniq.some(y=>y!==x&&y.s.length>x.s.length&&("-"+y.s+"-").includes("-"+x.s+"-"))).slice(0,3);
}
