// Builds the "2027" film: canvas-drawn cinematic scenes, broadcast overlays,
// word-synced captions, ElevenLabs voice (Adam), music bed and sound effects.
// Run: node build.mjs   (then: npx hyperframes check / render)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const W = 1080, H = 1920;
const tx = (id) => JSON.parse(fs.readFileSync(path.join(ROOT, "tx", id + ".json"), "utf8"));
const VODUR = {};
for (const id of ["pro","ene","feb","mar","abr","may","jun","jul","ago","sep","oct1","oct2","nov","dic","epi"]) VODUR[id] = tx(id).audio_duration_secs;

// first word start (seconds into the VO file) whose text starts with `w`
function wAt(id, w, nth = 0) {
  const ws = tx(id).words.filter((x) => x.type === "word");
  const norm = (x) => x.text.toLowerCase().replace(/[^\p{L}\d]/gu, "");
  const hits = ws.filter((x) => w === "gasti" ? /^(gh?ast|gust)/.test(norm(x)) : norm(x).startsWith(w.toLowerCase()));
  if (!hits[nth]) throw new Error(`word ${w} not in ${id}`);
  return hits[nth].start;
}

// ------------------------------------------------------------------ engine
const ENGINE = String.raw`
const W=1080,H=1920;
function R(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function vn(x){const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return hash(i)*(1-u)+hash(i+1)*u}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function ss(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function lerp(a,b,t){return a+(b-a)*t}
function eo(t){t=clamp(t,0,1);return 1-Math.pow(1-t,3)}
function ei(t){t=clamp(t,0,1);return t*t*t}
function lg(c,x0,y0,x1,y1,st){const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g}
function rg(c,x,y,r0,r1,st){const g=c.createRadialGradient(x,y,r0,x,y,r1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g}
function fill(c,st){c.fillStyle=st;c.fillRect(0,0,W,H)}
function vgrad(c,a,b){fill(c,lg(c,0,0,0,H,[[0,a],[1,b]]))}
function glow(c,x,y,r,col,a){c.save();c.globalAlpha=a;c.globalCompositeOperation="lighter";c.fillStyle=rg(c,x,y,0,r,[[0,col],[1,"rgba(0,0,0,0)"]]);c.fillRect(x-r,y-r,2*r,2*r);c.restore()}
function beam(c,x,y,ang,len,w,col,a){c.save();c.globalAlpha=a;c.globalCompositeOperation="lighter";c.translate(x,y);c.rotate(ang);const g=lg(c,0,0,0,len,[[0,col],[1,"rgba(0,0,0,0)"]]);c.fillStyle=g;c.beginPath();c.moveTo(-8,0);c.lineTo(8,0);c.lineTo(w,len);c.lineTo(-w,len);c.closePath();c.fill();c.restore()}
function dust(c,t,seed,n,col,sp,sz,a){const r=R(seed);c.save();c.fillStyle=col;for(let i=0;i<n;i++){const x0=r()*W,y0=r()*H,ph=r()*6.28,s=(0.4+r())*sz;const x=(x0+Math.sin(t*0.5+ph)*30+t*sp*(r()-0.3)*20)%W,y=((y0-t*sp*(10+r()*30))%H+H)%H;c.globalAlpha=a*(0.3+0.7*vn(t*2+i));c.beginPath();c.arc((x+W)%W,y,s,0,6.283);c.fill()}c.restore()}
function snow(c,t,seed,n,col,sp,wind,sz,a){const r=R(seed);c.save();c.fillStyle=col;for(let i=0;i<n;i++){const x0=r()*W,y0=r()*H,s=(0.5+r())*sz,v=(0.6+r())*sp;const y=(y0+t*v)%H;const x=((x0+t*wind*v*0.6+Math.sin(t*2+i)*12)%W+W)%W;c.globalAlpha=a*(0.4+0.6*r());c.fillRect(x,y,s,s*(1+wind*0.02))}c.restore()}
function person(c,x,y,s,col){c.fillStyle=col;c.beginPath();c.arc(x,y-130*s,58*s,0,6.283);c.fill();c.beginPath();c.moveTo(x-150*s,y+60*s);c.quadraticCurveTo(x-150*s,y-62*s,x,y-62*s);c.quadraticCurveTo(x+150*s,y-62*s,x+150*s,y+60*s);c.closePath();c.fill()}
function cat(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=col;c.beginPath();c.moveTo(-60,0);c.bezierCurveTo(-90,0,-90,-90,-50,-110);c.bezierCurveTo(-60,-140,-56,-180,-40,-200);c.lineTo(-34,-240);c.lineTo(-10,-206);c.lineTo(20,-206);c.lineTo(44,-240);c.lineTo(50,-200);c.bezierCurveTo(66,-180,70,-140,60,-110);c.bezierCurveTo(100,-90,100,0,70,0);c.closePath();c.fill();c.lineWidth=16;c.lineCap="round";c.strokeStyle=col;c.beginPath();c.moveTo(70,-6);c.bezierCurveTo(130,-10,140,-60,112,-84);c.stroke();c.restore()}
function city(c,base,seed,col,winCol,on,sc,t){const r=R(seed);let x=-40;while(x<W+40){const w=(60+r()*120)*sc,h=(160+r()*520)*sc;c.fillStyle=col;c.fillRect(x,base-h,w,h);if(r()<0.25){c.fillRect(x+w*0.45,base-h-60*sc,4*sc,60*sc)}const cols=Math.floor(w/(22*sc)),rows=Math.floor(h/(34*sc));for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const k=r();if(k<0.55){const thr=hash(i*13.1+j*7.7+x);if(thr<on){c.fillStyle=winCol;c.globalAlpha=0.5+0.5*hash(i+j*3+x+Math.floor(t*0.5));c.fillRect(x+6*sc+i*22*sc,base-h+10*sc+j*34*sc,11*sc,16*sc);c.globalAlpha=1}}}x+=w+r()*14*sc}}
function obelisco(c,x,base,h,col){c.fillStyle=col;c.beginPath();c.moveTo(x-34,base);c.lineTo(x-24,base-h);c.lineTo(x,base-h-60);c.lineTo(x+24,base-h);c.lineTo(x+34,base);c.closePath();c.fill();c.fillStyle="rgba(0,0,0,0.6)";c.fillRect(x-6,base-h+40,12,18)}
function waves(c,t,level,col1,col2,amp){c.save();c.fillStyle=lg(c,0,level-40,0,H,[[0,col1],[1,col2]]);c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=12){const y=level+Math.sin(x*0.012+t*1.7)*amp+Math.sin(x*0.031-t*2.3)*amp*0.5;c.lineTo(x,y)}c.lineTo(W,H);c.closePath();c.fill();c.globalAlpha=0.35;c.strokeStyle="rgba(255,255,255,0.6)";c.lineWidth=3;c.beginPath();for(let x=0;x<=W;x+=12){const y=level+Math.sin(x*0.012+t*1.7)*amp+Math.sin(x*0.031-t*2.3)*amp*0.5;x?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();c.restore()}
function txt(c,s,x,y,font,col,al,a){c.save();c.globalAlpha=a==null?1:a;c.font=font;c.fillStyle=col;c.textAlign=al||"center";c.textBaseline="middle";c.fillText(s,x,y);c.restore()}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function desat(c,amt){if(amt<=0)return;c.save();c.globalCompositeOperation="saturation";c.globalAlpha=clamp(amt,0,1);c.fillStyle="#808080";c.fillRect(0,0,W,H);c.restore()}
function tint(c,col,a,mode){c.save();c.globalCompositeOperation=mode||"overlay";c.globalAlpha=a;c.fillStyle=col;c.fillRect(0,0,W,H);c.restore()}
function composite(ctx,B,t,cam,gl,seed){ctx.save();ctx.fillStyle="#000";ctx.fillRect(0,0,W,H);ctx.translate(W/2+(cam.x||0),H/2+(cam.y||0));ctx.rotate(cam.r||0);ctx.scale(cam.z||1,cam.z||1);ctx.drawImage(B,-W/2,-H/2);ctx.restore();
 if(gl>0.01){const r=R(Math.floor(t*30)*31+(seed||1));const n=Math.floor(3+gl*16);for(let i=0;i<n;i++){const y=r()*H,h=8+r()*140*gl,dx=(r()-.5)*220*gl;ctx.drawImage(ctx.canvas,0,y,W,h,dx,y,W,h)}
 ctx.save();ctx.globalCompositeOperation="screen";ctx.globalAlpha=0.5*gl;ctx.drawImage(ctx.canvas,18*gl,0);ctx.fillStyle="rgba(255,0,70,"+(0.18*gl)+")";ctx.fillRect(0,0,W,H);ctx.restore();
 ctx.save();ctx.globalAlpha=0.6*gl;for(let i=0;i<6;i++){ctx.fillStyle=["#0ff","#f0f","#fff"][i%3];ctx.fillRect(0,r()*H,W,2+r()*6)}ctx.restore()}}
function shake(t,amp,f){return {x:(vn(t*f)-0.5)*amp,y:(vn(t*f+50)-0.5)*amp}}
`;

// ------------------------------------------------------------------ scene definitions
// Each scene: id, vo (file ids with offsets), shots [[startSec, fnName]], js (draw fns), cam(t) code, overlays.
// Times are local to the scene. VO_AT is where its voice starts.
const scenes = [];
const VO_AT = 0.45;
const DAYS = {"ene": [0, 27], "feb": [27, 58], "mar": [58, 86], "abr": [86, 117], "may": [117, 147], "jun": [147, 178], "jul": [178, 208], "ago": [208, 239], "sep": [239, 270], "oct": [270, 300], "nov": [300, 331], "dic": [331, 361]};

function monthDur(vo) { return +(VO_AT + VODUR[vo] + 0.8).toFixed(2); }

