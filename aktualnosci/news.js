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
function loginUrl(){return "/?zaloguj=1&wroc="+encodeURIComponent(location.pathname)}
function plErr(m){m=String(m||"");if(/Zbyt szybko/i.test(m))return "Zbyt szybko, poczekaj chwilę.";if(/Failed to fetch|NetworkError|Load failed/i.test(m))return "Brak połączenia z serwerem.";return m}

// ---- chip użytkownika (taki sam jak na stronie głównej) ----
var USER_ICON='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4.5"/><path d="M3.5 21c0-4.4 3.8-7 8.5-7s8.5 2.6 8.5 7z"/></svg>';
function renderUser(){var c=$("uchip");if(!c)return;var u=me();
  if(!u){c.innerHTML='<a class="ubtn" href="'+esc(loginUrl())+'" style="text-decoration:none"><span class="uav">'+USER_ICON+'</span><span class="unm">Zaloguj się</span></a>';return}
  var n=nick()||"Użytkownik",a=myAvatar(),L=function(h,t){return '<a class="btn" href="'+h+'" style="display:block;text-align:center;margin-bottom:6px">'+t+'</a>'};
  var menu=(myRole?L("/#/dodaj","➕ Dodaj spolszczenie")+L("/#/zgloszenia","📥 Zgłoszenia"):"")+(myRole==="admin"?L("/#/wpisy","📰 Aktualności (wpisy)")+L("/#/moderatorzy","👥 Moderatorzy"):"");
  c.innerHTML='<button class="ubtn" id="ubtn" type="button" aria-haspopup="true"><span class="uav">'+(a?'<img alt="" referrerpolicy="no-referrer" src="'+esc(a)+'" onerror="this.remove()">':esc(n.charAt(0).toUpperCase()))+'</span><span class="unm">'+esc(n)+'</span></button><div class="umenu" id="umenu">'+menu+'<button class="btn" id="ulo" type="button">Wyloguj się</button></div>';
  $("ubtn").onclick=function(e){e.stopPropagation();$("umenu").classList.toggle("open")};
  $("ulo").onclick=function(){sb.auth.signOut()}}
document.addEventListener("click",function(e){var m=$("umenu");if(m&&(!e.target.closest||!e.target.closest("#uchip")))m.classList.remove("open")});
async function loadRole(){myRole=null;if(!sb||!me())return;try{var r=await sb.rpc("my_role");if(!r.error)myRole=r.data||null}catch(e){}renderUser()}

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
var KEY="",armed=null,rows=[],likes=[];
function can(c){var u=me();return !!u&&(c.user_id===u.id||!!myRole)}
function cHtml(c,rep){
  var u=me(),lk=likes.filter(function(l){return l.comment_id===c.id}),mine=!!u&&lk.some(function(l){return l.user_id===u.id});
  return '<div class="cmt'+(rep?' rep':'')+'" data-id="'+c.id+'">'+av(c.avatar_url,c.author)+'<div class="cmain"><div class="cmeta"><b>'+esc(c.author)+'</b>'+(c.is_mod?'<span class="modb">Moderator</span>':'')+' · '+esc(new Date(c.created_at).toLocaleString("pl-PL"))+'</div><div class="cbody">'+esc(c.body)+'</div><div class="act"><button type="button" data-a="like" data-i="'+c.id+'" class="'+(mine?'liked':'')+'">👍 '+lk.length+'</button>'+(rep?'':'<button type="button" data-a="reply" data-i="'+c.id+'">Odpowiedz</button>')+(can(c)?'<button type="button" data-a="del" data-i="'+c.id+'">Usuń</button>':'')+'</div><div class="rform" id="rf'+c.id+'"></div></div></div>'}
function renderList(){
  var byId={};rows.forEach(function(c){byId[c.id]=c});
  function root(c){var n=0;while(c.parent_id&&byId[c.parent_id]&&n++<5)c=byId[c.parent_id];return c}
  var roots=rows.filter(function(c){return !c.parent_id||!byId[c.parent_id]}),rep={};
  rows.forEach(function(c){if(c.parent_id&&byId[c.parent_id]){var r=root(c);(rep[r.id]=rep[r.id]||[]).push(c)}});
  $("ccount").textContent=rows.length;
  $("clist").innerHTML=roots.length?roots.map(function(c){return cHtml(c,false)+(rep[c.id]||[]).map(function(x){return cHtml(x,true)}).join("")}).join(""):'<p class="msg">Brak komentarzy. Bądź pierwszy!</p>'}
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
   :'<p class="msg">Aby komentować, musisz się zalogować.</p><a class="btn pri" href="'+esc(loginUrl())+'">Zaloguj się</a>'}
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
      if(t.id==="csend"){if(await send($("cbody").value,null,$("cmsg"),t)){$("cbody").value="";$("cmsg").textContent="";loadComments()}return}
      var a=t.getAttribute("data-a"),id=+t.getAttribute("data-i");
      if(a==="like"){var u=me();if(!u){location.href=loginUrl();return}
        var has=likes.some(function(l){return l.comment_id===id&&l.user_id===u.id});t.disabled=true;
        var r=has?await sb.from("comment_likes").delete().eq("comment_id",id).eq("user_id",u.id):await sb.from("comment_likes").insert({comment_id:id,user_id:u.id});
        if(r.error){t.disabled=false;alert("Błąd: "+plErr(r.error.message));return}
        if(has)likes=likes.filter(function(l){return !(l.comment_id===id&&l.user_id===u.id)});else likes.push({comment_id:id,user_id:u.id});renderList();return}
      if(a==="reply"){if(!me()){location.href=loginUrl();return}
        var box=$("rf"+id);if(box.innerHTML){box.innerHTML="";return}
        box.innerHTML='<textarea class="t" id="rb'+id+'" maxlength="1000" placeholder="Twoja odpowiedź…" style="min-height:60px"></textarea><p style="margin:6px 0 0"><button class="btn pri" type="button" data-a="rsend" data-i="'+id+'">Wyślij</button> <button class="btn" type="button" data-a="rcancel" data-i="'+id+'">Anuluj</button></p><p class="msg" id="rm'+id+'"></p>';$("rb"+id).focus();return}
      if(a==="rcancel"){$("rf"+id).innerHTML="";return}
      if(a==="rsend"){if(await send($("rb"+id).value,id,$("rm"+id),t))loadComments();return}
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
  sb.auth.onAuthStateChange(function(ev,s){var was=me();session=s;setTimeout(function(){renderUser();loadRole().then(function(){if(pg==="post"&&KEY){renderForm();renderList()}})},0)});
}
boot();
})();
