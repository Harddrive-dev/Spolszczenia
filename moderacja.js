// Narzędzia moderatora (zgłoszenia, dodawanie spolszczeń, moderatorzy).
// Ładowane przez index.html tylko dla zalogowanych moderatorów.
// ====== PANEL MODERATORA: ZGŁOSZENIA ======
var subAll=false;
var KIND={new:"Nowe spolszczenie",edit:"Zmiana",link:"Zepsuty link",bug:"Błąd"};
function subDetails(x){var d=x.data||{},h="";
  if(x.kind==="new")h=["platform","genre","type","status","prog","ver","author","upd","link"].filter(function(k){return d[k]!==""&&d[k]!=null}).map(function(k){return '<div><span class="cvmuted">'+k+':</span> '+(k==="link"?'<a class="vlink" target="_blank" rel="noopener" href="'+esc(safe(d[k]))+'">'+esc(d[k])+'</a>':esc(d[k]))+'</div>'}).join("");
  else if(x.kind==="edit")h=(d.changes||[]).map(function(c){return '<div><span class="cvmuted">'+esc(c.field)+':</span> '+esc(c.from||"—")+' → <b>'+esc(c.to||"—")+'</b></div>'}).join("");
  else if(x.kind==="link")h=d.newLink?'<div><span class="cvmuted">nowy link:</span> <a class="vlink" target="_blank" rel="noopener" href="'+esc(safe(d.newLink))+'">'+esc(d.newLink)+'</a></div>':"";
  if(d.currentLink&&x.kind!=="new")h+='<div><span class="cvmuted">obecny link:</span> '+esc(d.currentLink)+'</div>';
  return h}
async function openSubs(){
  if(!CM||!isMod())return;curKey=null;openModal('<h2>Zgłoszenia</h2><p class="msg">Wczytywanie…</p>');
  try{
    var q=sb.from("submissions").select("*").order("created_at",{ascending:false}).limit(100);if(!subAll)q=q.eq("status","new");
    var r=await q;if(r.error)throw r.error;
    $("mbody").innerHTML='<h2>Zgłoszenia</h2><p class="btns" style="justify-content:flex-start"><button class="btn'+(subAll?'':' on')+'" data-subf="new">Nowe</button><button class="btn'+(subAll?' on':'')+'" data-subf="all">Wszystkie</button></p>'+
     (r.data.length?r.data.map(function(x){return '<div class="sub"><div class="subh"><span class="modb" style="margin:0">'+esc(KIND[x.kind]||x.kind)+'</span> <b>'+esc(x.game)+'</b>'+(x.status!=="new"?' <span class="cvmuted">('+(x.status==="done"?"załatwione":"odrzucone")+')</span>':'')+'</div><div class="cvmuted">'+esc(x.user_name||"—")+' · '+esc(new Date(x.created_at).toLocaleString("pl-PL"))+'</div><div class="subd">'+subDetails(x)+(x.note?'<div><span class="cvmuted">opis:</span> '+esc(x.note)+'</div>':"")+'</div><div class="btns" style="justify-content:flex-start;margin-top:6px">'+(x.kind==="new"?'<button class="mini" data-subjson="'+x.id+'">Kopiuj JSON</button>':"")+(x.status==="new"?'<button class="mini" data-subset="done" data-id="'+x.id+'">'+(x.kind==="bug"?"Załatwione":"Zatwierdź i dodaj na stronę")+'</button><button class="mini" data-subset="rejected" data-id="'+x.id+'">Odrzuć</button>':'<button class="mini" data-subdel="'+x.id+'">Usuń</button>')+'</div></div>'}).join(""):'<p class="msg">Brak zgłoszeń.</p>');
    window.__subs=r.data;loadSubCount();
  }catch(e){$("mbody").innerHTML='<h2>Zgłoszenia</h2><p class="msg err">Nie udało się wczytać zgłoszeń (czy uruchomiłeś zgloszenia.sql w Supabase?).</p>'}}
document.addEventListener("click",async function(e){var t=e.target.closest&&e.target.closest("button");if(!t)return;
  if(t.id==="umod"){$("umenu").className="umenu";openSubs();return}
  if(t.getAttribute("data-subf")){subAll=t.getAttribute("data-subf")==="all";openSubs();return}
  if(t.getAttribute("data-subset")){await sb.from("submissions").update({status:t.getAttribute("data-subset")}).eq("id",t.getAttribute("data-id"));openSubs();loadSubCount();loadCatalog();return}
  if(t.getAttribute("data-subdel")){await sb.from("submissions").delete().eq("id",t.getAttribute("data-subdel"));openSubs();loadSubCount();loadCatalog();return}
  if(t.getAttribute("data-subjson")){var x=(window.__subs||[]).filter(function(y){return String(y.id)===t.getAttribute("data-subjson")})[0];if(!x)return;var d=x.data||{},o={game:d.game||x.game};
    ["platform","genre","type","status","prog","ver","author","upd","link"].forEach(function(k){if(d[k]!==""&&d[k]!=null)o[k]=d[k]});
    try{await navigator.clipboard.writeText(JSON.stringify(o,null,2));t.textContent="Skopiowano ✓"}catch(err){t.textContent="Nie udało się"}}
});