// --- PROLOGUE
{
  const at = 0.6, id = "pro";
  const tC = +(at + wAt(id, "5") - 0.15).toFixed(2), tU = at + wAt(id, "último"), tG = at + wAt(id, "gasti", 1), tN = at + wAt(id, "esa"), tP = +(at + wAt(id, "pero")).toFixed(2);
  const dur = +(at + VODUR.pro + 1.2).toFixed(2);
  scenes.push({
    id, dur, vo: [["pro", at]], cuts: [tC, tU, tG, tN, tP],
    sfx: [["boom1", 0.0, 0.5], ["whoosh2", tC - 0.1, 0.4], ["chest", tU + 0.5, 0.9], ["boom2", tG - 0.05, 0.5], ["heart", tC + 1.0, 0.6], ["ice", tP + 0.1, 0.7], ["boom1", tP + 0.9, 0.5]],
    js: String.raw`
function room(b,t,lit,grey){vgrad(b,"#05070d","#0b0d16");
 // window with rain
 b.fillStyle="#0d1830";b.fillRect(640,360,340,520);for(let i=0;i<70;i++){const r=hash(i*3.1);const y=((r*900+t*(700+r*500))%560);b.fillStyle="rgba(150,180,255,0.25)";b.fillRect(650+hash(i)*320,360+y,2,24)}
 b.strokeStyle="#000";b.lineWidth=14;b.strokeRect(640,360,340,520);b.beginPath();b.moveTo(810,360);b.lineTo(810,880);b.stroke();
 // monitor glow on wall
 const fl=0.75+0.25*vn(t*9);glow(b,360,900,700,grey?"#8890a0":"#2a6bff",0.55*fl*lit);
 // desk + monitor
 b.fillStyle="#020203";b.fillRect(0,1240,W,680);b.fillStyle="#0a0a10";b.fillRect(130,760,520,330);
 b.fillStyle=grey?"#3a3d44":lg(b,140,770,640,1080,[[0,"#163a8a"],[1,"#0a1640"]]);b.fillRect(146,776,488,298);
 txt(b,grey?"2027":"23:59",390,925,"900 150px 'League Gothic'",grey?"#bbb":(Math.floor(t*2)%2?"#ff2a2a":"#ff5a5a"),"center",0.95);
 b.fillStyle="#050507";b.fillRect(360,1090,60,90);b.fillRect(280,1170,220,20);
 glow(b,390,1180,420,grey?"#777":"#2a6bff",0.35*lit);person(b,390,1420,1.9,"#000");}
function chest(b,t,lid,inner,grey){vgrad(b,"#07060a","#100c0a");glow(b,540,900,800,grey?"#444":"#ff9a2a",0.18+0.4*inner);
 b.save();b.translate(540,1100);const s=1.6;b.scale(s,s);
 // body
 b.fillStyle=lg(b,-260,0,260,0,[[0,"#3b2414"],[0.5,"#6b4224"],[1,"#2e1b0f"]]);rr(b,-260,-40,520,300,22);b.fill();
 b.strokeStyle="#c8a040";b.lineWidth=10;b.stroke();for(const x of [-150,150]){b.fillStyle="#b08a34";b.fillRect(x-14,-40,28,300)}
 b.fillStyle="#d8b04a";rr(b,-34,0,68,80,10);b.fill();b.fillStyle="#1a1208";b.fillRect(-8,26,16,30);
 // light from inside
 if(inner>0){for(let i=0;i<9;i++){beam(b,(i-4)*48,-50,Math.PI+(i-4)*0.11+Math.sin(t+i)*0.02,900,90,grey?"rgba(200,200,200,0.9)":"rgba(255,200,90,0.9)",0.12*inner)}glow(b,0,-60,320,grey?"#ccc":"#ffcf6a",0.8*inner)}
 // item (grey gun) rising
 if(grey){const yy=-120-60*eo((t)*0.8);b.fillStyle="#7d7d7d";b.fillRect(-120,yy,220,48);b.fillRect(40,yy+48,36,70);b.fillRect(-100,yy-14,50,16)}
 // lid
 b.save();b.translate(0,-40);b.scale(1,1-1.75*lid);if(lid>0.3){b.fillStyle="#120a04";b.fillRect(-250,-10,500,24)}b.fillStyle=lg(b,-260,-150,260,0,[[0,"#4a2d18"],[1,"#2a180c"]]);b.beginPath();b.moveTo(-260,0);b.lineTo(-260,-90);b.quadraticCurveTo(0,-230,260,-90);b.lineTo(260,0);b.closePath();b.fill();b.strokeStyle="#c8a040";b.lineWidth=10;b.stroke();b.restore();
 b.restore();dust(b,t,7,90,grey?"#ccc":"#ffd27a",1.2,2.4,0.7);if(grey)desat(b,0.85)}
function coin(b,t){vgrad(b,"#0a0603","#000");for(let i=0;i<16;i++)beam(b,540,1000,i*0.3927+t*0.15,1300,90,"#ffcf6a",0.07);glow(b,540,1000,700,"#ffb020",0.45);
 b.save();b.translate(540,1000);const sx=Math.cos(t*2.2);b.scale(Math.max(0.06,Math.abs(sx)),1);const face=sx>0;
 b.fillStyle=lg(b,-260,-260,260,260,[[0,"#fff2b0"],[0.4,"#f3c03a"],[0.7,"#b8860b"],[1,"#6e4c06"]]);b.beginPath();b.arc(0,0,260,0,6.283);b.fill();b.strokeStyle="#7a5508";b.lineWidth=18;b.stroke();b.beginPath();b.arc(0,0,210,0,6.283);b.lineWidth=6;b.stroke();
 b.fillStyle="#5a3c04";if(face){b.beginPath();b.arc(0,-30,95,0,6.283);b.fill();b.fillRect(-60,40,120,60);b.fillStyle="#f3c03a";b.beginPath();b.arc(-38,-35,28,0,6.283);b.arc(38,-35,28,0,6.283);b.fill();b.fillRect(-40,60,14,40);b.fillRect(-7,60,14,40);b.fillRect(26,60,14,40);b.save();b.strokeStyle="#5a3c04";b.lineWidth=26;b.lineCap="round";b.beginPath();b.moveTo(-150,110);b.lineTo(150,190);b.moveTo(150,110);b.lineTo(-150,190);b.stroke();b.restore()}else{txt(b,"TOKEN",0,-40,"400 120px 'League Gothic'","#5a3c04");txt(b,"PIRATA",0,70,"400 120px 'League Gothic'","#5a3c04")}
 b.restore();dust(b,t,12,80,"#ffd27a",1,2.5,0.7)}
function globe(b,t){fill(b,"#020306");for(let i=0;i<200;i++){b.fillStyle="#fff";b.globalAlpha=0.5*hash(i*7);b.fillRect(hash(i*3)*W,hash(i*5)*H,2,2)}b.globalAlpha=1;
 const cx=540,cy=980,R0=360;glow(b,cx,cy,520,"#3a7bff",0.35);b.fillStyle=rg(b,cx-120,cy-140,40,R0,[[0,"#3f7fd0"],[1,"#0a1c3a"]]);b.beginPath();b.arc(cx,cy,R0,0,6.283);b.fill();
 b.save();b.beginPath();b.arc(cx,cy,R0,0,6.283);b.clip();b.fillStyle="#2f6a3a";const sp=t*20;for(const [x,y,rx,ry] of [[-120,-120,130,90],[90,-60,110,150],[-60,140,90,70],[160,160,70,60]]){b.beginPath();b.ellipse(cx+((x+sp+500)%720)-360,cy+y,rx,ry,0.3,0,6.283);b.fill()}b.restore();
 const p=ss(0.1,2.2,t);b.strokeStyle="#ff3b1f";b.lineWidth=7;b.shadowColor="#ff3b1f";b.shadowBlur=24;const r=R(9);for(let k=0;k<7;k++){let a=r()*6.283,x=cx+Math.cos(a)*30,y=cy+Math.sin(a)*30;b.beginPath();b.moveTo(x,y);const n=Math.floor(p*9);for(let j=0;j<n;j++){a+=(r()-.5)*0.9;x+=Math.cos(a)*45;y+=Math.sin(a)*45;if(Math.hypot(x-cx,y-cy)>R0)break;b.lineTo(x,y)}b.stroke()}b.shadowBlur=0;glow(b,cx,cy,200,"#ff5a1f",0.4*p)}
const SH=[[0,coin],[${tC},(b,t)=>room(b,t,1,false)],[${tU},(b,t)=>chest(b,t,eo((t-0.5)/0.6),ss(0.4,1.2,t),false)],[${tG},(b,t)=>chest(b,t+3,1,1,true)],[${tN},(b,t)=>room(b,t,0.6,true)],[${tP},globe]];
function cam(t){if(t<${tC})return {z:1.0+t*0.02};if(t>=${tP}){const k=t-${tP};return {z:1.0+k*0.04,...shake(t,k<0.8?18:3,8)}}if(t<${tU})return {z:1.0+(t-${tC})*0.012,...shake(t,6,1.5)};if(t<${tG}){const k=t-${tU};return {z:1.05+k*0.03,...shake(t,k>0.5&&k<1.1?26:5,9)}}if(t<${tN}){const k=t-${tG};return {z:1.25-k*0.04,...shake(t,4,2)}}return {z:1.12-(t-${tN})*0.02,x:0,y:0}}
`,
    overlay: {
      html: `<div id="pro-q"><span>¿QUÉ PASARÍA SI</span><span>GASTI NO GANA</span><span class="red">EL TOKEN PIRATA?</span></div><div id="pro-date" class="ov-mono">5 DIC 2026 · 23:59</div>
        <div id="pro-big"><span>GASTI NO CONSIGUIÓ</span><span class="red">EL TOKEN PIRATA</span></div>`,
      css: `#pro-date{position:absolute;left:120px;top:300px;font-size:34px;color:#ff4a4a;letter-spacing:.08em}
        #pro-big{position:absolute;left:120px;width:780px;top:340px;font-family:'League Gothic';font-size:150px;line-height:.9;color:#fff;text-shadow:0 0 40px rgba(0,0,0,.9)}
        #pro-big span{display:block}#pro-big .red{color:#ff3b30}
        #pro-q{position:absolute;left:120px;width:780px;top:330px;font-family:'League Gothic';font-size:136px;line-height:.92;color:#fff;text-shadow:0 0 40px rgba(0,0,0,.95)}#pro-q span{display:block}#pro-q .red{color:#ffc53a}`,
      tl: `tl.fromTo("#pro-q",{opacity:0,scale:1.15,transformOrigin:"0 50%"},{opacity:1,scale:1,duration:.4,ease:"power3.out"},.05);tl.fromTo("#pro-q",{opacity:1},{opacity:0,duration:.2,immediateRender:false},${(tC - 0.2).toFixed(2)});
        tl.fromTo("#pro-date",{opacity:0},{opacity:1,duration:.3},${tC});
        tl.fromTo("#pro-date",{opacity:1},{opacity:0,duration:.2,immediateRender:false},${(tU - 0.2).toFixed(2)});
        tl.fromTo("#pro-big",{opacity:0,scale:1.4,transformOrigin:"0 50%"},{opacity:1,scale:1,duration:.25,ease:"power4.in"},${(tG - 0.05).toFixed(2)});
        tl.fromTo("#pro-big",{opacity:1},{opacity:0,duration:.2,immediateRender:false},${(tN - 0.15).toFixed(2)});`,
    },
  });
}

// --- MONTH helper
function month(o) {
  const at = VO_AT, dur = o.dur || monthDur(o.vo);
  scenes.push({
    id: o.id, dur, vo: o.voList || [[o.vo, at]], cuts: o.cuts, sfx: o.sfx || [], js: o.js,
    month: o.month, tag: o.tag, tagAt: o.tagAt ?? 1.6, overlay: o.overlay, grey: o.grey, noTitle: o.noTitle,
  });
}
const T = (id, w, n) => +(VO_AT + wAt(id, w, n)).toFixed(2);

