// Skrypt stron Aktualności: logowanie (wspólna sesja z główną stroną), filtr listy, komentarze, odpowiedzi i polubienia.
(function(){
var SB_URL="https://qbozpokxgtspwdxvbevv.supabase.co",SB_KEY="sb_publishable_0StDDiTyHHv_ZIW0nh590g_ij3wNMTV";
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
var sb=null,session=null,myRole=null;
try{if(window.supabase)sb=window.supabase.createClient(SB_URL,SB_KEY)}catch(e){sb=null}
function me(){return session&&session.user?session.user:null}
function nick(){var u=me(),m=(u&&u.user_metadata)||{},cc=m.custom_claims||{};
  var n=m.nick||cc.global_name||m.full_name||m.name||m.user_name||m.preferred_username||(u&&u.email?u.email.split("@")[0]:"");
  return String(n).trim().slice(0,30)}
function myAvatar(){var u=me(),m=(u&&u.user_metadata)||{},a=m.avatar_url||m.picture||"";return /^https:\/\//i.test(a)&&a.length<=500?a:null}
function hue(n){var h=0;String(n||"?").split("").forEach(function(c){h=(h*31+c.charCodeAt(0))%360});return h}
function av(url,name){var l=esc(String(name||"?").charAt(0).toUpperCase());
  return '<span class="cav" style="background:hsl('+hue(name)+',70%,70%)">'+(/^https:\/\//i.test(url||"")?'<img alt="" loading="lazy" referrerpolicy="no-referrer" src="'+esc(url)+'" onerror="this.remove()">':l)+'</span>'}
function loginUrl(mode){return "/?zaloguj=1"+(mode?"&tryb="+mode:"")+"&wroc="+encodeURIComponent(location.pathname)}
function plErr(m){m=String(m||"");if(/Zbyt szybko/i.test(m))return "Zbyt szybko, poczekaj chwilę.";if(/Failed to fetch|NetworkError|Load failed/i.test(m))return "Brak połączenia z serwerem.";return m}

// ---- chip użytkownika (taki sam jak na stronie głównej) ----
var USER_ICON='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4.5"/><path d="M3.5 21c0-4.4 3.8-7 8.5-7s8.5 2.6 8.5 7z"/></svg>';
function renderUser(){var c=$("uchip");if(!c)return;var u=me();
  if(!u){c.innerHTML='<button class="ubtn" id="ulogin" type="button"><span class="uav">'+USER_ICON+'</span><span class="unm">Zaloguj się</span></button>';$("ulogin").onclick=openLogin;return}
  var n=nick()||"Użytkownik",a=myAvatar(),L=function(h,t){return '<a class="btn" href="'+h+'" style="display:block;text-align:center;margin-bottom:6px">'+t+'</a>'};
  var menu=(myRole?L("/#/dodaj","➕ Dodaj spolszczenie")+L("/#/zgloszenia","📥 Zgłoszenia"):"")+(myRole==="admin"?L("/#/wpisy","📰 Aktualności (wpisy)")+L("/#/moderatorzy","👥 Moderatorzy"):"");
  c.innerHTML='<button class="ubtn" id="ubtn" type="button" aria-haspopup="true"><span class="uav">'+(a?'<img alt="" referrerpolicy="no-referrer" src="'+esc(a)+'" onerror="this.remove()">':esc(n.charAt(0).toUpperCase()))+'</span><span class="unm">'+esc(n)+'</span></button><div class="umenu" id="umenu">'+menu+'<button class="btn" id="ulo" type="button">Wyloguj się</button></div>';
  $("ubtn").onclick=function(e){e.stopPropagation();$("umenu").classList.toggle("open")};
  $("ulo").onclick=function(){sb.auth.signOut()}}
document.addEventListener("click",function(e){var m=$("umenu");if(m&&(!e.target.closest||!e.target.closest("#uchip")))m.classList.remove("open")});
async function loadRole(){myRole=null;if(!sb||!me())return;try{var r=await sb.rpc("my_role");if(!r.error)myRole=r.data||null}catch(e){}renderUser()}

// ---- okienko logowania (bez opuszczania strony) ----
var PICON={
discord:'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path fill="#5865F2" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>',
google:'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 01-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3a7.2 7.2 0 01-10.7-3.78H1.37v3.1A12 12 0 0012 24z"/><path fill="#FBBC05" d="M5.36 14.31a7.2 7.2 0 010-4.62v-3.1H1.37a12 12 0 000 10.82l3.99-3.1z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.5 11.5 0 0012 0 12 12 0 001.37 6.59l3.99 3.1A7.2 7.2 0 0112 4.75z"/></svg>'};
var TS_KEY="0x4AAAAAAFlm4-HEqU2giO-W",tsTok="",tsId=null,tsLoading=false;
function remember(){try{sessionStorage.setItem("wroc",JSON.stringify({w:location.pathname,t:Date.now()}))}catch(e){}}
function ensureModal(){if($("cm"))return;
  var d=document.createElement("div");d.className="overlay";d.id="cm";d.innerHTML='<div class="box"><button class="mini" id="mclose" type="button" aria-label="Zamknij">✕</button><div id="mbody"></div></div>';document.body.appendChild(d);
  $("mclose").onclick=closeModal;
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeModal();
    if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing&&$("cm").classList.contains("open")&&e.target&&e.target.tagName==="INPUT"){var b=$("lsend");if(b){e.preventDefault();b.click()}}})}
function closeModal(){var m=$("cm");if(m)m.className="overlay"}
function mountCaptcha(n){var el=$("cft");tsTok="";tsId=null;if(!el)return;
  if(!window.turnstile){if(!tsLoading){tsLoading=true;var s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";s.async=true;document.head.appendChild(s)}
    if((n||0)<40)setTimeout(function(){mountCaptcha((n||0)+1)},300);return}
  try{tsId=turnstile.render(el,{sitekey:TS_KEY,theme:"dark",language:"pl",callback:function(t){tsTok=t},"expired-callback":function(){tsTok=""},"error-callback":function(){tsTok=""}})}catch(e){tsId=null}}
function resetCaptcha(){tsTok="";try{if(window.turnstile&&tsId!==null)turnstile.reset(tsId)}catch(e){}}
function lmsg(t,err){var m=$("lmsg");if(m){m.textContent=t;m.className="msg"+(err?" err":"")}}
function openLogin(){
  if(!sb)return alert("Logowanie jest chwilowo niedostępne.");
  ensureModal();
  var prov=[["discord","Discord"],["google","Google"]].map(function(x){return '<button class="btn" type="button" data-oauth="'+x[0]+'" style="display:inline-flex;align-items:center;gap:8px">'+(PICON[x[0]]||"")+'Kontynuuj przez '+x[1]+'</button>'}).join(" ");
  $("mbody").innerHTML='<h2>Logowanie</h2><div class="lgrid"><label>Adres e-mail<input type="email" id="lemail" maxlength="200" autocomplete="email"></label><label>Hasło<input type="password" id="lpass" maxlength="72" autocomplete="current-password"></label></div><div id="cft" style="margin-top:10px"></div>'+
   '<p class="lbtns"><button class="btn pri" id="lsend" type="button">Zaloguj się</button></p><p class="msg" id="lmsg"></p>'+
   '<p class="msg"><a class="linkb" href="'+esc(loginUrl("forgot"))+'">Nie pamiętam hasła</a> · <a class="linkb" href="'+esc(loginUrl("reg"))+'">Załóż konto</a></p>'+
   '<div class="orsep"><span>lub</span></div><div class="lbtns" style="margin-top:0">'+prov+'</div>';
  $("cm").className="overlay open";mountCaptcha();var e=$("lemail");if(e)e.focus()}
document.addEventListener("click",async function(ev){
  var t=ev.target.closest&&ev.target.closest("button");if(!t||!sb)return;
  try{
    if(t.getAttribute("data-oauth")){remember();var o=await sb.auth.signInWithOAuth({provider:t.getAttribute("data-oauth"),options:{redirectTo:location.origin+location.pathname}});if(o.error)lmsg(o.error.message,1);return}
    if(t.id==="lsend"){
      var em=$("lemail").value.trim(),pw=$("lpass").value;
      if(!/^\S+@\S+\.\S+$/.test(em))return lmsg("Podaj poprawny adres e-mail.",1);if(!pw)return lmsg("Podaj hasło.",1);
      if(window.turnstile&&tsId!==null&&!tsTok)return lmsg("Poczekaj chwilę na weryfikację zabezpieczeń i spróbuj ponownie.",1);
      t.disabled=true;t.classList.add("busy");var r=await sb.auth.signInWithPassword({email:em,password:pw,options:{captchaToken:tsTok||undefined}});t.disabled=false;t.classList.remove("busy");resetCaptcha();
      if(r.error)return lmsg(/Email not confirmed/i.test(r.error.message)?"Najpierw potwierdź adres e-mail (link w mailu).":/Invalid login/i.test(r.error.message)?"Nieprawidłowy e-mail lub hasło.":/captcha/i.test(r.error.message)?"Weryfikacja zabezpieczeń nie powiodła się. Odśwież stronę i spróbuj ponownie.":"Nie udało się zalogować: "+plErr(r.error.message),1);
      closeModal()}
  }catch(e){lmsg("Błąd: "+((e&&e.message)||e),1)}});

// ---- lista ----
function initList(){
  var q=$("q"),chips=document.querySelectorAll(".chip"),cat="";
  function apply(){var s=(q.value||"").toLowerCase().trim(),n=0,els=document.querySelectorAll("[data-t]");
    els.forEach(function(el){var ok=(!cat||el.getAttribute("data-c")===cat)&&(!s||el.getAttribute("data-t").indexOf(s)>-1);el.classList.toggle("h",!ok);if(ok)n++});
    $("empty").style.display=n?"none":""}
  q.addEventListener("input",apply);
  chips.forEach(function(c){c.onclick=function(){cat=c.getAttribute("data-c")||"";chips.forEach(function(x){x.classList.toggle("on",x===c)});apply()}});
  if(!sb)return;
  sb.from("comments").select("game_key").like("game_key","news:%").limit(2000).then(function(r){
    if(r.error)return;var c={};r.data.forEach(function(x){c[x.game_key]=(c[x.game_key]||0)+1});
    document.querySelectorAll("[data-cnt]").forEach(function(el){var n=c["news:"+el.getAttribute("data-cnt")]||0;el.textContent="💬 "+n})},function(){})}

// ---- komentarze ----
var KEY="",armed=null,rows=[],likes=[],openT={},drafts={};
function can(c){var u=me();return !!u&&(c.user_id===u.id||!!myRole)}
function cHtml(c,rep,n){
  var u=me(),lk=likes.filter(function(l){return l.comment_id===c.id}),mine=!!u&&lk.some(function(l){return l.user_id===u.id});
  var tb=rep?'':'<button type="button" data-a="thread" data-i="'+c.id+'">'+(n?'Odpowiedzi ('+n+') '+(openT[c.id]?'▴':'▾'):'Odpowiedz')+'</button>';
  return '<div class="cmt'+(rep?' rep':'')+'" data-id="'+c.id+'">'+av(c.avatar_url,c.author)+'<div class="cmain"><div class="cmeta"><b>'+esc(c.author)+'</b>'+(c.is_mod?'<span class="modb">Moderator</span>':'')+' · '+esc(new Date(c.created_at).toLocaleString("pl-PL"))+'</div><div class="cbody">'+esc(c.body)+'</div><div class="act"><button type="button" data-a="like" data-i="'+c.id+'" class="'+(mine?'liked':'')+'">👍 '+lk.length+'</button>'+tb+(can(c)?'<button type="button" data-a="del" data-i="'+c.id+'">Usuń</button>':'')+'</div></div></div>'}
function threadHtml(c,reps){
  var form=me()?'<div class="rform"><textarea class="t" id="rb'+c.id+'" maxlength="1000" placeholder="Twoja odpowiedź…" style="min-height:60px"></textarea><p style="margin:6px 0 0"><button class="btn pri" type="button" data-a="rsend" data-i="'+c.id+'">Wyślij odpowiedź</button></p><p class="msg" id="rm'+c.id+'"></p></div>'
    :'<div class="rform"><p class="msg">Aby odpowiedzieć, <button class="linkb" type="button" data-a="login">zaloguj się</button>.</p></div>';
  return '<div class="thread" id="th'+c.id+'"'+(openT[c.id]?'':' hidden')+'>'+reps.map(function(x){return cHtml(x,true)}).join("")+form+'</div>'}
function renderList(){
  document.querySelectorAll("textarea[id^=rb]").forEach(function(t){drafts[t.id]=t.value});
  var byId={};rows.forEach(function(c){byId[c.id]=c});
  function root(c){var n=0;while(c.parent_id&&byId[c.parent_id]&&n++<5)c=byId[c.parent_id];return c}
  var roots=rows.filter(function(c){return !c.parent_id||!byId[c.parent_id]}),rep={};
  rows.forEach(function(c){if(c.parent_id&&byId[c.parent_id]){var r=root(c);(rep[r.id]=rep[r.id]||[]).push(c)}});
  $("ccount").textContent=rows.length;
  $("clist").innerHTML=roots.length?roots.map(function(c){var rs=rep[c.id]||[];return cHtml(c,false,rs.length)+threadHtml(c,rs)}).join(""):'<p class="msg">Brak komentarzy. Bądź pierwszy!</p>';
  Object.keys(drafts).forEach(function(k){var t=$(k);if(t&&drafts[k])t.value=drafts[k]})}
async function loadComments(){
  try{
    var cols="id,user_id,author,body,created_at,avatar_url,is_mod,parent_id";
    var r=await sb.from("comments").select(cols).eq("game_key",KEY).order("created_at",{ascending:true}).limit(500);
    if(r.error)r=await sb.from("comments").select("id,user_id,author,body,created_at").eq("game_key",KEY).order("created_at",{ascending:true}).limit(500);
    if(r.error)throw r.error;rows=r.data;likes=[];
    if(rows.length){var l=await sb.from("comment_likes").select("comment_id,user_id").in("comment_id",rows.map(function(c){return c.id})).limit(5000);if(!l.error)likes=l.data}
    renderList()}catch(e){$("clist").innerHTML='<p class="msg err">Nie udało się wczytać komentarzy.</p>'}}
function renderForm(){var f=$("cform");
  f.innerHTML=me()?'<div class="cform">'+av(myAvatar(),nick())+'<div class="cin"><div class="cwho">Komentujesz jako <b>'+esc(nick())+'</b></div><textarea class="t" id="cbody" maxlength="1000" placeholder="Twój komentarz…"></textarea><p style="margin:8px 0 0"><button class="btn pri" id="csend" type="button">Dodaj komentarz</button></p><p class="msg" id="cmsg"></p></div></div>'
   :'<p class="msg">Aby komentować, musisz się zalogować.</p><button class="btn pri" id="cgologin" type="button">Zaloguj się</button>'}
async function send(body,parent,msgEl,btn){
  var u=me();if(!u)return;var n=nick();body=body.trim();
  if(!body){msgEl.textContent="Napisz komentarz.";msgEl.className="msg err";return}
  btn.disabled=true;btn.classList.add("busy");
  var row={game_key:KEY,user_id:u.id,author:n,body:body},a=myAvatar();if(a)row.avatar_url=a;if(parent)row.parent_id=parent;
  var w=await sb.from("comments").insert(row);
  if(w.error&&a&&/avatar_url|column/i.test(w.error.message)){delete row.avatar_url;w=await sb.from("comments").insert(row)}
  btn.disabled=false;btn.classList.remove("busy");
  if(w.error){msgEl.textContent=/parent_id/.test(w.error.message)?"Odpowiedzi nie są jeszcze włączone (uruchom aktualnosci.sql).":"Nie udało się dodać: "+plErr(w.error.message);msgEl.className="msg err";return}
  return true}
function initPost(){
  KEY=document.body.getAttribute("data-key")||"";
  if(!sb){$("clist").innerHTML='<p class="msg">Komentarze są chwilowo niedostępne.</p>';return}
  renderForm();loadComments();
  document.addEventListener("click",async function(ev){
    var t=ev.target.closest&&ev.target.closest("button");if(!t)return;
    try{
      if(t.id==="cgologin"){openLogin();return}
      if(t.id==="csend"){if(await send($("cbody").value,null,$("cmsg"),t)){$("cbody").value="";$("cmsg").textContent="";loadComments()}return}
      var a=t.getAttribute("data-a"),id=+t.getAttribute("data-i");
      if(a==="like"){var u=me();if(!u){openLogin();return}
        var has=likes.some(function(l){return l.comment_id===id&&l.user_id===u.id});t.disabled=true;
        var r=has?await sb.from("comment_likes").delete().eq("comment_id",id).eq("user_id",u.id):await sb.from("comment_likes").insert({comment_id:id,user_id:u.id});
        if(r.error){t.disabled=false;alert("Błąd: "+plErr(r.error.message));return}
        if(has)likes=likes.filter(function(l){return !(l.comment_id===id&&l.user_id===u.id)});else likes.push({comment_id:id,user_id:u.id});renderList();return}
      if(a==="login"){openLogin();return}
      if(a==="thread"){openT[id]=!openT[id];renderList();if(openT[id]){var tx=$("rb"+id);if(tx)tx.focus()}return}
      if(a==="rsend"){var okk=await send($("rb"+id).value,id,$("rm"+id),t);if(okk){$("rb"+id).value="";drafts["rb"+id]="";openT[id]=true;loadComments()}return}
      if(a==="del"){
        if(armed!==id){armed=id;t.textContent="Na pewno?";setTimeout(function(){if(armed===id){armed=null;t.textContent="Usuń"}},3000);return}
        armed=null;var d=await sb.from("comments").delete().eq("id",id);if(d.error)alert("Błąd: "+plErr(d.error.message));else loadComments()}
    }catch(e){alert("Błąd: "+((e&&e.message)||e))}});
  }

function boot(){
  var pg=document.body.getAttribute("data-page");
  if(pg==="list")initList();
  if(!sb){renderUser();if(pg==="post")initPost();return}
  sb.auth.getSession().then(function(r){session=r.data.session;renderUser();return loadRole()}).then(function(){if(pg==="post"){initPost()}else renderUser()},function(){renderUser();if(pg==="post")initPost()});
  sb.auth.onAuthStateChange(function(ev,s){var was=me();session=s;if(s&&s.user){try{sessionStorage.removeItem("wroc")}catch(e){}}setTimeout(function(){renderUser();loadRole().then(function(){if(pg==="post"&&KEY){renderForm();renderList()}})},0)});
}
boot();
})();