// ====== DODAWANIE SPOLSZCZEŃ NA STRONIE (moderator / administrator) ======
var GENRES=["RPG","Przygodowa","Horror","Akcja / platformówka","Strzelanka","Strategia","Symulacja","Sportowa / wyścigi","Bijatyka"];
function addMem(k,v){try{if(v===undefined)return localStorage.getItem("add."+k)||"";localStorage.setItem("add."+k,v)}catch(e){return ""}}
function openAdd(){
  if(!CM||!isMod())return;curKey=null;
  var opt=function(a,sel){return a.map(function(x){return '<option'+(x===sel?' selected':'')+'>'+esc(x)+'</option>'}).join("")};
  openModal('<h2>Dodaj spolszczenie</h2><p class="msg">Wpis pojawi się na stronie od razu, a w pliku <code>spolszczenia.json</code> do ok. 30 minut. Pola z * są wymagane.</p>'+
   '<div class="rpf">'+
   '<label style="grid-column:1/-1">Gra *<input id="a_game" maxlength="150" autocomplete="off"></label>'+
   '<label>Platforma<input id="a_platform" list="a_plist" maxlength="60" value="'+esc(addMem("platform")||"PC")+'"><datalist id="a_plist"><option>PC</option><option>PC Steam</option><option>PlayStation</option><option>Nintendo Switch</option><option>Xbox</option><option>Nintendo 64</option><option>SNES</option><option>PC emu</option></datalist></label>'+
   '<label>Gatunek<select id="a_genre"><option value="">— brak —</option>'+opt(GENRES,"")+'</select></label>'+
   '<label>Zakres<select id="a_type">'+opt(["Napisy","Pełne","Dubbing"],addMem("type")||"Napisy")+'</select></label>'+
   '<label>Status<select id="a_status">'+opt(["Gotowe","W toku","Wstrzymane"],addMem("status")||"Gotowe")+'</select></label>'+
   '<label>Postęp (%)<input id="a_prog" type="number" min="0" max="100" value="100"></label>'+
   '<label>Wersja<input id="a_ver" maxlength="40"></label>'+
   '<label style="grid-column:1/-1">Autor / grupa<input id="a_author" maxlength="100" value="'+esc(addMem("author"))+'"></label>'+
   '<label style="grid-column:1/-1">Link do spolszczenia lub artykułu * (https://…)<input id="a_link" type="url" maxlength="500"></label>'+
   '<label style="grid-column:1/-1">Adres okładki (opcjonalnie: https://… lub img/nazwa.jpg)<input id="a_img" maxlength="500"><small class="cvmuted" style="display:block;margin-top:4px;line-height:1.4">Skąd wziąć: wejdź na <a href="https://www.steamgriddb.com/" target="_blank" rel="noopener">steamgriddb.com</a>, wyszukaj grę i otwórz zakładkę „Grids”. Kliknij wybraną okładkę prawym przyciskiem myszy i wybierz „Kopiuj adres obrazu”, a potem wklej go tutaj. Zwykle są to adresy zaczynające się od <code>https://cdn2.steamgriddb.com/…</code></small></label>'+
   '<label style="grid-column:1/-1">Opis (opcjonalnie)<textarea id="a_opis" rows="2" maxlength="500" style="width:100%;display:block"></textarea></label>'+
   '</div><p class="msg" id="a_msg"></p><p class="btns" style="justify-content:flex-start"><button class="btn on" type="button" id="a_go">Dodaj do katalogu</button><button class="btn" type="button" id="a_close">Zamknij</button></p>');
  setTimeout(function(){var g=$("a_game");if(g)g.focus()},50)}