// ENERO
{
  const a = T("ene", "instagram"), b2 = T("ene", "desde");
  month({ id: "ene", vo: "ene", month: "ENERO", tag: ["TECNOLOGÍA", "MENSAJES: $0,99 C/U"], cuts: [a, b2], grey: 0.0,
    sfx: [["whoosh1", a - 0.05, 0.8], ["boom1", a + 1.4, 0.5], ["coin", b2 + 0.9, 0.8], ["glitch1", b2 - 0.05, 0.6]],
    js: String.raw`
function servers(b,t){vgrad(b,"#02040a","#050a18");const vx=540,vy=760;
 for(let k=0;k<14;k++){const z=((k-t*1.4)%14+14)%14+0.6;const s=1/z;const w=1400*s,h=2400*s;for(const side of[-1,1]){const x=vx+side*(160*s*6),y=vy;b.fillStyle="#121a36";b.fillRect(side<0?x-w*0.5:x,y-h*0.35,w*0.5,h*0.8);b.strokeStyle="rgba(90,140,255,0.35)";b.lineWidth=Math.max(1,4*s);b.strokeRect(side<0?x-w*0.5:x,y-h*0.35,w*0.5,h*0.8);const r=R(k*9+(side>0?1:0));for(let i=0;i<90;i++){const lx=(side<0?x-w*0.5:x)+r()*w*0.5,ly=y-h*0.35+r()*h*0.8;const on=hash(i+k*40+Math.floor(t*6))>0.5;b.fillStyle=on?(r()<0.3?"#ff3355":"#3cf"):"#123";b.fillRect(lx,ly,Math.max(2,10*s),Math.max(2,5*s))}}}
 glow(b,vx,vy,500,"#1a4cff",0.5);b.fillStyle=lg(b,0,1300,0,H,[[0,"rgba(0,0,0,0)"],[1,"#000"]]);b.fillRect(0,1300,W,620)}
const APPS=[["INSTAGRAM",["#feda75","#d62976","#4f5bd5"]],["TIKTOK",["#111","#111","#25f4ee"]],["YOUTUBE",["#ff0000","#c00","#800"]],["WHATSAPP",["#25d366","#128c7e","#075e54"]]];
function vault(b,t){vgrad(b,"#05060a","#0c0e14");glow(b,540,820,700,"#ffb020",0.25);
 // vault door
 const cl=eo((t-1.6)/0.8);b.save();b.translate(540,820);b.fillStyle="#1a1c22";b.beginPath();b.arc(0,0,440,0,6.283);b.fill();b.strokeStyle="#555b66";b.lineWidth=26;b.stroke();
 for(let i=0;i<12;i++){b.save();b.rotate(i*0.5236+cl*1.2);b.fillStyle="#8a8f99";b.fillRect(380,-14,70,28);b.restore()}b.restore();
 APPS.forEach((ap,i)=>{const p=clamp((t-0.15*i)/1.5,0,1);const e=ei(p);const sx=[230,850,230,850][i],sy=[330,330,1310,1310][i];const x=lerp(sx,540,e),y=lerp(sy,820,e),s=lerp(1,0.15,e),rot=(i-1.5)*0.3*(1-e)+t*0.3;b.save();b.globalAlpha=1-ss(0.85,1,p);b.translate(x,y);b.rotate(rot);b.scale(s,s);b.fillStyle=lg(b,-150,-150,150,150,ap[1].map((c,k)=>[k/2,c]));rr(b,-150,-150,300,300,70);b.fill();b.strokeStyle="rgba(255,255,255,0.5)";b.lineWidth=5;b.stroke();txt(b,ap[0],0,0,"900 40px 'Archivo Black'","#fff");b.restore()});
 if(cl>0){b.save();b.translate(540,820);b.rotate(-0.1);b.globalAlpha=cl;b.strokeStyle="#ff2d2d";b.lineWidth=14;b.strokeRect(-330,-80,660,160);txt(b,"COMPRADO",0,6,"400 150px 'League Gothic'","#ff2d2d");b.restore()}
 dust(b,t,3,60,"#ffcf6a",1,2,0.5)}
function phone(b,t){vgrad(b,"#07070c","#000");glow(b,540,900,700,"#3355ff",0.3);
 b.save();b.translate(540,880);b.rotate(-0.06+Math.sin(t*0.6)*0.02);b.fillStyle="#111";rr(b,-330,-620,660,1240,80);b.fill();b.fillStyle=lg(b,0,-580,0,580,[[0,"#0d1b2a"],[1,"#081018"]]);rr(b,-300,-590,600,1180,56);b.fill();
 const msgs=["hola","¿estás?","che contestá","???","hola??"];msgs.forEach((m,i)=>{const p=ss(0.1+i*0.25,0.3+i*0.25,t);b.globalAlpha=p;b.fillStyle="#1f6f4a";rr(b,40-60*(1-p),-480+i*150,230,100,30);b.fill();txt(b,m,155,-430+i*150,"700 38px Inter","#fff");b.globalAlpha=1;});
 const pay=ss(0.9,1.1,t);b.fillStyle=pay>0.5?"#ff2d2d":"#25d366";rr(b,-260,420,520,120,60);b.fill();txt(b,pay>0.5?"PAGAR $0,99 PARA ENVIAR":"ENVIAR",0,482,"900 38px 'Archivo Black'","#fff");b.restore();
 // coins
 const r=R(5);for(let i=0;i<60;i++){const st=1+r()*1.5;if(t<st)continue;const k=t-st,x=r()*W,y=-80+k*k*900+r()*60;b.save();b.translate(x,y);b.scale(Math.cos(k*6+i),1);b.fillStyle="#f5c542";b.beginPath();b.arc(0,0,34,0,6.283);b.fill();b.fillStyle="#c79a1e";txt(b,"$",0,4,"900 40px 'Archivo Black'","#a5780a");b.restore()}}
const SH=[[0,servers],[${a},vault],[${b2},phone]];
function cam(t){if(t<${a})return {z:1+t*0.03};if(t<${b2}){const k=t-${a};return {z:1.0+k*0.02,...shake(t,k>1.5&&k<2.2?30:4,8)}}return {z:1.05+(t-${b2})*0.02,...shake(t,5,1)}}
`});
}

// FEBRERO
{
  const g = T("feb", "gana"), n = T("feb", "no");
  month({ id: "feb", vo: "feb", month: "FEBRERO", tag: ["MÚSICA", "NOMINADOS: 1"], cuts: [g, n],
    sfx: [["whoosh2", 0.05, 0.6], ["boom1", g - 0.1, 0.55], ["glitch2", n - 0.05, 0.5]],
    js: String.raw`
function stage(b,t){vgrad(b,"#060310","#12061e");
 for(let i=0;i<7;i++){const ang=Math.sin(t*0.9+i*1.3)*0.5;beam(b,80+i*155,250,ang,1600,260,["#ff3fa4","#7a5cff","#ffd36a"][i%3],0.22)}
 glow(b,540,1100,600,"#ff3fa4",0.3);
 // stage
 b.fillStyle="#0a0610";b.fillRect(0,1150,W,800);b.fillStyle=lg(b,0,1150,0,1190,[[0,"#ff7ad0"],[1,"#000"]]);b.globalAlpha=0.4;b.fillRect(0,1150,W,40);b.globalAlpha=1;
 glow(b,540,1480,700,"#ff5ab8",0.55);glow(b,200,1500,400,"#7a5cff",0.4);glow(b,880,1500,400,"#7a5cff",0.4);
 // crowd
 const r=R(11);for(let row=0;row<3;row++){for(let i=0;i<14;i++){const x=i*82+r()*40-20,y=1500+row*120+Math.abs(Math.sin(t*5+i*1.7+row))*-28;person(b,x,y,0.55+row*0.15,"#000");if(r()<0.25){b.fillStyle="#fff";b.fillRect(x+50,y-260,10,18);glow(b,x+55,y-250,40,"#fff",0.5)}}}
 dust(b,t,21,80,"#fff",1,2,0.4)}
function trophy(b,t){vgrad(b,"#0a0704","#000");beam(b,540,0,0,1500,420,"#ffe7a0",0.35);glow(b,540,800,500,"#ffcc55",0.35);
 b.save();b.translate(540,900);b.rotate(Math.sin(t*0.8)*0.05);
 const gold=lg(b,-200,0,200,0,[[0,"#7a5a10"],[0.35,"#ffe9a6"],[0.6,"#d4a020"],[1,"#5a400a"]]);b.fillStyle=gold;
 b.beginPath();b.moveTo(-40,-40);b.bezierCurveTo(-60,-200,-300,-300,-330,-420);b.lineTo(-120,-430);b.bezierCurveTo(-60,-300,10,-200,40,-60);b.closePath();b.fill();
 b.beginPath();b.ellipse(-225,-425,110,40,-0.1,0,6.283);b.fill();b.fillStyle="#3a2a06";b.beginPath();b.ellipse(-225,-425,80,24,-0.1,0,6.283);b.fill();
 b.fillStyle=gold;b.fillRect(-26,-60,52,260);b.beginPath();b.ellipse(0,0,170,46,0,0,6.283);b.fill();b.fillStyle="#2a2a2a";b.beginPath();b.ellipse(0,-6,150,34,0,0,6.283);b.fill();
 b.fillStyle=gold;b.fillRect(-140,200,280,90);b.fillStyle="#111";b.fillRect(-170,290,340,120);txt(b,"ÁLBUM DEL AÑO",0,350,"900 34px 'Archivo Black'","#d4a020");b.restore();
 const r=R(4);for(let i=0;i<120;i++){const x=r()*W,sp=200+r()*300,y=((r()*H+t*sp)%H),a=t*3+i;b.save();b.translate(x+Math.sin(a)*30,y);b.rotate(a);b.fillStyle=["#ffd36a","#fff","#ff9ad5"][i%3];b.fillRect(-10,-5,20,10);b.restore()}}
function seats(b,t){vgrad(b,"#050508","#000");beam(b,540,0,0,1250,170,"#ffffff",0.4);glow(b,540,1150,260,"#fff",0.25);
 b.fillStyle="#0d0d12";b.fillRect(250,1080,580,60);
 for(let row=0;row<9;row++){const y=1260+row*row*14+row*40,s=0.5+row*0.12;for(let i=-8;i<=8;i++){const x=540+i*90*s;b.fillStyle="#1a0a10";rr(b,x-34*s,y-60*s,68*s,80*s,12*s);b.fill();b.fillStyle="#2a0f18";b.fillRect(x-34*s,y,68*s,16*s)}}
 dust(b,t,9,70,"#fff",0.4,2.5,0.6)}
const SH=[[0,stage],[${g},trophy],[${n},seats]];
function cam(t){if(t<${g})return {z:1.05+t*0.02,...shake(t,6,1.2)};if(t<${n})return {z:1.15-(t-${g})*0.05};return {z:1.0+(t-${n})*0.02}}
`});
}

