// Motyw: jasny / ciemny / Halloween / Jesień. Halloween jest domyślny 24.10–2.11 (podgląd: ?halloween=1, wyłączenie: ?halloween=0),
// Jesień (jeż pod jabłonią) jest domyślna 3–30.11 (podgląd: ?jesien=1, wyłączenie: ?jesien=0). Przycisk liścia w prawym górnym rogu przełącza motyw.
(function(){var d=new Date(),m=d.getMonth()+1,n=d.getDate(),h=document.documentElement;
  var q=location.search.match(/[?&]halloween=(\d)/),on=q?q[1]==="1":((m===10&&n>=24)||(m===11&&n<=2));
  var qa=location.search.match(/[?&]jesien=(\d)/),au=qa?qa[1]==="1":(m===11&&n>=3&&n<=30);
  window.__hwEvent=on;window.__auEvent=au;var cur=null;
  function store(){return localStorage}
  function mark(){var b=document.querySelectorAll(".tb");for(var i=0;i<b.length;i++){var a=b[i].getAttribute("data-t")===(cur||"auto");b[i].className="tb"+(b[i].getAttribute("data-t")==="halloween"?" tb-hw":"")+(a?" on":"");b[i].setAttribute("aria-pressed",a?"true":"false")}}
  function apply(x){cur=x;h.classList.remove("hw");h.classList.remove("jes");h.removeAttribute("data-theme");
    if(x==="halloween")h.classList.add("hw");else if(x==="autumn")h.classList.add("jes");else if(x==="light"||x==="dark")h.setAttribute("data-theme",x);mark()}
  window.__setTheme=function(x){try{store().setItem("theme",x)}catch(e){}apply(x)};
  window.__markTheme=mark;
  var x=null;try{x=store().getItem("theme")}catch(e){}
  if(!on&&x==="halloween")x=null;if(!au&&x==="autumn")x=null;
  if(!x)x=on?"halloween":(au?"autumn":null);
  if(on){h.classList.add("hwev");var l=document.createElement("link");l.rel="stylesheet";l.href="https://fonts.googleapis.com/css2?family=Creepster&display=swap";document.head.appendChild(l)}
  if(au)h.classList.add("auev");
  apply(x)})();
