// Motyw: jasny / ciemny / Halloween. Halloween jest domyślny 24.10–2.11 (podgląd: ?halloween=1, wyłączenie: ?halloween=0).
(function(){var q=location.search.match(/[?&]halloween=(\d)/),d=new Date(),m=d.getMonth()+1,n=d.getDate(),h=document.documentElement;
  var on=q?q[1]==="1":((m===10&&n>=24)||(m===11&&n<=2));
  window.__hwEvent=on;var cur=null;
  function store(){return localStorage}
  function mark(){var b=document.querySelectorAll(".tb");for(var i=0;i<b.length;i++){var a=b[i].getAttribute("data-t")===(cur||"auto");b[i].className="tb"+(b[i].getAttribute("data-t")==="halloween"?" tb-hw":"")+(a?" on":"");b[i].setAttribute("aria-pressed",a?"true":"false")}}
  function apply(x){cur=x;h.classList.remove("hw");h.removeAttribute("data-theme");
    if(x==="halloween")h.classList.add("hw");else if(x==="light"||x==="dark")h.setAttribute("data-theme",x);mark()}
  window.__setTheme=function(x){try{store().setItem("theme",x)}catch(e){}apply(x)};
  window.__markTheme=mark;
  var x=null;try{x=store().getItem("theme")}catch(e){}
  if(!on&&x==="halloween")x=null;if(on&&!x)x="halloween";
  if(on){h.classList.add("hwev");var l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Creepster&display=swap";document.head.appendChild(l)}
  apply(x)})();