// MARZO
{
  const l = T("mar", "se"), a2 = T("mar", "se", 1);
  month({ id: "mar", vo: "mar", month: "MARZO", tag: ["CLIMA", "52 °C · SIN LUZ · SIN AGUA"], cuts: [l, a2],
    sfx: [["whoosh1", 0.05, 0.6], ["power", l + 0.2, 0.9], ["glitch1", a2 - 0.05, 0.5]],
    js: String.raw`
function heat(b,t){fill(b,lg(b,0,0,0,H,[[0,"#3a0500"],[0.45,"#ff5a00"],[0.7,"#ffb347"],[1,"#2a0a00"]]));
 const sy=470;glow(b,540,sy,700,"#ffdd88",0.9);b.fillStyle="#fff6d0";b.beginPath();b.arc(540,sy,170,0,6.283);b.fill();
 city(b,1400,3,"#1a0500","#ffb066",0.2,1.1,t);obelisco(b,540,1400,620,"#120300");b.fillStyle="#0d0200";b.fillRect(0,1400,W,520);
 // heat shimmer
 for(let y=900;y<1420;y+=6){const dx=Math.sin(y*0.07+t*9)*6*(y-900)/520;b.drawImage(b.canvas,0,y,W,6,dx,y,W,6)}
 txt(b,Math.round(lerp(38,52,ss(0.2,2.2,t)))+"°C",560,760,"400 280px 'League Gothic'","rgba(255,240,200,0.92)")}
function blackout(b,t){vgrad(b,"#02030a","#0a0b14");const on=1-ss(0.2,1.4,t);
 for(let i=0;i<220;i++){const r=hash(i);b.fillStyle="#fff";b.globalAlpha=0.6*hash(i*7);b.fillRect(hash(i*3)*W,hash(i*5)*800,2,2)}b.globalAlpha=1;
 city(b,1400,8,"#05060c","#ffcf7a",on,1.15,t);obelisco(b,540,1400,620,"#05060c");if(on>0.02)glow(b,540,1300,800,"#ff9a40",0.35*on);b.fillStyle="#020204";b.fillRect(0,1400,W,520)}
function faucet(b,t){fill(b,lg(b,0,0,0,H,[[0,"#1a120a"],[1,"#0a0705"]]));
 // cracked ground
 b.strokeStyle="rgba(0,0,0,0.7)";b.lineWidth=3;const r=R(77);for(let i=0;i<40;i++){let x=r()*W,y=1200+r()*720;b.beginPath();b.moveTo(x,y);for(let k=0;k<6;k++){x+=(r()-.5)*160;y+=(r()-.5)*90;b.lineTo(x,y)}b.stroke()}
 // tap
 const chrome=lg(b,0,600,0,760,[[0,"#eee"],[0.5,"#777"],[1,"#ccc"]]);b.fillStyle=chrome;rr(b,140,620,520,130,40);b.fill();rr(b,560,620,120,420,50);b.fill();b.fillRect(300,520,90,110);rr(b,220,480,250,60,30);b.fill();glow(b,600,700,300,"#fff",0.2);
 const n=Math.floor(t*1.6);for(let i=0;i<3;i++){const st=i*0.62;const k=t-st;if(k<0||i>=2)continue;b.fillStyle="#9cd2ff";b.beginPath();b.ellipse(620,1040+k*k*1800,12,18,0,0,6.283);b.fill()}
 txt(b,"SIN AGUA",540,1420,"400 200px 'League Gothic'","rgba(255,255,255,0.12)")}
const SH=[[0,heat],[${l},blackout],[${a2},faucet]];
function cam(t){if(t<${l})return {z:1.02+t*0.03,...shake(t,5,2)};if(t<${a2})return {z:1.1-(t-${l})*0.03};return {z:1.0+(t-${a2})*0.04}}
`});
}

// ABRIL
{
  const m = T("abr", "mitad"), c2 = T("abr", "comunicado");
  month({ id: "abr", vo: "abr", month: "ABRIL", tag: ["TRABAJO", "EMPLEO HUMANO −50%"], cuts: [m, c2],
    sfx: [["whoosh2", 0.05, 0.6], ["glitch2", m - 0.05, 0.7], ["alarm", m + 0.3, 0.35], ["glitch1", c2 - 0.05, 0.6]],
    js: String.raw`
function office(b,t,robo){vgrad(b,"#04080a","#0a1418");const vx=540,vy=620;
 b.strokeStyle="rgba(120,200,255,0.08)";b.lineWidth=2;for(let i=-12;i<=12;i++){b.beginPath();b.moveTo(vx,vy);b.lineTo(vx+i*260,H);b.stroke()}
 for(let row=7;row>=0;row--){const z=1+row*0.55;const s=1/z;const y=vy+700*s+row*0;for(let i=-4;i<=4;i++){const x=vx+i*300*s;
  b.fillStyle="#0b1216";b.fillRect(x-120*s,y,240*s,40*s);b.fillStyle="#9fe7ff";b.globalAlpha=0.7;b.fillRect(x-60*s,y-90*s,120*s,80*s);b.globalAlpha=1;glow(b,x,y-60*s,160*s,"#4fd2ff",0.25);
  const isR=robo>0&&hash(i*7.3+row*3.1)<0.5&&hash(i+row)<robo*1.2;
  if(isR){b.fillStyle="#1d2a30";b.fillRect(x-55*s,y-230*s,110*s,100*s);b.fillStyle="#ff2d2d";glow(b,x,y-185*s,60*s,"#ff2d2d",0.9);b.fillRect(x-35*s,y-195*s,25*s,14*s);b.fillRect(x+10*s,y-195*s,25*s,14*s);b.fillStyle="#1d2a30";b.fillRect(x-70*s,y-130*s,140*s,130*s)}
  else person(b,x,y+10*s,0.8*s,"#000")}}
 if(robo>0){const sy=(t*900)%H;b.fillStyle="rgba(255,40,40,0.25)";b.fillRect(0,sy,W,10);glow(b,540,sy,500,"#ff2020",0.2)}}
function term(b,t){fill(b,"#010604");glow(b,540,900,800,"#00ff66",0.12);
 const lines=["> COMUNICADO OFICIAL","> ","> Estimados humanos:","> sus puestos fueron","> optimizados.","> Gracias por todo.","> ","> -- redactado por IA"];
 const total=lines.join("").length;let n=Math.floor(clamp(t/2.4,0,1)*total);b.font="700 46px 'IBM Plex Mono'";b.fillStyle="#3dff8a";b.textBaseline="top";
 let y=380;for(const L of lines){const s=L.slice(0,Math.max(0,n));n-=L.length;b.fillText(s,110,y);if(n<0&&n>-L.length-1){}y+=74}
 if(Math.floor(t*2)%2)b.fillRect(110,y,26,50);
 for(let y2=0;y2<H;y2+=4){b.fillStyle="rgba(0,0,0,0.25)";b.fillRect(0,y2,W,2)}}
const SH=[[0,(b,t)=>office(b,t,0)],[${m},(b,t)=>office(b,t+2,ss(0,1.2,t))],[${c2},term]];
function cam(t){if(t<${m})return {z:1.0+t*0.02,x:-t*8};if(t<${c2})return {z:1.06+(t-${m})*0.02,...shake(t,8,4)};return {z:1.0+(t-${c2})*0.015}}
`});
}

// MAYO
{
  const i2 = T("may", "internet"), d = T("may", "con");
  month({ id: "may", vo: "may", month: "MAYO", tag: ["TECNOLOGÍA", "REDES QUE QUEDAN: 1"], cuts: [i2, d],
    sfx: [["whoosh2", 0.1, 0.8], ["boom2", i2 - 0.05, 0.5], ["whoosh1", d - 0.05, 0.6]],
    js: String.raw`
const COLS=["#ff3b5c","#3b82ff","#25d366","#ffb020","#a855f7","#22d3ee","#f43f5e","#facc15","#fff"];
function vortex(b,t){fill(b,"#000");const cx=540,cy=820;
 for(let i=0;i<5;i++){b.save();b.translate(cx,cy);b.rotate(t*0.6+i);b.scale(1,0.32);glow(b,0,0,520-i*60,i%2?"#ff6a00":"#7a3cff",0.25);b.restore()}
 const r=R(2);for(let i=0;i<260;i++){const a0=r()*6.283,d0=300+r()*900,sp=0.25+r()*0.6;const life=(t*sp+r())%1;const d=d0*(1-ei(life)),a=a0+life*5;const x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*0.55;const s=26*(d/1000)+3;b.fillStyle=COLS[i%COLS.length];b.globalAlpha=0.9*(1-life*0.4);rr(b,x-s,y-s,2*s,2*s,s*0.4);b.fill()}b.globalAlpha=1;
 b.fillStyle="#000";b.beginPath();b.arc(cx,cy,120,0,6.283);b.fill();b.strokeStyle="#ffb070";b.lineWidth=4;b.stroke()}
function one(b,t){fill(b,"#000");const p=0.5+0.5*Math.sin(t*4);glow(b,540,800,700,"#ff2d55",0.35+0.15*p);
 for(let i=0;i<24;i++){beam(b,540,800,i*0.2618+t*0.1,1400,50,"#ff2d55",0.06)}
 b.save();b.translate(540,800);const s=1+0.03*p;b.scale(s,s);b.fillStyle=lg(b,-200,-200,200,200,[[0,"#ff5e7e"],[1,"#b0002a"]]);rr(b,-200,-200,400,400,90);b.fill();b.strokeStyle="rgba(255,255,255,0.6)";b.lineWidth=6;b.stroke();txt(b,"LA APP",0,10,"400 130px 'League Gothic'","#fff");b.restore()}
function sea(b,t){vgrad(b,"#000","#05000a");const r=R(13);
 for(let row=0;row<26;row++){const y=520+row*row*2.2+row*30;const s=0.25+row*0.05;for(let i=0;i<20;i++){const x=(i+0.5*(row%2))*W/16+r()*20-60;b.fillStyle="#ff2d55";glow(b,x,y,60*s,"#ff2d55",0.25);b.fillStyle="#111";rr(b,x-28*s,y-50*s,56*s,100*s,8*s);b.fill();b.fillStyle="#ff2d55";rr(b,x-18*s,y-18*s,36*s,36*s,8*s);b.fill()}}
 glow(b,540,300,500,"#ff2d55",0.3);txt(b,"1",540,330,"400 300px 'League Gothic'","rgba(255,255,255,0.85)")}
const SH=[[0,vortex],[${i2},one],[${d},sea]];
function cam(t){if(t<${i2})return {z:1.0+t*0.05,r:t*0.02};if(t<${d})return {z:1.2-(t-${i2})*0.06};return {z:1.0+(t-${d})*0.03,y:-(t-${d})*20}}
`});
}

// JUNIO
{
  const v = T("jun", "veterinarios"), g2 = T("jun", "los", 2), ah = T("jun", "ahora");
  month({ id: "jun", vo: "jun", month: "JUNIO", tag: ["SALUD ANIMAL", "DIAGNÓSTICO: DESCONOCIDO"], cuts: [v, g2],
    sfx: [["whoosh2", 0.05, 0.5], ["glitch2", v - 0.05, 0.5], ["heart", g2 + 0.2, 0.8], ["cat", ah + 0.2, 0.5]],
    js: String.raw`
function apt(b,t,shadow){vgrad(b,"#121a30","#0a0d18");glow(b,540,1150,650,"#6f86c8",0.35);
 // moonlight through blinds
 b.save();b.translate(-200+Math.sin(t*0.3)*40,0);b.rotate(-0.25);for(let i=0;i<14;i++){b.fillStyle="rgba(160,190,255,0.28)";b.fillRect(200,300+i*70,900,36)}b.restore();
 b.fillStyle="#08090f";b.fillRect(0,1450,W,470);b.fillStyle="rgba(140,170,255,0.08)";b.fillRect(0,1450,W,6);
 if(shadow>0){b.save();b.globalAlpha=0.55*shadow;b.fillStyle="#000";b.beginPath();const sx=600,sy=1450;b.moveTo(sx-90,sy);b.bezierCurveTo(sx-140,sy-500,sx-60,sy-900,sx+40,sy-980);b.bezierCurveTo(sx+150,sy-900,sx+140,sy-500,sx+110,sy);b.closePath();b.fill();
  b.fillStyle="rgba(255,40,40,"+(0.9*shadow)+")";b.beginPath();b.arc(sx,sy-860,9,0,6.283);b.arc(sx+56,sy-860,9,0,6.283);b.fill();b.restore()}
 cat(b,470,1480,2.2,"#000");glow(b,560,1000,500,"#8aa0ff",0.08)}
function vet(b,t){fill(b,"#020807");glow(b,540,800,700,"#00ff99",0.1);
 b.strokeStyle="rgba(0,255,150,0.12)";b.lineWidth=2;for(let x=0;x<W;x+=60){b.beginPath();b.moveTo(x,300);b.lineTo(x,1300);b.stroke()}for(let y=300;y<=1300;y+=60){b.beginPath();b.moveTo(0,y);b.lineTo(W,y);b.stroke()}
 b.strokeStyle="#3dff9a";b.lineWidth=6;b.shadowColor="#3dff9a";b.shadowBlur=20;b.beginPath();for(let x=0;x<=W;x+=4){const ph=(x/W*3+t*1.5)%1;let y=800;if(ph>0.42&&ph<0.46)y-=260*Math.sin((ph-0.42)/0.04*Math.PI);else if(ph>0.47&&ph<0.5)y+=110*Math.sin((ph-0.47)/0.03*Math.PI);y+=(hash(Math.floor(x/4)+Math.floor(t*20))-.5)*14;x?b.lineTo(x,y):b.moveTo(x,y)}b.stroke();b.shadowBlur=0;
 txt(b,"?",540,1120,"400 300px 'League Gothic'","rgba(255,60,60,"+(0.6+0.4*Math.sin(t*6))+")");txt(b,"FELIS CATUS · CAUSA DESCONOCIDA",540,420,"700 34px 'IBM Plex Mono'","#3dff9a")}
const SH=[[0,(b,t)=>apt(b,t,0)],[${v},vet],[${g2},(b,t)=>apt(b,t+3,ss(${(ah - g2).toFixed(2)},${(ah - g2 + 0.6).toFixed(2)},t))]];
function cam(t){if(t<${v})return {z:1.0+t*0.02};if(t<${g2})return {z:1.05,...shake(t,3,3)};const k=t-${g2};return {z:1.15+k*0.05,y:k*10}}
`});
}