document.addEventListener("click",async function(e){var t=e.target.closest&&e.target.closest("button");if(!t)return;
  if(t.id==="uadd"){$("umenu").className="umenu";openAdd();return}
  if(t.id==="a_close"){closeModal();return}
  if(t.id!=="a_go")return;
  var v=function(i){return $(i).value.trim()},m=$("a_msg"),bad=function(x){m.textContent=x;m.className="msg err"};
  var game=v("a_game"),link=v("a_link"),img=v("a_img");
  if(!game)return bad("Podaj nazwę gry.");
  if(!/^https?:\/\//i.test(link))return bad("Podaj poprawny link zaczynający się od https://");
  if(img&&!/^(https?:\/\/|img\/)/i.test(img))return bad("Okładka musi zaczynać się od https:// albo img/");
  if(items.some(function(g){return slug(g.game)===slug(game)}))return bad("Gra „"+game+"” jest już w katalogu.");
  var data={game:game,platform:v("a_platform")||"PC",type:v("a_type"),status:v("a_status"),prog:Math.max(0,Math.min(100,+v("a_prog")||0)),ver:v("a_ver")||"—",author:v("a_author")||"—",link:link,upd:new Date().toISOString().slice(0,10)};
  if(v("a_genre"))data.genre=v("a_genre");if(img)data.img=img;if(v("a_opis"))data.opis=v("a_opis");
  busy(t,"Dodaję…");
  var res=await sb.from("submissions").insert({kind:"new",game:game,data:data,status:"done",user_name:nick()||null});
  busy(t,0);
  if(res.error)return bad("Nie udało się dodać: "+plMsg(res.error.message)+" (czy uruchomiłeś dodawanie-na-stronie.sql w Supabase?)");
  addMem("platform",data.platform);addMem("type",data.type);addMem("status",data.status);addMem("author",data.author==="—"?"":data.author);
  ["a_game","a_ver","a_link","a_img","a_opis"].forEach(function(i){$(i).value=""});$("a_prog").value=100;
  m.textContent="Dodano: "+game+". Możesz wpisać kolejne.";m.className="msg ok";$("a_game").focus();
  loadCatalog()});
// ====== ZARZĄDZANIE MODERATORAMI ======
async function openMods(){
  if(!CM||!isAdmin())return;curKey=null;openModal('<h2>Moderatorzy</h2><p class="msg">Wczytywanie…</p>');
  try{var r=await sb.from("moderators").select("email,role,added_at").order("added_at",{ascending:true});if(r.error)throw r.error;
    $("mbody").innerHTML='<h2>Moderatorzy</h2><p class="msg">Moderator widzi panel „Zgłoszenia", zatwierdza zgłoszenia i usuwa komentarze. Osoba musi logować się kontem z podanym adresem e-mail.</p>'+
     r.data.map(function(m){var owner=m.email.toLowerCase()===String(ADMIN_EMAIL).toLowerCase();return '<div class="sub" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b style="flex:1;min-width:0;overflow-wrap:anywhere">'+esc(m.email)+'</b><span class="modb" style="margin:0">'+(m.role==="admin"?"Administrator":"Moderator")+'</span>'+(owner?'<span class="cvmuted">właściciel</span>':'<button class="mini" data-modrm="'+esc(m.email)+'">Usuń</button>')+'</div>'}).join("")+
     '<h3 style="margin:16px 0 6px;font-size:16px">Dodaj moderatora</h3><div class="rpf"><label style="grid-column:1/-1">Adres e-mail konta<input id="mod_email" type="email" maxlength="200" placeholder="Zacznij pisać e-mail lub nazwę…" autocomplete="off"><div id="mod_sug" class="usug"></div></label><label>Rola<select id="mod_role"><option value="mod">Moderator</option><option value="admin">Administrator (może dodawać innych)</option></select></label></div><p class="btns" style="justify-content:flex-start"><button class="btn on" id="mod_add" type="button">Dodaj</button></p><p class="msg" id="modmsg"></p>'
  }catch(e){$("mbody").innerHTML='<h2>Moderatorzy</h2><p class="msg err">Nie udało się wczytać listy (czy uruchomiłeś moderatorzy.sql w Supabase?).</p>'}}
document.addEventListener("click",async function(e){var t=e.target.closest&&e.target.closest("button");if(!t)return;
  if(t.getAttribute("data-sug")){$("mod_email").value=t.getAttribute("data-sug");$("mod_sug").className="usug";return}
  if(t.id==="umods"){$("umenu").className="umenu";openMods();return}
  if(t.id==="mod_add"){var em=$("mod_email").value.trim().toLowerCase(),msg=$("modmsg");
    if(!/^\S+@\S+\.\S+$/.test(em)){msg.textContent="Podaj poprawny adres e-mail.";msg.className="msg err";return}
    var r=await sb.from("moderators").upsert({email:em,role:$("mod_role").value},{onConflict:"email"});
    if(r.error){msg.textContent="Nie udało się dodać: "+plMsg(r.error.message);msg.className="msg err";return}openMods();return}
  if(t.getAttribute("data-modrm")){if(!confirm("Usunąć uprawnienia tej osoby?"))return;var d=await sb.from("moderators").delete().eq("email",t.getAttribute("data-modrm"));if(d.error)alert("Błąd: "+d.error.message);openMods()}
});
var sugT=null;
document.addEventListener("input",function(e){if(!e.target||e.target.id!=="mod_email")return;
  var q=e.target.value.trim(),box=$("mod_sug");clearTimeout(sugT);
  if(q.length<2){box.className="usug";return}
  sugT=setTimeout(async function(){
    try{var r=await sb.rpc("search_users",{q:q});if(r.error)throw r.error;
      if($("mod_email").value.trim()!==q)return;
      if(!r.data||!r.data.length){box.innerHTML='<small style="display:block;padding:8px 10px;color:var(--muted)">Nie znaleziono – ta osoba musi się najpierw zalogować na stronie.</small>';box.className="usug open";return}
      box.innerHTML=r.data.map(function(u){var av=u.avatar?'<img alt="" src="'+esc(u.avatar)+'">':'<i>'+esc((u.name||u.email||"?").charAt(0).toUpperCase())+'</i>';
        return '<button type="button" data-sug="'+esc(u.email)+'">'+av+'<span>'+esc(u.name||u.email)+(u.name?'<small>'+esc(u.email)+'</small>':'')+'</span></button>'}).join("");box.className="usug open"
    }catch(err){box.className="usug"}},250)});
