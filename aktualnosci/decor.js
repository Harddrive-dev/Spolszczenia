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

// ====== MOTYW JESIEŃ: jeż pod jabłonią + liście przy logo (uruchamia się tylko przy włączonym motywie) ======
/* Cozy pixel art: jeż szykuje się do zimowania pod jabłonią. Canvas 84x46 „pikseli”, skalowany CSS-em.
   Sprite'y są generowane algorytmicznie + automatyczny ciemny kontur. Animacja = funkcja numeru klatki (tick ~140 ms). */
(function(){
var W=84,H=46,GY=42;
var O="#2a1810";
var HP={s:"#7a3218",S:"#9a4220",L:"#cf7a3a",d:"#2e1008",f:"#f2a82c",F:"#d9861f",c:"#c4682a",e:"#c4682a",w:"#ffffff",k:"#1c0e08",n:"#1c0e08",p:"#f2a82c",O:"#1c0e08"};
var LEAF=[["#d9602f","#f08a52","#8f3418"],["#e8a23a","#f7c866","#a8631a"],["#b23a48","#d4566a","#6e1f2c"],["#c98b3a","#e3b25c","#7e5220"],["#a8501c","#d0752e","#6a2c0e"]];
function rnd(i){var x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function px(g,x,y,c){if(x<0||y<0||x>=W||y>=H)return;g.fillStyle=c;g.fillRect(x,y,1,1)}
function grid(g,rows,pal,x0,y0){for(var y=0;y<rows.length;y++)for(var x=0;x<rows[y].length;x++){var ch=rows[y][x];if(ch!==".")px(g,x0+x,y0+y,pal[ch])}}
// dodaje kontur 'O' wokół niepustych pikseli (siatka tablic znaków z marginesem)
function outline(a){var h=a.length,w=a[0].length,b=a.map(function(r){return r.slice()});
 for(var y=0;y<h;y++)for(var x=0;x<w;x++)if(a[y][x]==="."){var n=(y>0&&a[y-1][x]!==".")||(y<h-1&&a[y+1][x]!==".")||(x>0&&a[y][x-1]!==".")||(x<w-1&&a[y][x+1]!==".");if(n)b[y][x]="O"}
 return b}
function mk(w,h){var a=[];for(var y=0;y<h;y++)a.push(new Array(w).fill("."));return a}
function quill(x,y){var r=rnd(x*7+y*13);if(r<.13)return "d";if((x+2*y)%7===0)return "L";return r<.3?"s":"S"}
function rows(a){return a.map(function(r){return r.join("")})}
/* ---- jeż w marszu (zwrócony w lewo), margines 1px ---- */
function hog(f){var w=25,h=14,a=mk(w,h),ox=1,oy=1;
 var cx=14,cy=4.6,rx=7,ry=5,top={};
 for(var y=0;y<=9;y++)for(var x=7;x<23;x++){var dx=(x-cx)/rx,dy=(y-cy)/ry;if(dx*dx+dy*dy<=1){a[y+oy][x+ox]=quill(x,y);if(top[x]===undefined)top[x]=y}}
 Object.keys(top).forEach(function(k){k=+k;var t=top[k];if(t>0&&k%2===0){a[t-1+oy][k+ox]="L";if(k%4===0&&t>1)a[t-2+oy][k+ox]="S"}});
 for(var y=1;y<=8;y+=2){for(var x=22;x>=14;x--)if(a[y+oy][x+ox]!=="."){if(a[y+oy][x+ox+1]===".")a[y+oy][x+ox+1]="S";break}}
 var head=["....ee...","...eeeff.","..fkwffff",".ffkkffff","nccffffF.",".ccfffFF.","..FFFF..."];
 for(var j=0;j<head.length;j++)for(var i=0;i<9;i++){var c=head[j][i];if(c!==".")a[4+j+oy][i+ox]=c}
 var pw=f===0?[[5,6],[16,17]]:f===1?[[7,8],[13,14]]:[[6,7],[15,16]];
 pw.forEach(function(p){for(var y=10;y<=11;y++)for(var x=p[0];x<=p[1];x++)a[y+oy][x+ox]="p"});
 a=outline(a);return rows(a)}
function ball(){var w=14,h=13,a=mk(w,h),ox=1,oy=1,cx=5.5,cy=5,r=5.4;
 for(var y=0;y<=9;y++)for(var x=0;x<12;x++){var dx=x-cx,dy=y-cy,d=Math.sqrt(dx*dx+dy*dy);if(d<=r)a[y+oy][x+ox]=quill(x,y)}
 for(var x=1;x<12;x+=2){for(var y=0;y<10;y++)if(a[y+oy][x+ox]!=="."){if(y>0)a[y-1+oy][x+ox]="L";break}}
 var face=["cc.","nfF","cFF"];
 for(var j=0;j<3;j++)for(var i=0;i<3;i++){var c=face[j][i];if(c!==".")a[6+j+oy][i+ox]=c}
 a=outline(a);return rows(a)}
var HOG=[hog(0),hog(1),hog(2)],BALL=ball();
/* ---- liść (generowany): kolor, kąt, rozmiar n ---- */
var LEAFB=[["#f0561c","#ff9a4a","#8a2410"],["#ffb629","#ffe07a","#a8640e"],["#d93a52","#ff7a8c","#7a1428"],["#e88a1e","#ffc060","#8a4a10"],["#c8461a","#ff8a44","#6a220c"]];
function leafCanvas(ci,ang,n,br){var c=document.createElement("canvas");c.width=c.height=n+2;var g=c.getContext("2d"),m=mk(n+2,n+2),P=(br?LEAFB:LEAF)[ci%5],cx=(n+1)/2,half=n/2;
 for(var y=0;y<n;y++)for(var x=0;x<n;x++){var dx=x+.5-n/2,dy=y+.5-n/2,u=dx*Math.cos(ang)+dy*Math.sin(ang),v=-dx*Math.sin(ang)+dy*Math.cos(ang),t=u/(half*.95);
  var hw=half*.5*Math.sqrt(Math.max(0,1-t*t))*(1-.3*t);
  if(Math.abs(v)<=hw&&Math.abs(t)<=1){m[y+1][x+1]=Math.abs(v)<.55&&t<.85?"v":v<-hw*.35?"h":"b"}}
 // ogonek
 var sx=Math.round(n/2-Math.cos(ang)*half*1.05),sy=Math.round(n/2-Math.sin(ang)*half*1.05);if(m[sy+1]&&m[sy+1][sx+1]===".")m[sy+1][sx+1]="v";
 m=outline(m);var col={b:P[0],h:P[1],v:P[2],O:O};
 for(var y=0;y<m.length;y++)for(var x=0;x<m[0].length;x++)if(m[y][x]!=="."){g.fillStyle=col[m[y][x]];g.fillRect(x,y,1,1)}
 return c}
/* ---- drzewo ---- */
var TW=38,TH=22,TPAL=["#ffd860","#fba52c","#ea7620","#c9491b","#8f2a14","#5c1a10"];
var BL=(function(){var L=[];for(var r=0;r<5;r++)for(var c=0;c<9;c++){var x=3+c*4+(r%2?2:0)+Math.round((rnd(r*9+c)-.5)*2),y=3+r*3.6+Math.round((rnd(r*7+c*3)-.5)*2),dx=(x-19)/17,dy=(y-9.5)/9.5;if(dx*dx+dy*dy<=1)L.push([x,y,3.1+rnd(r*5+c*11)*1.2])}return L})();
function canopy(fr){var a=mk(TW+2,TH+2);
 for(var y=0;y<TH;y++)for(var x=0;x<TW;x++){var best=null,bd=9;for(var i=0;i<BL.length;i++){var dx=x-BL[i][0],dy=y-BL[i][1],d=Math.sqrt(dx*dx+dy*dy)/BL[i][2];if(d<=1&&d<bd){bd=d;best=BL[i]}}
  if(!best)continue;var ly=(y-best[1])/best[2],lx=(x-best[0])/best[2];
  var t=(ly+1)*1.6+lx*.6+(y/TH)*2.3+.5+(rnd(x*3+y*5+(fr&&rnd(x+y*7)<.12?9:0))-.5)*.7;
  var k=Math.max(0,Math.min(5,Math.floor(t)));a[y+1][x+1]=String(k)}
 a=outline(a);
 return a}
var CAN=[canopy(0),canopy(1)],TC={"0":TPAL[0],"1":TPAL[1],"2":TPAL[2],"3":TPAL[3],"4":TPAL[4],"5":TPAL[5],B:"#4a2012",O:"#3a140c"};
var APPLES=[[6,9],[25,6],[32,12],[14,16],[20,10]];
var AP={h:"#ff9f8c",r:"#e8332c",s:"#a81e1e",O:"#4a0e0e",g:"#7ac03a"},APS=[".OOO.","OhrrO","OrrrO","OrrsO",".OOO."];
function apple(g,x,y){x-=1;y-=1;for(var j=0;j<5;j++)for(var i=0;i<5;i++){var c=APS[j][i];if(c!==".")px(g,x+i,y+j,AP[c])}px(g,x+2,y-1,"#4a2a14");px(g,x+3,y-1,AP.g);px(g,x+3,y-2,AP.g)}
function drawTree(g,tx,ty,fr,skip){
 var bx=tx+19,top=ty+17;
 for(var y=top;y<=GY;y++){var t=(y-top)/(GY-top),wd=t<.2?7:t>.88?11:t>.72?9:7,x0=bx-Math.floor(wd/2);for(var x=0;x<wd;x++){var c=x===0||x===wd-1?"#3a2316":x===1?"#a56c3c":x<wd/2+1?"#7d4c2a":"#5e3820";px(g,x0+x,y,c)}}
 px(g,bx-6,GY,"#3a2316");px(g,bx+6,GY,"#3a2316");
 grid(g,CAN[fr],TC,tx-1,ty-1);
 for(var i=0;i<APPLES.length;i++){if(i===0&&skip)continue;apple(g,tx+APPLES[i][0],ty+APPLES[i][1])}}
/* ---- kopiec liści ---- */
var PW=30,PH=10,PILE=(function(){var a=[];for(var y=0;y<PH;y++){a.push([]);for(var x=0;x<PW;x++){var dx=(x-PW/2+.5)/(PW/2),dy=(y-PH+.5)/PH,ins=dx*dx+dy*dy<=1;
 if(!ins){a[y].push(null);continue}var k=Math.floor(rnd(x*13+y*29)*5),sh=rnd(x*7+y*3);a[y].push(sh<.18?LEAF[k][1]:sh>.8?LEAF[k][2]:LEAF[k][0])}}
 for(var y=0;y<PH;y++)for(var x=0;x<PW;x++)if(a[y][x]&&(y===0||!a[y-1][x]||(x>0&&!a[y][x-1])||(x<PW-1&&!a[y][x+1])))a[y][x]=a[y][x]===LEAF[0][0]?"#8f3418":a[y][x]; return a})();
function drawPile(g,x0,y0,from){for(var y=from||0;y<PH;y++)for(var x=0;x<PW;x++){var c=PILE[y][x];if(c)px(g,x0+x,y0+y,c)}}
/* ---- Zzz ---- */
var Z=["#####","...#.","..#..",".#...","#####"],Z2=["####","..#.",".#..","####"];
function drawZ(g,x,y,big,col){var Q=big?Z:Z2;for(var j=0;j<Q.length;j++)for(var i=0;i<Q[j].length;i++)if(Q[j][i]==="#")px(g,x+i,y+j,col)}
function ground(g){for(var x=0;x<W;x++){px(g,x,GY+1,"#6a4529");px(g,x,GY+2,"#4a2e1c");for(var y=GY+3;y<H;y++)px(g,x,y,(x+y)%5===0?"#5a3a24":"#4a2e1c")}
 for(var x=0;x<W;x++){var n=rnd(x*5+3);if(n<.5)px(g,x,GY,"#6b7a2e");if(n<.2)px(g,x,GY-1,"#8a9a3e")}}
/* ---- oś czasu ---- */
var T={walk1:0,stop:30,fall:34,walk2:46,reach:102,curl:106,sleep:112},STOP_X=54,TREE_X=45,TREE_Y=GY-34,PILE_X=3,PILE_Y=GY-9;
var LSPR=[];
function leafSpr(i){if(!LSPR[i])LSPR[i]=leafCanvas(i,[.7,2.2,1.2,2.8,.2][i%5],5);return LSPR[i]}
function render(g,tick){
 g.clearRect(0,0,W,H);
 var fr=Math.floor(tick/5)%2,shake=tick>=T.stop&&tick<T.fall+6,hasApple=tick>=T.fall+6,skip=tick>=T.fall;
 drawTree(g,TREE_X,TREE_Y,shake?(tick%2):(Math.floor(tick/9)%2),skip);
 ground(g);drawPile(g,PILE_X,PILE_Y);
 var hx=null,hy=GY-11,r;
 if(tick<T.stop){hx=Math.round(W-tick*(W-STOP_X)/T.stop);r=HOG[tick%2]}
 else if(tick<T.walk2){hx=STOP_X;r=HOG[2]}
 else if(tick<T.reach){hx=Math.round(STOP_X-(tick-T.walk2)*0.8);r=HOG[tick%2]}
 else if(tick<T.curl){hx=Math.round(STOP_X-(T.reach-T.walk2)*0.8);r=HOG[2]}
 if(hx!==null){grid(g,r,HP,hx-1,hy-1);if(hasApple)apple(g,hx+11,hy-3+(r===HOG[2]?0:tick%2))}
 if(tick>=T.fall&&tick<T.fall+6){var a=APPLES[0],ax0=TREE_X+a[0],ay0=TREE_Y+a[1],k=(tick-T.fall)/6;apple(g,Math.round(ax0+(STOP_X+11-ax0)*k),Math.round(ay0+(hy-3-ay0)*k*k))}
 if(hx===null){var by=GY-10,bx=PILE_X+12,br=tick>=T.sleep&&Math.floor((tick-T.sleep)/8)%2?1:0;
  grid(g,BALL,HP,bx-1,by-1-br);apple(g,bx+4,by-3-br);
  drawPile(g,PILE_X,PILE_Y,6);
  var zt=tick-T.sleep;if(zt>=0)for(var k=0;k<3;k++){var tt=zt-k*14;if(tt<0)continue;tt%=42;var zy=by-5-Math.floor(tt/3),zx=bx+7+Math.floor(tt/4)+k;if(zy>0)drawZ(g,zx,zy,false,"#f6e7c8")}}
 // liść spadający z drzewa
 if(tick>=10){var lt=tick%70,li=Math.floor(tick/70),lx=TREE_X+4+(li%3)*9+Math.floor(lt/5)+Math.round(Math.sin(lt/5)*2),ly=TREE_Y+20+Math.floor(lt*.3);if(ly<GY-3&&ly>TREE_Y+19)g.drawImage(leafSpr(li),lx,ly)}
}
window.COZY={render:render,W:W,H:H,T:T,
 leaf:function(ci,ang,n,br){return leafCanvas(ci,ang,n,br)},
 mount:function(cv,opts){opts=opts||{};cv.width=W;cv.height=H;var g=cv.getContext("2d");g.imageSmoothingEnabled=false;var tick=0,timer=null,still=!!opts.still,paused=false;
  function frame(){render(g,tick);tick++}
  function stop(){clearInterval(timer);timer=null}
  function start(){if(!timer&&!still&&!paused)timer=setInterval(frame,140)}
  function play(){stop();tick=0;if(still){render(g,T.sleep+46);return}frame();start()}
  document.addEventListener("visibilitychange",function(){if(document.hidden)stop();else start()});
  cv.addEventListener("click",play);cv.style.cursor="pointer";cv.title="Kliknij, żeby zobaczyć jeszcze raz";
  cv.seek=function(t){stop();tick=t;render(g,t)};
  cv.pause=function(){paused=true;stop()};cv.resume=function(){paused=false;if(still)render(g,T.sleep+46);else start()};
  play();return cv}};
})();

(function(){var H=document.documentElement,hd=document.querySelector("header");if(!hd)return;
if(!document.getElementById("jcozy"))hd.insertAdjacentHTML("afterbegin",'<canvas id="jcozy" aria-hidden="true"></canvas><canvas id="jlvs" aria-hidden="true"></canvas>');
var mq=matchMedia("(prefers-reduced-motion: reduce)").matches,cv=null,lc=null,lg=null,LV=[],K=3,LW=0,LH=0,tt=0,tm=null,ready=false;
function place(){if(!ready||!H.classList.contains("jes"))return;var t=document.querySelector("header h1 a")||document.querySelector("header .lh a")||document.querySelector("header h1")||document.querySelector("header .lh"),hr=hd.getBoundingClientRect(),tr=t.getBoundingClientRect(),pad=64;
 lc.style.left=(tr.left-hr.left-pad)+"px";lc.style.top=(tr.top-hr.top-pad)+"px";lc.style.width=(tr.width+pad*2)+"px";lc.style.height=(tr.height+pad*2)+"px";
 LW=Math.round((tr.width+pad*2)/K);LH=Math.round((tr.height+pad*2)/K);lc.width=LW;lc.height=LH;lg.imageSmoothingEnabled=false;
 LV.forEach(function(l){l.x=Math.round((pad+(l.fx<=-1?l.fx:tr.width*l.fx))/K);l.y=Math.round((pad+l.fy)/K)});draw(mq?10:tt)}
function draw(t){if(!lg)return;lg.clearRect(0,0,LW,LH);LV.forEach(function(l){lg.drawImage(l.spr,l.x+Math.round(Math.sin((t+l.ph)/10)*1.5),l.y+Math.round(Math.sin((t+l.ph)/14+1)*1.2))})}
function stopL(){clearInterval(tm);tm=null}
function startL(){if(!tm&&!mq&&!document.hidden)tm=setInterval(function(){draw(tt++)},220)}
function init(){if(ready)return;ready=true;cv=document.getElementById("jcozy");lc=document.getElementById("jlvs");lg=lc.getContext("2d");
 COZY.mount(cv,{still:mq});
 LV=[[-56,-4,0,.6],[.08,-50,2,2.3],[.42,-56,3,1.1],[.76,-52,0,2.6],[1.04,-6,1,.3],[.98,-40,4,1.9],[.24,-30,1,2.8]].map(function(a,i){return{fx:a[0],fy:a[1],spr:COZY.leaf(a[2],a[3],12,true),ph:i*5}});
 addEventListener("resize",place);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(place);
 document.addEventListener("visibilitychange",function(){if(document.hidden)stopL();else if(H.classList.contains("jes"))startL()})}
function sync(){if(H.classList.contains("jes")){init();cv.resume();place();startL()}else if(ready){cv.pause();stopL()}}
var o=window.__setTheme;window.__setTheme=function(x){o(x);sync()};
sync()})();