// JULIO
{
  const bl = T("jul", "bloque"), ci = T("jul", "científicos");
  month({ id: "jul", vo: "jul", month: "JULIO", tag: ["ANTÁRTIDA", "≈ 176.000 KM² A LA DERIVA"], cuts: [bl, ci],
    sfx: [["wind", 0.0, 0.5], ["ice", bl + 0.2, 1.0], ["glitch1", ci - 0.05, 0.4]],
    js: String.raw`
function shelf(b,t,crack,drift){fill(b,lg(b,0,0,0,H,[[0,"#03101e"],[1,"#061a30"]]));
 // ocean texture
 for(let i=0;i<120;i++){const y=hash(i)*H,x=((hash(i*3)*W+t*20)%W);b.fillStyle="rgba(120,180,255,0.07)";b.fillRect(x,y,80+hash(i*5)*160,3)}
 const ice=(off,c)=>{b.save();b.translate(off.x,off.y);b.rotate(off.r);b.fillStyle=c;b.beginPath();off.pts.forEach((p,i)=>i?b.lineTo(p[0],p[1]):b.moveTo(p[0],p[1]));b.closePath();b.fill();b.restore()};
 const main=[[0,200],[700,260],[760,520],[620,820],[700,1100],[560,1420],[0,1500]];
 const chunk=[[700,260],[1080,320],[1080,1300],[560,1420],[700,1100],[620,820],[760,520]];
 b.save();b.shadowColor="rgba(0,0,0,0.6)";b.shadowBlur=40;ice({x:0,y:0,r:0,pts:main},lg(b,0,0,800,0,[[0,"#e8f4ff"],[1,"#b8d4ee"]]));
 const dx=drift*260,dy=drift*120,dr=drift*0.12;ice({x:dx,y:dy,r:dr,pts:chunk},lg(b,600,0,1080,0,[[0,"#dcecff"],[1,"#a8c8e8"]]));b.restore();
 if(crack>0){b.strokeStyle="#00e5ff";b.lineWidth=8;b.shadowColor="#00e5ff";b.shadowBlur=30;b.beginPath();const pts=[[700,260],[760,520],[620,820],[700,1100],[560,1420]];const n=crack*(pts.length-1);b.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<=Math.ceil(n);i++){const f=Math.min(1,n-(i-1));b.lineTo(lerp(pts[i-1][0],pts[i][0],f),lerp(pts[i-1][1],pts[i][1],f))}b.stroke();b.shadowBlur=0}
 if(drift>0.1){b.save();b.globalAlpha=ss(0.1,0.4,drift);b.setLineDash([14,12]);b.strokeStyle="#ff3b30";b.lineWidth=5;b.strokeRect(700+dx,300+dy,380,1100);txt(b,"URUGUAY",890+dx,860+dy,"400 110px 'League Gothic'","#ff3b30");b.restore()}
 snow(b,t,4,220,"#fff",160,4,4,0.7)}
function podium(b,t){vgrad(b,"#07080c","#000");beam(b,540,0,0,1300,320,"#fff3d6",0.3);glow(b,540,1050,400,"#fff3d6",0.25);
 b.fillStyle="#15161c";b.fillRect(180,1100,720,40);b.fillStyle="#0f1015";b.fillRect(220,1140,640,400);
 for(let i=0;i<5;i++){const x=320+i*110;b.strokeStyle="#333";b.lineWidth=8;b.beginPath();b.moveTo(x,1100);b.lineTo(x+(i-2)*20,880);b.stroke();b.fillStyle="#222";rr(b,x+(i-2)*20-26,820,52,80,24);b.fill()}
 txt(b,"CONFERENCIA SUSPENDIDA",540,1340,"700 36px 'IBM Plex Mono'","#ff3b30");for(let i=0;i<4;i++){b.fillStyle="#0b0b0f";b.fillRect(150+i*220,1600,140,260)}snow(b,t,9,80,"#fff",60,1,3,0.3)}
const SH=[[0,(b,t)=>shelf(b,t,0,0)],[${bl},(b,t)=>shelf(b,t+3,ss(0,0.7,t),ss(0.9,4,t))],[${ci},podium]];
function cam(t){if(t<${bl})return {z:1.12-t*0.02,r:-0.03};if(t<${ci}){const k=t-${bl};return {z:1.05-k*0.02,...shake(t,k<1.2?24:4,10)}}return {z:1.0+(t-${ci})*0.03}}
`});
}

// AGOSTO
{
  const o = T("ago", "organización"), p = T("ago", "para");
  month({ id: "ago", vo: "ago", month: "AGOSTO", tag: ["OMS", "ALERTA MÁXIMA · FELINOS"], cuts: [o, p],
    sfx: [["alarm", 0.2, 0.6], ["glitch2", o - 0.05, 0.5], ["cat", p + 0.3, 0.6]],
    js: String.raw`
function bio(b,t){const p=0.5+0.5*Math.sin(t*7);fill(b,lg(b,0,0,0,H,[[0,"#2a0000"],[1,"#0a0000"]]));glow(b,540,820,700,"#ff1a1a",0.3+0.3*p);
 b.save();b.translate(540,820);b.rotate(t*0.2);b.fillStyle="#ff3030";for(let i=0;i<3;i++){const a=i*2.094-1.5708;b.beginPath();b.arc(Math.cos(a)*120,Math.sin(a)*120,170,0,6.283);b.fill()}b.fillStyle="#1a0000";for(let i=0;i<3;i++){const a=i*2.094-1.5708;b.beginPath();b.arc(Math.cos(a)*165,Math.sin(a)*165,120,0,6.283);b.fill()}b.beginPath();b.arc(0,0,55,0,6.283);b.fill();b.strokeStyle="#ff3030";b.lineWidth=26;b.beginPath();b.arc(0,0,130,0,6.283);b.stroke();b.strokeStyle="#1a0000";b.lineWidth=14;for(let i=0;i<3;i++){const a=i*2.094+1.5708;b.beginPath();b.moveTo(0,0);b.lineTo(Math.cos(a)*200,Math.sin(a)*200);b.stroke()}b.restore();
 for(let y=0;y<H;y+=6){b.fillStyle="rgba(0,0,0,0.25)";b.fillRect(0,y,W,3)}
 txt(b,"PANDEMIA",540,1300,"400 220px 'League Gothic'","rgba(255,60,60,"+(0.5+0.5*p)+")")}
const LAND=[[200,300,160,120],[260,480,90,160],[520,280,90,70],[560,420,110,150],[760,300,220,140],[880,520,70,50]];
function map(b,t){fill(b,"#05080c");b.save();b.translate(0,520);
 for(let y=0;y<800;y+=22)for(let x=0;x<W;x+=22){let inl=false;for(const L of LAND){const dx=(x-L[0])/L[2],dy=(y-L[1])/L[3];if(dx*dx+dy*dy<1+0.35*(vn(x*0.02+y*0.03)-0.5)){inl=true;break}}if(!inl)continue;
  const src=[[230,330],[600,440],[820,330]];let inf=0;for(const s of src){const d=Math.hypot(x-s[0],y-s[1]);inf=Math.max(inf,ss(d+40,d-40,t*260))}b.fillStyle=inf>0.5?"#ff2d2d":"#2a3f55";if(inf>0.5)glow(b,x,y,16,"#ff2d2d",0.2);b.beginPath();b.arc(x,y,6,0,6.283);b.fill()}
 b.restore();txt(b,"CASOS FELINOS",540,1420,"700 40px 'IBM Plex Mono'","#ff5a5a");txt(b,String(Math.floor(ei(t/3)*480000000)).replace(/\B(?=(\d{3})+(?!\d))/g,"."),540,1500,"400 120px 'League Gothic'","#fff")}
function windows(b,t){vgrad(b,"#03040a","#07080f");b.fillStyle="#0a0b12";b.fillRect(110,200,860,1500);
 for(let r=0;r<7;r++)for(let c=0;c<4;c++){const x=160+c*205,y=260+r*200;const k=r*4+c;const off=t>0.3+hash(k)*2.6;b.fillStyle=off?"#06060a":"#ffcf7a";b.fillRect(x,y,150,150);if(!off){glow(b,x+75,y+75,140,"#ffb050",0.2);cat(b,x+75,y+148,0.45,"#000")}}}
const SH=[[0,bio],[${o},map],[${p},windows]];
function cam(t){if(t<${o})return {z:1.05+t*0.03,...shake(t,6,6)};if(t<${p})return {z:1.0+(t-${o})*0.04};return {z:1.1-(t-${p})*0.03}}
`});
}

