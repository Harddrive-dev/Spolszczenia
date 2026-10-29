// ====== DEKORACJE HALLOWEEN (tylko gdy motyw jest włączony) ======
(function(){
  var tbs=document.querySelectorAll(".tb");for(var k=0;k<tbs.length;k++)tbs[k].onclick=function(){window.__setTheme(this.getAttribute("data-t"))};
  window.__markTheme();
  if(!window.__hwEvent)return;
  var STEM='<path d="M36 14c-3-6-1-10 4-12" stroke="#7cc14a" stroke-width="5" fill="none" stroke-linecap="round"/>';
  var TRI='<path d="M24 34l6 6-9 1zM48 34l-6 6 9 1z" fill="#150f1c"/>';
  var DOTS='<circle cx="26" cy="36" r="4" fill="#150f1c"/><circle cx="46" cy="36" r="4" fill="#150f1c"/>';
  var SMILE='<path d="M22 48q14 12 28 0" stroke="#150f1c" stroke-width="4" fill="none" stroke-linecap="round"/>';
  var ZIG='<path d="M24 48l4 4 4-4 4 4 4-4 4 4 4-4" stroke="#150f1c" stroke-width="3" fill="none" stroke-linejoin="round"/>';
  function pump(w,st,face,dim){
    var a=dim?"#d9660a":"#e8730c",b=dim?"#f07d12":"#ff8a1f",f=face===1?TRI+SMILE:face===2?DOTS+ZIG:face===3?TRI+ZIG:"";
    return '<svg width="'+w+'" height="'+Math.round(w*.89)+'" viewBox="0 0 72 64" aria-hidden="true" style="'+st+'">'+STEM+'<ellipse cx="22" cy="38" rx="18" ry="22" fill="'+a+'"/><ellipse cx="50" cy="38" rx="18" ry="22" fill="'+a+'"/><ellipse cx="36" cy="38" rx="16" ry="24" fill="'+b+'"/>'+f+'</svg>'}
  function ghost(w,st,fill,mouth){
    var m=mouth===1?'<ellipse cx="48" cy="66" rx="7" ry="9" fill="#150f1c"/>':mouth===2?'<path d="M38 66q10 9 20 0" stroke="#150f1c" stroke-width="4" fill="none" stroke-linecap="round"/>':'';
    var cheeks=mouth===1?'<ellipse cx="27" cy="58" rx="6" ry="3.5" fill="#ffb4c6"/><ellipse cx="69" cy="58" rx="6" ry="3.5" fill="#ffb4c6"/>':'';
    return '<svg width="'+w+'" height="'+Math.round(w*116/96)+'" viewBox="0 0 96 116" aria-hidden="true" style="'+st+'"><path d="M48 6C27 6 12 22 12 44v58l12-9 12 9 12-9 12 9 12-9 12 9V44C84 22 69 6 48 6z" fill="'+fill+'"/><ellipse cx="36" cy="44" rx="6" ry="9" fill="#150f1c"/><ellipse cx="60" cy="44" rx="6" ry="9" fill="#150f1c"/>'+m+cheeks+'</svg>'}
  function bat(w,st){return '<svg width="'+w+'" height="'+Math.round(w*30/64)+'" viewBox="0 0 64 30" aria-hidden="true" style="'+st+'"><path d="M32 12c-4-8-14-11-30-8 6 3 6 9 10 13 3-3 8-2 10 2 2-4 8-5 10-2 4-4 4-10 10-13-16-3-26 0-30 8z" fill="#4a3858" transform="translate(0 4)"/></svg>'}
  function eyes(w,st,id){
    return '<svg class="hwe" width="'+w+'" height="'+Math.round(w*50/90)+'" viewBox="0 0 90 50" aria-hidden="true" style="'+st+'"><defs><radialGradient id="'+id+'"><stop offset="0" stop-color="#b7ff3c" stop-opacity=".75"/><stop offset="1" stop-color="#b7ff3c" stop-opacity="0"/></radialGradient></defs><circle cx="26" cy="26" r="22" fill="url(#'+id+')"/><circle cx="64" cy="26" r="22" fill="url(#'+id+')"/><path d="M14 28q12-18 24 0q-12 12-24 0z" fill="#b7ff3c"/><path d="M52 28q12-18 24 0q-12 12-24 0z" fill="#b7ff3c"/><ellipse cx="26" cy="26" rx="2.5" ry="6" fill="#150f1c"/><ellipse cx="64" cy="26" rx="2.5" ry="6" fill="#150f1c"/></svg>'}
  var top='<div class="hwd" aria-hidden="true">'
    +ghost(96,"top:70px;left:4%;opacity:.95","#f6eee6",1)
    +ghost(70,"top:130px;right:5%;opacity:.8;transform:rotate(10deg)","#cfc4ee",2)
    +ghost(46,"top:310px;left:11%;opacity:.55;transform:rotate(-12deg)","#f6eee6",0)
    +bat(64,"top:40px;right:22%;opacity:.8")+bat(44,"top:96px;left:30%;opacity:.6")
    +pump(84,"top:210px;left:2%;transform:rotate(-8deg)",1)
    +pump(60,"top:262px;left:8%;transform:rotate(6deg);opacity:.9",2)
    +pump(96,"top:200px;right:2%;transform:rotate(9deg)",1)
    +pump(56,"top:272px;right:9%;transform:rotate(-7deg);opacity:.9",3)
    +'</div>'
    +eyes(90,"top:42vh;left:1%","hwg1")
    +eyes(70,"top:64vh;right:1.5%;animation-delay:1.3s","hwg2")
    +eyes(54,"top:82vh;left:2.5%;animation-delay:2.4s","hwg3")
    +eyes(80,"top:24vh;right:3%;animation-delay:.7s","hwg4");
  document.body.insertAdjacentHTML("afterbegin",top);
  var row='<div class="hwrow" aria-hidden="true">'
    +pump(120,"",1)+pump(70,"",0,1)+pump(96,"",2)+ghost(64,"margin-bottom:6px","#f6eee6",1).replace(' style="margin-bottom:6px"',' style="margin-bottom:6px"')
    +pump(110,"",1)+pump(70,"",0,1)+pump(126,"",2)+'</div>';
  var f=document.querySelector("footer");if(f)f.insertAdjacentHTML("afterend",row);
})();