// SEPTIEMBRE
{
  const m2 = T("sep", "mar"), v2 = T("sep", "venecia");
  month({ id: "sep", vo: "sep", month: "SEPTIEMBRE", tag: ["CLIMA", "NIVEL DEL MAR +40 CM"], cuts: [m2, v2],
    sfx: [["ice", 0.3, 0.8], ["water", m2, 0.8], ["water", v2 + 0.2, 0.9]],
    js: String.raw`
function glacier(b,t){fill(b,lg(b,0,0,0,H,[[0,"#1d2633"],[0.45,"#4a5a6e"],[1,"#0a2a44"]]));glow(b,800,300,500,"#cfd8e6",0.3);
 b.fillStyle=lg(b,0,300,0,1250,[[0,"#f4fbff"],[0.5,"#9fd0f0"],[1,"#1f6fa8"]]);b.beginPath();b.moveTo(0,1250);const r=R(6);for(let x=0;x<=W;x+=40){b.lineTo(x,380+r()*140)}b.lineTo(W,1250);b.closePath();b.fill();
 for(let i=0;i<22;i++){b.fillStyle="rgba(20,80,140,0.35)";const x=i*52;b.fillRect(x,560+hash(i)*200,8+hash(i*3)*10,700)}
 // falling chunks
 for(let i=0;i<6;i++){const st=0.4+i*0.5;if(t<st)continue;const k=t-st;const x=200+hash(i*9)*700,y=600+k*k*900;if(y>1300){const sp=ss(0,0.6,(y-1300)/600);glow(b,x,1290,220*sp+40,"#fff",0.6*(1-sp));continue}b.save();b.translate(x,y);b.rotate(k*(i%2?1:-1));b.fillStyle="#e8f6ff";b.fillRect(-70,-50,140,100);b.restore()}
 waves(b,t,1280,"#2a6e9a","#061a2c",10)}
function rise(b,t){vgrad(b,"#0a1420","#02060c");const lvl=lerp(1700,700,ss(0,3.5,t));
 for(let i=0;i<=40;i++){const y=1720-i*25;b.fillStyle="#fff";b.fillRect(110,y,i%4==0?60:30,4);if(i%4==0)txt(b,"+"+i+"",200,y,"700 30px 'IBM Plex Mono'","#fff","left")}
 waves(b,t,lvl,"rgba(40,120,200,0.85)","rgba(5,30,60,0.95)",16);txt(b,"+"+Math.round(lerp(0,40,ss(0,3.5,t)))+" CM",680,560,"400 220px 'League Gothic'","#fff")}
function venice(b,t){fill(b,lg(b,0,0,0,H,[[0,"#2a1030"],[0.55,"#ff7a4a"],[1,"#200818"]]));glow(b,540,980,400,"#ffcf7a",0.7);
 const base=1300;b.fillStyle="#1a0a14";b.fillRect(0,base-160,W,170);
 b.fillRect(700,base-760,80,620);b.beginPath();b.moveTo(690,base-760);b.lineTo(740,base-880);b.lineTo(790,base-760);b.fill();
 for(const [x,r] of [[260,150],[430,110],[120,90]]){b.beginPath();b.arc(x,base-160,r,Math.PI,0);b.fill();b.fillRect(x-8,base-160-r-60,16,60)}
 for(let i=0;i<8;i++){b.fillRect(i*140,base-260-hash(i)*80,110,120)}
 const lvl=lerp(base+60,base-900,ss(0.6,4.4,t));waves(b,t,lvl,"rgba(30,90,140,0.88)","rgba(5,20,40,0.98)",14);
 const r=R(2);for(let i=0;i<40;i++){const x=r()*W,y=((lvl+r()*900)-t*200*(0.5+r()))%H;if(y>lvl)  {b.strokeStyle="rgba(255,255,255,0.4)";b.lineWidth=2;b.beginPath();b.arc(x,y,4+r()*8,0,6.283);b.stroke()}}}
const SH=[[0,glacier],[${m2},rise],[${v2},venice]];
function cam(t){if(t<${m2})return {z:1.02+t*0.02,...shake(t,10,5)};if(t<${v2})return {z:1.0};return {z:1.0+(t-${v2})*0.02,y:(t-${v2})*-10}}
`});
}

// OCTUBRE (special)
{
  const at = VO_AT, el = T("oct1", "elecciones"), con = T("oct1", "con");
  const o1end = +(at + VODUR.oct1).toFixed(2), slam = +(o1end + 1.9).toFixed(2), o2 = +(slam + 0.5).toFixed(2);
  const dur = +(o2 + VODUR.oct2 + 1.4).toFixed(2);
  month({ id: "oct", dur, voList: [["oct1", at], ["oct2", o2]], month: "OCTUBRE", tag: ["ELECCIONES", "ESCRUTADO 100%"], tagAt: con - 0.2, cuts: [el, con, o1end, slam],
    sfx: [["crowd", el, 0.5], ["flash", con + 0.3, 0.6], ["heart", o1end + 0.1, 0.9], ["riser", slam - 3.0, 0.6], ["boom1", slam - 0.02, 1.0], ["boom2", slam, 0.8], ["press", slam + 0.2, 0.5], ["flash", slam + 0.5, 0.7]],
    js: String.raw`
function urna(b,t){fill(b,lg(b,0,0,0,H,[[0,"#06111e"],[1,"#020509"]]));glow(b,540,700,700,"#74acdf",0.35);beam(b,540,0,0,1500,380,"#cfe6ff",0.25);
 const r=R(3);for(let i=0;i<30;i++){const st=r()*3;if(t<st)continue;const k=(t-st)%2.2;const x=420+r()*240,y=200+k*k*500;if(y>860)continue;b.save();b.translate(x,y);b.rotate(Math.sin(k*4+i));b.fillStyle="#fff";b.fillRect(-50,-30,100,60);b.fillStyle="#74acdf";b.fillRect(-50,-30,100,12);b.restore()}
 b.fillStyle="rgba(220,235,255,0.18)";b.fillRect(300,880,480,520);b.strokeStyle="#cfe6ff";b.lineWidth=6;b.strokeRect(300,880,480,520);b.fillStyle="#0a1a2a";b.fillRect(420,870,240,22);
 b.fillStyle="#74acdf";b.fillRect(300,1060,480,40);b.fillStyle="#fff";b.fillRect(300,1100,480,40);b.fillStyle="#74acdf";b.fillRect(300,1140,480,40);glow(b,540,1120,40,"#f6b40e",0.9)}
function count(b,t){vgrad(b,"#030308","#000");const r=R(8);
 for(let i=0;i<40;i++){const st=r()*2.5,ph=(t*3+r()*10)%1;if(ph<0.06){glow(b,r()*W,900+r()*800,300,"#fff",0.9)}}
 for(let row=0;row<4;row++)for(let i=0;i<12;i++){const x=i*95+(row%2)*40,y=1350+row*140+Math.sin(t*3+i+row)*8;person(b,x,y,0.6+row*0.12,"#000");if(hash(i*3+row)>0.6){b.fillStyle="#cfe6ff";b.fillRect(x+40,y-270,26,40);glow(b,x+53,y-250,50,"#cfe6ff",0.5)}}
 const p=ss(0,2.6,t);b.fillStyle="#111";b.fillRect(140,560,800,70);b.fillStyle="#74acdf";b.fillRect(140,560,800*p,70);txt(b,(p*100).toFixed(2).replace(".",",")+"% MESAS ESCRUTADAS",540,700,"700 40px 'IBM Plex Mono'","#fff")}
function black(b,t){fill(b,"#000");const a=0.5+0.5*Math.sin(t*9);b.fillStyle="rgba(255,255,255,"+(0.15*a)+")";b.fillRect(0,959,W,2);txt(b,"SEÑAL INTERRUMPIDA",540,1020,"700 30px 'IBM Plex Mono'","rgba(255,255,255,0.35)")}
function strobe(b,t){fill(b,"#050505");const r=R(Math.floor(t*12));for(let i=0;i<5;i++){if(r()<0.5)glow(b,r()*W,r()*H,500,"#fff",0.5)}
 for(let i=0;i<14;i++){const x=i*80;person(b,x,1880,0.9,"#000")}}
const SH=[[0,(b,t)=>{fill(b,"#000");glow(b,540,900,500,"#74acdf",0.2*ss(0,1,t))}],[${el},urna],[${con},count],[${o1end},black],[${slam},strobe]];
function cam(t){if(t<${o1end})return {z:1.0+t*0.02};if(t<${slam})return {z:1};const k=t-${slam};return {z:1.0+k*0.02,...shake(t,k<0.5?40*(1-k*2):3,14)}}
`,
    overlay: {
      html: `<div id="oct-paper"><div id="oct-mast">EDICIÓN EXTRA · OCTUBRE 2027</div><div id="oct-h1">MILEI<br>REELECTO</div><div id="oct-h2">4 AÑOS MÁS</div></div>`,
      css: `#oct-paper{position:absolute;left:130px;top:380px;width:760px;height:720px;background:#ece8de;color:#111;padding:40px 44px;box-shadow:0 50px 140px rgba(0,0,0,.95)}
        #oct-mast{font-family:'IBM Plex Mono';font-size:28px;font-weight:700;border-bottom:4px solid #111;padding-bottom:16px;letter-spacing:.06em}
        #oct-h1{font-family:'League Gothic';font-size:222px;line-height:.88;margin-top:30px}#oct-h2{font-family:'League Gothic';font-size:130px;line-height:1;margin-top:16px;color:#b3261e}`,
      tl: `tl.fromTo("#oct-paper",{opacity:0,scale:3,rotation:-30},{opacity:1,scale:1,rotation:-3,duration:.4,ease:"power4.in"},${(slam - 0.4).toFixed(2)});
        tl.fromTo("#oct-paper",{scale:1},{scale:1.07,duration:${(dur - slam).toFixed(2)},ease:"none",immediateRender:false},${slam});`,
    },
  });
}

// NOVIEMBRE
{
  const v3 = T("nov", "patagonia"), nn = T("nov", "nuevo");
  month({ id: "nov", vo: "nov", month: "NOVIEMBRE", tag: ["ARGENTINA", "COMPRADOR: ELON MUSK"], cuts: [v3, nn],
    sfx: [["wind", 0, 0.6], ["boom2", v3 + 2.2, 0.5], ["glitch2", nn + 1.0, 0.8]],
    js: String.raw`
function mts(b,t,day){fill(b,lg(b,0,0,0,H,[[0,"#1b2a4a"],[0.4,"#e48a5a"],[0.62,"#ffd3a0"],[1,"#0d0d14"]]));glow(b,700,980,500,"#ffcf8a",0.6);
 const layers=[["#5a6a8a",900,0.3,3],["#3a4560",1050,0.5,5],["#1c2236",1180,0.8,8]];
 layers.forEach(([c,base,par,seed])=>{const r=R(seed);b.fillStyle=c;b.beginPath();b.moveTo(-100,H);let x=-100;const off=t*20*par;b.lineTo(-100-off,base);while(x<W+200){x+=60+r()*80;const pk=seed==3&&x>450&&x<800?-520:0;b.lineTo(x-off,base-r()*300+pk*(1-Math.abs(x-620)/180))}b.lineTo(W+200,H);b.closePath();b.fill()});
 // snow caps
 b.fillStyle="rgba(255,255,255,0.7)";b.beginPath();b.moveTo(560-6,520);b.lineTo(620-6,380);b.lineTo(680-6,520);b.closePath();b.fill();
 // condor
 const cx=(t*120+100)%1300-100,cy=500+Math.sin(t)*30;b.strokeStyle="#000";b.lineWidth=8;b.beginPath();b.moveTo(cx-70,cy-10+Math.sin(t*3)*8);b.quadraticCurveTo(cx-30,cy-30,cx,cy);b.quadraticCurveTo(cx+30,cy-30,cx+70,cy-10+Math.sin(t*3)*8);b.stroke();
 b.fillStyle="#0a0a10";b.fillRect(0,1500,W,420);snow(b,t,5,140,"#fff",120,8,3,0.5)}
function sign(b,t,sold){mts(b,t,1);b.fillStyle="#2a1a10";b.fillRect(330,1050,30,560);b.fillRect(720,1050,30,560);
 b.save();b.translate(540,950);b.rotate(Math.sin(t*1.3)*0.015);b.fillStyle="#f3efe6";b.fillRect(-330,-200,660,380);b.strokeStyle="#c21c1c";b.lineWidth=16;b.strokeRect(-310,-180,620,340);txt(b,"SE VENDE",0,-60,"400 180px 'League Gothic'","#c21c1c");txt(b,"PATAGONIA · 1.000.000 KM²",0,90,"700 32px 'IBM Plex Mono'","#222");
 if(sold>0){b.globalAlpha=sold;b.rotate(-0.18);b.fillStyle="#111";b.fillRect(-360,-70,720,140);txt(b,"VENDIDA",0,8,"400 140px 'League Gothic'","#fff")}b.restore()}
function road(b,t){mts(b,t+5,1);b.fillStyle="#141414";b.beginPath();b.moveTo(500,1260);b.lineTo(580,1260);b.lineTo(900,H);b.lineTo(180,H);b.closePath();b.fill();
 for(let i=0;i<8;i++){const k=((i/8+t*0.4)%1);const y=lerp(1270,H,k*k),w=lerp(4,30,k*k);b.fillStyle="#f6d04d";b.fillRect(540-w/2+lerp(0,0,k),y,w,lerp(10,80,k*k))}
 const sw=t>1.0;b.save();b.translate(540,760);b.fillStyle="#555";b.fillRect(-12,120,24,420);b.fillStyle=sw?"#111":"#0b6b3a";rr(b,-400,-150,800,300,20);b.fill();b.strokeStyle="#fff";b.lineWidth=8;rr(b,-385,-135,770,270,14);b.stroke();
 txt(b,"BIENVENIDOS A",0,-70,"700 44px Inter","#fff");txt(b,sw?"X-TAGONIA":"PATAGONIA",0,30,"400 150px 'League Gothic'",sw?"#fff":"#fff");b.restore()}
const SH=[[0,(b,t)=>mts(b,t,0)],[${v3},(b,t)=>sign(b,t,ss(2.2,2.5,t))],[${nn},road]];
function cam(t){if(t<${v3})return {z:1.05+t*0.02,x:-t*6};if(t<${nn}){const k=t-${v3};return {z:1.0+k*0.02,...shake(t,k>2.2&&k<2.7?24:2,10)}}return {z:1.0+(t-${nn})*0.03}}
`});
}

// DICIEMBRE
{
  const n2 = T("dic", "nadie");
  const offAt = +(VO_AT + VODUR.dic + 0.1).toFixed(2);
  month({ id: "dic", vo: "dic", month: "DICIEMBRE", tag: ["VIDEOJUEGOS", "JUGADORES EN LÍNEA: 0"], cuts: [n2], grey: 0.6,
    sfx: [["whoosh2", 0.05, 0.4], ["tvoff", offAt - 0.3, 0.8]],
    js: String.raw`
function tv(b,t,close,off){fill(b,"#030304");const s=close?1.9:1;b.save();b.translate(540,close?900:860);b.scale(s,s);
 const sc=off>0?Math.max(0.004,1-off):1;glow(b,0,0,600*sc,"#7fa0ff",0.25*sc);b.fillStyle="#111";rr(b,-330,-260,660,500,40);b.fill();
 b.save();b.scale(1,sc);b.fillStyle=lg(b,0,-220,0,220,[[0,"#1a2a6a"],[1,"#0a1030"]]);rr(b,-290,-220,580,420,30);b.fill();
 txt(b,"NUEVA TEMPORADA",0,-120,"400 76px 'League Gothic'","#9fb4ff");txt(b,"JUGADORES EN LÍNEA",0,-30,"700 26px 'IBM Plex Mono'","#9fb4ff");txt(b,"0",0,90,"400 180px 'League Gothic'",Math.floor(t*2)%2?"#fff":"#9fb4ff");
 for(let y=-220;y<200;y+=6){b.fillStyle="rgba(0,0,0,0.25)";b.fillRect(-290,y,580,3)}b.restore();
 if(off>0.9){glow(b,0,0,40,"#fff",1)}b.restore();
 if(!close){b.fillStyle="#08080a";b.fillRect(0,1300,W,620);b.save();b.translate(300,1500);b.rotate(0.3);b.fillStyle="#141418";rr(b,-130,-60,260,120,60);b.fill();b.restore()}
 dust(b,t,8,90,"#bcc8ff",0.5,2,0.5)}
const SH=[[0,(b,t)=>tv(b,t,false,0)],[${n2},(b,t)=>tv(b,t,true,ss(${(offAt - n2 - 0.3).toFixed(2)},${(offAt - n2).toFixed(2)},t))]];
function cam(t){if(t<${n2})return {z:1.0+t*0.03};return {z:1.0+(t-${n2})*0.02}}
`});
}

// EPILOGUE
{
  const at = 1.0, dur = +(at + VODUR.epi + 3.4).toFixed(2), id = "epi";
  const end = +(at + VODUR.epi + 0.6).toFixed(2);
  scenes.push({ id, dur, vo: [["epi", at]], cuts: [end], sfx: [["wind", 0.2, 0.7], ["static", end - 0.1, 0.4]],
    js: String.raw`
function room(b,t){vgrad(b,"#0b0b0c","#151516");b.fillStyle="#2a2c30";b.fillRect(640,360,340,520);b.strokeStyle="#000";b.lineWidth=14;b.strokeRect(640,360,340,520);
 glow(b,810,620,600,"#c0c6d0",0.45);glow(b,390,1180,380,"#9aa0a8",0.25);b.fillStyle="#050506";b.fillRect(0,1240,W,680);b.fillStyle="#0a0a0c";b.fillRect(130,760,520,330);b.fillStyle="#1a1b1e";b.fillRect(146,776,488,298);
 b.fillStyle="#3a2414";rr(b,700,1100,280,150,10);b.fill();b.strokeStyle="#6a5a30";b.lineWidth=5;b.stroke();
 person(b,390,1420,1.9,"#000");dust(b,t,2,70,"#aaa",0.3,2,0.4);desat(b,1)}
function end(b,t){fill(b,"#000");txt(b,"2027",540,900,"400 300px 'League Gothic'","rgba(255,255,255,"+(0.18*ss(0.2,1.2,t))+")")}
const SH=[[0,room],[${end},end]];
function cam(t){return {z:1.0+t*0.015}}
`,
    overlay: { html: `<div id="epi-date" class="ov-mono">5 DIC 2027</div>`, css: `#epi-date{position:absolute;left:120px;top:300px;font-size:34px;color:#aaa;letter-spacing:.08em}`,
      tl: `tl.fromTo("#epi-date",{opacity:0},{opacity:1,duration:.6},.4);tl.fromTo("#epi-date",{opacity:1},{opacity:0,duration:.3,immediateRender:false},${(end - 0.3).toFixed(2)});` } });
}

// ------------------------------------------------------------------ timing
let tcur = 0;
for (const s of scenes) { s.start = +tcur.toFixed(2); tcur += s.dur; }
const TOTAL = +tcur.toFixed(2);

// ------------------------------------------------------------------ scene file
function sceneFile(s, idx) {
  const isMonth = !!s.month;
  const gl = s.cuts.map((c) => `Math.max(0,1-Math.abs(t-${c})/0.14)`).join(",");
  const greyAmt = idx / (scenes.length - 1); // drift to grey
  const ov = s.overlay || { html: "", css: "", tl: "" };
  const monthHtml = isMonth ? `
    <div id="${s.id}-live" class="ov-live"><b></b>EN VIVO · ${s.tag[0]}</div>
    <div id="${s.id}-title" class="ov-title"><span class="g1" data-layout-ignore>${s.month}</span><span class="g2" data-layout-ignore>${s.month}</span><span class="m">${s.month}</span></div>
    <div id="${s.id}-days" class="ov-days"><i></i>DÍAS SIN TOKEN: <b id="${s.id}-dn">${DAYS[s.id][0]}</b></div>
    <div id="${s.id}-tag" class="ov-tag"><span class="k">2027</span><span class="v">${s.tag[1]}</span></div>` : "";
  const ts = s.month && s.month.length > 8 ? 190 : 230;
  const monthTl = isMonth ? `
    tl.fromTo("#${s.id}-live",{opacity:0,x:-40},{opacity:1,x:0,duration:.3,ease:"power3.out"},.1);
    tl.fromTo("#${s.id}-title",{opacity:0,scale:1.8,transformOrigin:"0% 50%"},{opacity:1,scale:1,duration:.28,ease:"power4.in"},.02);
    tl.fromTo("#${s.id}-title .g1",{x:-26,opacity:.9},{x:0,opacity:0,duration:.6,ease:"power2.out"},.3);
    tl.fromTo("#${s.id}-title .g2",{x:26,opacity:.9},{x:0,opacity:0,duration:.6,ease:"power2.out"},.3);
    tl.fromTo("#${s.id}-title",{opacity:1},{opacity:${s.id === "oct" ? 0 : 0.0},duration:.3,immediateRender:false},${s.id === "oct" ? (s.cuts[3] - 2.4).toFixed(2) : Math.min(3.2, s.cuts[0] + 0.6).toFixed(2)});
    tl.fromTo("#${s.id}-days",{opacity:0,y:10},{opacity:1,y:0,duration:.3},.5);
    {const D={v:${DAYS[s.id] ? DAYS[s.id][0] : 0}};tl.fromTo(D,{v:${DAYS[s.id] ? DAYS[s.id][0] : 0}},{v:${DAYS[s.id] ? DAYS[s.id][1] : 0},duration:1.2,ease:"power2.out",onUpdate(){document.querySelector("#${s.id}-dn").textContent=Math.round(D.v)}},.6);}
    tl.fromTo("#${s.id}-days",{opacity:1},{opacity:0,duration:.25,immediateRender:false},${(s.id === "oct" ? s.cuts[2] - 0.3 : s.dur - 0.3).toFixed(2)});
    tl.fromTo("#${s.id}-tag",{opacity:0,x:-60},{opacity:1,x:0,duration:.35,ease:"power3.out"},${s.tagAt.toFixed(2)});
    tl.fromTo("#${s.id}-tag",{opacity:1},{opacity:0,duration:.2,immediateRender:false},${(s.id === "oct" ? s.cuts[2] : s.dur - 0.3).toFixed(2)});
    tl.fromTo("#${s.id}-live b",{opacity:1},{opacity:.2,duration:.4,yoyo:true,repeat:${Math.max(1, Math.floor(s.dur / 0.8) * 2 - 1)},ease:"none"},.2);` : "";
  return `<template>
  <style>
    #root{position:absolute;inset:0;background:#000;overflow:hidden}
    #${s.id}-c{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
    .ov-mono{font-family:'IBM Plex Mono';font-weight:700}
    .ov-live{position:absolute;left:120px;top:296px;font-family:'IBM Plex Mono';font-weight:700;font-size:30px;letter-spacing:.06em;color:#fff;background:#d91e18;padding:6px 16px;display:flex;align-items:center;gap:12px}
    .ov-live b{display:block;width:16px;height:16px;border-radius:50%;background:#fff}
    .ov-title{position:absolute;left:116px;top:350px;font-family:'League Gothic';font-size:${ts}px;line-height:.9;color:#fff;text-shadow:0 10px 60px rgba(0,0,0,.8)}
    .ov-title span{display:block}.ov-title .g1,.ov-title .g2{position:absolute;left:0;top:0}.ov-title .g1{color:#ff2a55;mix-blend-mode:screen}.ov-title .g2{color:#00e5ff;mix-blend-mode:screen}
    .ov-days{position:absolute;left:120px;top:590px;font-family:'IBM Plex Mono';font-weight:700;font-size:30px;color:#ffc53a;display:flex;align-items:center;gap:12px;text-shadow:0 2px 12px #000}
    .ov-days b{color:#fff;font-size:34px}.ov-days i{display:block;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff2b0,#d4a020 60%,#7a5508);box-shadow:0 0 14px rgba(255,197,58,.6);position:relative;overflow:hidden}
    .ov-days i:after{content:"";position:absolute;left:15px;top:-2px;width:4px;height:40px;background:#1a0f00;transform:rotate(25deg)}
    .ov-tag{position:absolute;left:120px;top:990px;display:flex;font-family:'Archivo Black';font-size:34px;box-shadow:0 10px 40px rgba(0,0,0,.6)}
    .ov-tag .k{background:#d91e18;color:#fff;padding:12px 18px}.ov-tag .v{background:#fff;color:#111;padding:12px 22px;white-space:nowrap}
    ${ov.css}
  </style>
  <div id="root" data-composition-id="${s.id}" data-width="${W}" data-height="${H}">
    <canvas id="${s.id}-c" width="${W}" height="${H}"></canvas>
    ${monthHtml}
    ${ov.html}
  </div>
  <script>
  (function(){
    ${ENGINE}
    ${s.js}
    const C=document.querySelector("#${s.id}-c"),ctx=C.getContext("2d");
    const B=document.createElement("canvas");B.width=W;B.height=H;const b=B.getContext("2d");
    const GREY=${(s.grey ?? greyAmt * 0.75).toFixed(2)};
    function draw(t){let k=0;for(let i=0;i<SH.length;i++)if(t>=SH[i][0])k=i;b.save();b.setTransform(1,0,0,1,0,0);b.globalAlpha=1;b.globalCompositeOperation="source-over";SH[k][1](b,t-SH[k][0]);b.restore();desat(b,GREY);
      const g=Math.max(0,${gl || "0"});composite(ctx,B,t,cam(t),g,${idx + 1});}
    const tl=gsap.timeline({paused:true});const S={t:0};
    tl.fromTo(S,{t:0},{t:${s.dur},duration:${s.dur},ease:"none",onUpdate:()=>draw(S.t)},0);
    ${monthTl}
    ${ov.tl}
    draw(0);
    window.__timelines["${s.id}"]=tl;
  })();
  </script>
</template>
`;
}

// ------------------------------------------------------------------ fx overlay (grain, scanlines, vignette, cut flashes)
function fxFile() {
  const cutsAbs = scenes.slice(1).map((s) => s.start);
  return `<template>
  <style>
    #root{position:absolute;inset:0;pointer-events:none}
    #fx-c{position:absolute;left:0;top:0;width:${W}px;height:${H}px;image-rendering:pixelated}
    #fx-scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.22) 0 2px,transparent 2px 5px)}
    #fx-vig{position:absolute;inset:0;background:radial-gradient(ellipse 75% 60% at 50% 45%,rgba(0,0,0,0) 40%,rgba(0,0,0,.75) 100%)}
    #fx-flash{position:absolute;inset:0;background:#fff;opacity:0}
  </style>
  <div id="root" data-composition-id="fx" data-width="${W}" data-height="${H}">
    <canvas id="fx-c" width="${W / 4}" height="${H / 4}"></canvas>
    <div id="fx-scan"></div><div id="fx-vig"></div><div id="fx-flash"></div>
  </div>
  <script>
  (function(){
    const C=document.querySelector("#fx-c"),c=C.getContext("2d"),w=C.width,h=C.height;const img=c.createImageData(w,h);
    const CUTS=${JSON.stringify(cutsAbs)};const TOT=${TOTAL};
    function R(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
    function draw(t){const f=Math.floor(t*30);const r=R(f*13+7);let near=0;for(const k of CUTS){near=Math.max(near,1-Math.abs(t-k)/0.12)}
      const base=0.10+0.22*(t/TOT)+0.7*Math.max(0,near);const d=img.data;
      for(let i=0;i<d.length;i+=4){const v=r();d[i]=d[i+1]=d[i+2]=v>0.5?255:0;d[i+3]=Math.abs(v-0.5)*2*255*base*0.55}c.putImageData(img,0,0);}
    const tl=gsap.timeline({paused:true});const S={t:0};
    tl.fromTo(S,{t:0},{t:${TOTAL},duration:${TOTAL},ease:"none",onUpdate:()=>draw(S.t)},0);
    draw(0);
    window.__timelines["fx"]=tl;
  })();
  </script>
</template>
`;
}

// ------------------------------------------------------------------ captions
function captions() {
  const chunks = [];
  for (const s of scenes) for (const [vid, off] of s.vo) {
    const words = tx(vid).words.filter((w) => w.type === "word");
    let cur = [];
    const flush = () => { if (cur.length) { chunks.push({ text: cur.map((w) => w.text).join(" "), start: s.start + off + cur[0].start, end: s.start + off + cur[cur.length - 1].end }); cur = []; } };
    for (const w of words) {
      w.text = w.text.replace(/["“”]/g, "").replace(/^(Ghasty|Gasty|Gusty|Gasti)/i, "Gasti");
      cur.push(w);
      if (/[.,:;!?]$/.test(w.text) || cur.length >= 3) flush();
    }
    flush();
  }
  // durations: until next chunk start or +0.4
  chunks.forEach((c, i) => { const nx = chunks[i + 1]; let e = c.end + 0.35; if (nx && nx.start < e) e = nx.start - 0.02; c.dur = +(e - c.start).toFixed(3); c.start = +c.start.toFixed(3); });
  const html = chunks.map((c, i) => `<div id="cap${i}" class="clip cap" data-start="${c.start}" data-duration="${c.dur}" data-track-index="1"><span id="cap${i}-t">${c.text.replace(/[.,:;]$/, "").toUpperCase()}</span></div>`).join("\n    ");
  const tl = chunks.map((c, i) => `tl.fromTo("#cap${i}-t",{scale:1.25,opacity:0},{scale:1,opacity:1,duration:.12,ease:"back.out(3)"},${c.start});`).join("\n    ");
  return `<template>
  <style>
    #root{position:absolute;inset:0;pointer-events:none}
    .cap{position:absolute;left:120px;width:760px;top:1110px;height:150px;display:flex;align-items:center;justify-content:center;text-align:center}
    .cap span{display:inline-block;font-family:'Archivo Black';font-size:58px;line-height:1.05;color:#fff;-webkit-text-stroke:3px #000;paint-order:stroke fill;text-shadow:0 6px 0 #000,0 0 30px rgba(0,0,0,.9)}
  </style>
  <div id="root" data-composition-id="caps" data-width="${W}" data-height="${H}">
    ${html}
  </div>
  <script>
    (function(){const tl=gsap.timeline({paused:true});
    ${tl}
    window.__timelines["caps"]=tl;})();
  </script>
</template>
`;
}

// ------------------------------------------------------------------ audio
const SFXDUR = {}; for (const f of fs.readdirSync(path.join(ROOT, "assets/sfx"))) SFXDUR[f.replace(".mp3", "")] = null;
const sfxLen = JSON.parse(fs.readFileSync(path.join(ROOT, "sfxlen.json"), "utf8"));
const LOUD = JSON.parse(fs.readFileSync(path.join(ROOT, "loudness.json"), "utf8"));
// target loudness (LUFS) per sound, voice sits at -16: music ~16 dB under, effects 8-14 dB under
const SFX_TARGET = { boom1: -25, boom2: -26, riser: -27, chest: -27, coin: -28, power: -28, ice: -29, water: -30, wind: -32, crowd: -32, flash: -29, press: -29, heart: -27, cat: -29, alarm: -30, tvoff: -28, whoosh1: -30, whoosh2: -30 };
const gain = (key, target) => Math.min(3.9, Math.pow(10, (target - LOUD[key]) / 20)).toFixed(3);
const audio = []; let an = 0;
const lanes = {};
function placeAudio(src, start, dur, vol, kind, extra = "") {
  // pick lowest lane of this kind with no overlap
  const base = { vo: 10, music: 20, sfx: 30 }[kind];
  let lane = base;
  for (;;) { const L = (lanes[lane] = lanes[lane] || []); if (!L.some(([a, b]) => start < b && a < start + dur)) { L.push([start, start + dur]); break; } lane++; }
  audio.push(`<audio id="au${++an}" class="clip" src="${src}" data-start="${start.toFixed(3)}" data-duration="${dur.toFixed(3)}" data-track-index="${lane}" data-volume="${vol}"${extra}></audio>`);
}
for (const s of scenes) {
  for (const [vid, off] of s.vo) placeAudio(`assets/vo/${vid}.mp3`, s.start + off, VODUR[vid], 1, "vo");
  for (const [name, t] of s.sfx.filter(([n]) => !/^(glitch|static)/.test(n))) placeAudio(`assets/sfx/${name}.mp3`, Math.max(0, s.start + t), sfxLen[name], gain("sfx/" + name, (s.id === "oct" && /boom/.test(name) ? -21 : SFX_TARGET[name] ?? -28)), "sfx");
  // a static burst on every scene cut
}
// music: bed1 until julio, bed2 after; silence during october blackout
const jul = scenes.find((s) => s.id === "jul").start;
const oct = scenes.find((s) => s.id === "oct");
const blackStart = oct.start + oct.cuts[2], slamAbs = oct.start + oct.cuts[3];
function bed(file, from, to, vol) { for (let t = from; t < to - 0.5; t += 20.5) { const d = Math.min(22.0, to - t); placeAudio(file, t, d, vol, "music", ` data-fade-in="${t === from ? 0.8 : 1.5}" data-fade-out="1.5"`); } }
bed("assets/music/bed1.mp3", 0, jul + 1.5, gain("music/bed1", -32));
bed("assets/music/bed2.mp3", jul, blackStart + 0.3, gain("music/bed2", -31));
bed("assets/music/bed2.mp3", slamAbs + 0.6, TOTAL, gain("music/bed2", -30));

// ------------------------------------------------------------------ index
const hosts = scenes.map((s) => `<div id="${s.id}" class="clip" data-composition-id="${s.id}" data-composition-src="compositions/${s.id}.html" data-start="${s.start}" data-duration="${s.dur}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`);
hosts.push(`<div id="fx" class="clip" data-composition-id="fx" data-composition-src="compositions/fx.html" data-start="0" data-duration="${TOTAL}" data-track-index="2" data-track-kind="graphics" data-width="${W}" data-height="${H}" style="z-index:5"></div>`);
hosts.push(`<div id="caps" class="clip" data-composition-id="caps" data-composition-src="compositions/caps.html" data-start="0" data-duration="${TOTAL}" data-track-index="3" data-track-kind="captions" data-width="${W}" data-height="${H}" style="z-index:6"></div>`);

const index = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;background:#000}#root{position:relative;width:100%;height:100%;background:#000}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">
      ${hosts.join("\n      ")}
      ${audio.join("\n      ")}
    </div>
    <script>window.__timelines["main"]=gsap.timeline({paused:true});</script>
  </body>
</html>
`;

fs.mkdirSync(path.join(ROOT, "compositions"), { recursive: true });
scenes.forEach((s, i) => fs.writeFileSync(path.join(ROOT, "compositions", s.id + ".html"), sceneFile(s, i)));
fs.writeFileSync(path.join(ROOT, "compositions/fx.html"), fxFile());
fs.writeFileSync(path.join(ROOT, "compositions/caps.html"), captions());
fs.writeFileSync(path.join(ROOT, "index.html"), index);
console.log("TOTAL", TOTAL, scenes.map((s) => `${s.id}@${s.start}(${s.dur}) cuts=${s.cuts.join(",")}`).join("\n"));
