// Generates the scene files and index.html for the "2027" vertical film.
import fs from "node:fs";
import path from "node:path";

const OUT = new URL(".", import.meta.url).pathname;
const W = 1080, H = 1920;

// ---------- palette drift: saturated -> grey across the year ----------
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
const hex = (r, g, b) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
function pal(t) {
  // t: 0 (enero) .. 1 (diciembre)
  return {
    bg: hex(lerp(14, 22, t), lerp(17, 22, t), lerp(26, 22, t)),
    ink: hex(lerp(244, 170, t), lerp(244, 170, t), lerp(240, 170, t)),
    dim: hex(lerp(130, 95, t), lerp(138, 95, t), lerp(150, 95, t)),
    acc: hex(lerp(255, 120, t), lerp(59, 112, t), lerp(48, 110, t)),
    cold: hex(lerp(90, 120, t), lerp(170, 124, t), lerp(255, 128, t)),
  };
}

// ---------- months ----------
const MONTHS = [
  { id: "ene", name: "ENERO", kicker: "ÚLTIMO MOMENTO · TECNOLOGÍA",
    lines: ["Elon Musk compra", "Instagram, TikTok,", "YouTube y WhatsApp.", "Mandar un mensaje: pago."] },
  { id: "feb", name: "FEBRERO", kicker: "ÚLTIMO MOMENTO · MÚSICA",
    lines: ["Taylor Swift saca", "un álbum sorpresa", "y gana Álbum del Año.", "No compitió nadie más."] },
  { id: "mar", name: "MARZO", kicker: "ÚLTIMO MOMENTO · CLIMA",
    lines: ["52 °C en Buenos Aires.", "Se cortan la luz", "y el agua el mismo día."] },
  { id: "abr", name: "ABRIL", kicker: "ÚLTIMO MOMENTO · TRABAJO",
    lines: ["La IA reemplaza a la", "mitad de los trabajos.", "El anuncio lo escribió", "una IA."] },
  { id: "may", name: "MAYO", kicker: "ÚLTIMO MOMENTO · TECNOLOGÍA",
    lines: ["Musk compra todas", "las redes que quedaban.", "Internet: una app,", "un dueño."] },
  { id: "jun", name: "JUNIO", kicker: "ÚLTIMO MOMENTO · SALUD ANIMAL",
    lines: ["Un virus desconocido", "ataca a los gatos.", "Siguen mirando la pared.", "Ahora con motivo."] },
  { id: "jul", name: "JULIO", kicker: "ÚLTIMO MOMENTO · ANTÁRTIDA",
    lines: ["Se desprende un bloque", "de hielo del tamaño", "de Uruguay.", "Los científicos callan."] },
  { id: "ago", name: "AGOSTO", kicker: "ÚLTIMO MOMENTO · OMS",
    lines: ["El virus felino", "es terminal.", "La OMS declara pandemia.", "Para los gatos."] },
  { id: "sep", name: "SEPTIEMBRE", kicker: "ÚLTIMO MOMENTO · CLIMA",
    lines: ["Glaciares perdidos:", "Perito Moreno, Himalaya.", "El mar sube 40 cm.", "Venecia deja de existir."] },
  { id: "oct", name: "OCTUBRE", kicker: "ELECCIONES PRESIDENCIALES · ARGENTINA", lines: [] },
  { id: "nov", name: "NOVIEMBRE", kicker: "ÚLTIMO MOMENTO · ARGENTINA",
    lines: ["La Patagonia, en venta.", "La compra Elon Musk.", "Nuevo nombre:", "X-tagonia."] },
  { id: "dic", name: "DICIEMBRE", kicker: "ÚLTIMO MOMENTO · VIDEOJUEGOS",
    lines: ["Nueva temporada", "de Fortnite.", "Nadie tiene ganas", "de jugar."] },
];

// timing
const PRO = 7, M = 5.5, OCT = 7.5, EPI = 8.5;
let t = PRO;
MONTHS.forEach((m) => { m.start = t; m.dur = m.id === "oct" ? OCT : M; t += m.dur; });
const EPI_START = t; // 75
const TOTAL = EPI_START + EPI; // 83

// ---------- shared scene CSS ----------
const msize = (id) => Math.min(300, Math.floor(2280 / MONTHS.find((m) => m.id === id).name.length));
function baseCss(p, id) {
  return `
    #root { position:absolute; inset:0; background:${p.bg}; overflow:hidden; font-family:"Inter",sans-serif; color:${p.ink}; }
    #${id}-vig { position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 50% 42%, rgba(255,255,255,0.05), rgba(0,0,0,0.55) 100%); }
    #${id}-lines { position:absolute; inset:0; background:repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 6px); }
    #${id}-kicker { position:absolute; left:120px; top:296px; font-family:"IBM Plex Mono",monospace; font-size:34px; font-weight:700; letter-spacing:0.06em; color:${p.acc}; display:flex; align-items:center; gap:16px; }
    #${id}-dot { width:18px; height:18px; border-radius:50%; background:${p.acc}; }
    #${id}-month { position:absolute; left:124px; top:${(340 + (300 - msize(id)) * 0.9).toFixed(0)}px; font-family:"League Gothic",sans-serif; font-size:${msize(id)}px; line-height:0.9; letter-spacing:-0.005em; color:${p.ink}; white-space:nowrap; }
    #${id}-year { display:none; }
    #${id}-rule { position:absolute; left:120px; width:768px; top:626px; height:4px; background:${p.ink}; transform-origin:0 50%; }
    #${id}-vis { position:absolute; left:120px; top:660px; width:920px; height:400px; transform:scale(0.835); transform-origin:0 0; }
    #${id}-head { position:absolute; left:120px; width:660px; top:1000px; }
    #${id}-head .ln { display:block; overflow:hidden; }
    #${id}-head .ln span { display:block; font-size:46px; font-weight:700; line-height:1.12; letter-spacing:-0.02em; }
    #${id}-head .ln.last span { color:${p.acc}; }
    .mono { font-family:"IBM Plex Mono",monospace; }
  `;
}

function headMarkup(id, lines) {
  return `<div id="${id}-head">${lines
    .map((l, i) => `<div class="ln${i === lines.length - 1 ? " last" : ""}"><span id="${id}-l${i}">${l}</span></div>`)
    .join("")}</div>`;
}

function baseTl(id, lines, dur) {
  return `
    tl.fromTo("#${id}-month", {opacity:0, scale:1.35, transformOrigin:"0% 50%"}, {opacity:1, scale:1, duration:0.32, ease:"power4.out"}, 0.05);
    tl.fromTo("#${id}-kicker", {opacity:0, x:-30}, {opacity:1, x:0, duration:0.3, ease:"power3.out"}, 0.15);
    tl.fromTo("#${id}-dot", {opacity:1}, {opacity:0.15, duration:0.4, ease:"none", yoyo:true, repeat:${Math.floor(dur / 0.8) * 2 - 1}}, 0.4);
    tl.fromTo("#${id}-year", {opacity:0}, {opacity:1, duration:0.3}, 0.3);
    tl.fromTo("#${id}-rule", {scaleX:0}, {scaleX:1, duration:0.5, ease:"power3.inOut"}, 0.2);
    ${lines.map((_, i) => `tl.fromTo("#${id}-l${i}", {yPercent:110}, {yPercent:0, duration:0.42, ease:"power3.out"}, ${(1.0 + i * 0.42).toFixed(2)});`).join("\n    ")}
    tl.fromTo("#${id}-all", {opacity:1, y:0}, {opacity:0, y:-40, duration:0.22, ease:"power2.in"}, ${(dur - 0.26).toFixed(2)});
  `;
}

// ---------- per-month visuals: [markup, css, timeline] ----------
function visual(m, p) {
  const id = m.id;
  switch (id) {
    case "ene": {
      const apps = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "WHATSAPP"];
      const mk = apps.map((a, i) => `
        <div class="ene-chip" data-layout-allow-overlap id="ene-c${i}" style="left:${(i % 2) * 470}px; top:${Math.floor(i / 2) * 200}px">
          <span>${a}</span>
          <div class="ene-stamp" id="ene-s${i}">COMPRADO</div>
        </div>`).join("");
      const css = `
        .ene-chip { position:absolute; width:450px; height:170px; border:3px solid ${p.dim}; border-radius:28px; display:flex; align-items:center; justify-content:center; font-family:"IBM Plex Mono",monospace; font-size:40px; font-weight:700; color:${p.ink}; }
        .ene-stamp { position:absolute; padding:8px 22px; border:6px solid ${p.acc}; color:${p.acc}; font-family:"League Gothic",sans-serif; font-size:76px; letter-spacing:0.04em; background:${p.bg}; }`;
      const tl = apps.map((_, i) => `
        tl.fromTo("#ene-c${i}", {opacity:0, y:30}, {opacity:1, y:0, duration:0.3, ease:"power3.out"}, ${(0.5 + i * 0.1).toFixed(2)});
        tl.fromTo("#ene-s${i}", {opacity:0, scale:2.2, rotation:-14}, {opacity:1, scale:1, rotation:-8, duration:0.2, ease:"power4.in"}, ${(1.6 + i * 0.45).toFixed(2)});
        tl.fromTo("#ene-c${i} span", {opacity:1}, {opacity:0.25, duration:0.2}, ${(1.8 + i * 0.45).toFixed(2)});`).join("");
      return [mk, css, tl];
    }
    case "feb": {
      const mk = `
        <svg id="feb-disc" width="380" height="380" viewBox="-190 -190 380 380" style="position:absolute;left:20px;top:10px">
          <circle r="186" fill="#0b0b0d" stroke="${p.dim}" stroke-width="3"/>
          ${[160, 140, 120, 100].map((r) => `<circle r="${r}" fill="none" stroke="#2a2a30" stroke-width="2"/>`).join("")}
          <circle r="62" fill="${p.acc}"/><circle r="8" fill="#0b0b0d"/>
          <rect x="-4" y="-150" width="8" height="40" fill="#ffffff22"/>
        </svg>
        <div id="feb-cat" class="mono" style="position:absolute;left:450px;top:40px;font-size:34px;color:${p.dim};line-height:1.5">CATEGORÍA<br><span style="color:${p.ink};font-size:44px;font-weight:700">ÁLBUM DEL AÑO</span></div>
        <div id="feb-nom" class="mono" style="position:absolute;left:450px;top:200px;font-size:34px;color:${p.dim};line-height:1.5">NOMINADOS<br><span id="feb-n" style="color:${p.acc};font-size:96px;font-weight:700">1</span></div>`;
      const tl = `
        tl.fromTo("#feb-disc", {opacity:0, x:-60, rotation:0}, {opacity:1, x:0, duration:0.4, ease:"power3.out"}, 0.5);
        tl.fromTo("#feb-disc", {rotation:0}, {rotation:540, duration:4.6, ease:"none", immediateRender:false}, 0.5);
        tl.fromTo("#feb-cat", {opacity:0, y:20}, {opacity:1, y:0, duration:0.3}, 0.8);
        tl.fromTo("#feb-nom", {opacity:0, y:20}, {opacity:1, y:0, duration:0.3}, 1.4);
        tl.fromTo("#feb-n", {scale:1.6, opacity:0}, {scale:1, opacity:1, duration:0.25, ease:"back.out(3)"}, 1.6);`;
      return [mk, "", tl];
    }
    case "mar": {
      const mk = `
        <div id="mar-tube" style="position:absolute;left:30px;top:0;width:90px;height:380px;border:4px solid ${p.dim};border-radius:45px;overflow:hidden">
          <div id="mar-fill" style="position:absolute;left:0;right:0;bottom:0;height:100%;background:${p.acc};transform-origin:50% 100%"></div>
        </div>
        <div id="mar-num" style="position:absolute;left:180px;top:20px;font-family:'League Gothic',sans-serif;font-size:260px;line-height:1;color:${p.acc}">24°C</div>
        <div id="mar-off" class="mono" style="position:absolute;left:190px;top:290px;font-size:34px;line-height:1.35;white-space:nowrap;color:${p.dim}">LUZ: <b style="color:${p.ink}">SIN SERVICIO</b><br>AGUA: <b style="color:${p.ink}">SIN SERVICIO</b></div>`;
      const tl = `
        tl.fromTo("#mar-tube", {opacity:0}, {opacity:1, duration:0.3}, 0.5);
        tl.fromTo("#mar-fill", {scaleY:0.2}, {scaleY:0.95, duration:2.4, ease:"power2.in"}, 0.6);
        const mt = {v:24};
        tl.fromTo(mt, {v:24}, {v:52, duration:2.4, ease:"power2.in", onUpdate(){ document.querySelector("#mar-num").textContent = Math.round(mt.v) + "°C"; }}, 0.6);
        tl.fromTo("#mar-num", {opacity:0}, {opacity:1, duration:0.2}, 0.6);
        tl.fromTo("#mar-num", {x:0}, {x:6, duration:0.05, yoyo:true, repeat:9, ease:"none", immediateRender:false}, 3.0);
        tl.fromTo("#mar-off", {opacity:0}, {opacity:1, duration:0.1, ease:"none"}, 3.2);`;
      return [mk, "", tl];
    }
    case "abr": {
      let mk = "";
      for (let i = 0; i < 20; i++) {
        const x = (i % 10) * 92, y = Math.floor(i / 10) * 150;
        mk += `<div class="abr-p" style="left:${x}px;top:${y}px"><div class="abr-h"></div><div class="abr-b"></div><div class="abr-bot" id="abr-r${i}"></div></div>`;
      }
      mk += `<div class="mono" style="position:absolute;left:0;top:320px;font-size:34px;color:${p.dim}">EMPLEOS HUMANOS</div>
             <div id="abr-pct" class="mono" style="position:absolute;right:0;top:300px;font-size:64px;font-weight:700;color:${p.acc}">-0%</div>`;
      const css = `
        .abr-p { position:absolute; width:70px; height:130px; }
        .abr-h { position:absolute; left:17px; top:0; width:36px; height:36px; border-radius:50%; background:${p.ink}; }
        .abr-b { position:absolute; left:5px; top:44px; width:60px; height:80px; border-radius:30px 30px 8px 8px; background:${p.ink}; }
        .abr-bot { position:absolute; left:0; top:0; width:70px; height:124px; border-radius:6px; background:${p.bg}; border:4px solid ${p.acc}; opacity:0; }`;
      const order = [3, 17, 8, 12, 0, 15, 6, 19, 10, 5];
      const tl = `
        tl.fromTo(".abr-p", {opacity:0, y:20}, {opacity:1, y:0, duration:0.25, stagger:0.02}, 0.45);
        ${order.map((k, j) => `tl.fromTo("#abr-r${k}", {opacity:0, scale:0.6}, {opacity:1, scale:1, duration:0.14, ease:"power4.out"}, ${(1.5 + j * 0.2).toFixed(2)});`).join("\n        ")}
        const at = {v:0};
        tl.fromTo(at, {v:0}, {v:50, duration:2.0, ease:"none", onUpdate(){ document.querySelector("#abr-pct").textContent = "-" + Math.round(at.v) + "%"; }}, 1.5);`;
      return [mk, css, tl];
    }
    case "may": {
      const names = ["X", "FACEBOOK", "REDDIT", "TWITCH", "SNAPCHAT", "DISCORD", "PINTEREST", "LINKEDIN", "TELEGRAM", "THREADS", "BLUESKY", "SPOTIFY"];
      let mk = "";
      names.forEach((n, i) => {
        const x = (i % 3) * 310, y = Math.floor(i / 3) * 96;
        mk += `<div class="may-c" id="may-c${i}" style="left:${x}px;top:${y}px">${n}</div>`;
      });
      mk += `<div id="may-one" style="position:absolute;left:260px;top:110px;width:400px;height:160px;border-radius:36px;background:${p.acc};display:flex;align-items:center;justify-content:center;font-family:'League Gothic',sans-serif;font-size:110px;color:${p.bg}">LA APP</div>`;
      const css = `.may-c { position:absolute; width:290px; height:76px; border:3px solid ${p.dim}; border-radius:18px; display:flex; align-items:center; justify-content:center; font-family:"IBM Plex Mono",monospace; font-size:28px; font-weight:700; color:${p.ink}; }`;
      const tl = `
        tl.fromTo(".may-c", {opacity:0, scale:0.8}, {opacity:1, scale:1, duration:0.25, stagger:0.04}, 0.45);
        ${names.map((_, i) => {
          const x = (i % 3) * 310, y = Math.floor(i / 3) * 96;
          return `tl.fromTo("#may-c${i}", {x:0, y:0}, {x:${315 - x}, y:${152 - y}, scale:0.3, opacity:0, duration:0.5, ease:"power3.in"}, ${(1.7 + (i % 4) * 0.06).toFixed(2)});`;
        }).join("\n        ")}
        tl.fromTo("#may-one", {opacity:0, scale:0.3}, {opacity:1, scale:1, duration:0.35, ease:"back.out(2.2)"}, 2.25);`;
      return [mk, css, tl];
    }
    case "jun":
    case "ago": {
      const cat = (cls, extra = "") => `
        <svg class="${cls}" ${extra} viewBox="0 0 240 260">
          <path d="M60 250 C30 250 30 160 70 140 C60 110 64 70 80 50 L86 10 L110 44 L140 44 L164 10 L170 50 C186 70 190 110 180 140 C220 160 220 250 190 250 Z" fill="currentColor"/>
          <path d="M190 245 C240 240 250 190 228 170" stroke="currentColor" stroke-width="16" fill="none" stroke-linecap="round"/>
        </svg>`;
      if (id === "jun") {
        const mk = `
          <div id="jun-wall" style="position:absolute;left:640px;top:0;width:280px;height:380px;background:repeating-linear-gradient(0deg, ${p.dim}55 0 3px, transparent 3px 46px), ${p.ink}10;border-left:4px solid ${p.dim}"></div>
          <div id="jun-catw" style="position:absolute;left:250px;top:110px;width:240px;height:260px;color:${p.ink}">${cat("jun-svg", 'width="240" height="260"')}</div>
          <div id="jun-q" style="position:absolute;left:530px;top:40px;font-family:'League Gothic',sans-serif;font-size:140px;color:${p.acc}">?</div>
          <div id="jun-dx" class="mono" style="position:absolute;left:0;top:30px;font-size:34px;color:${p.dim};line-height:1.6">DIAGNÓSTICO<br><b style="color:${p.acc};font-size:36px">DESCONOCIDO</b></div>`;
        const tl = `
          tl.fromTo("#jun-wall", {opacity:0}, {opacity:1, duration:0.4}, 0.4);
          tl.fromTo("#jun-catw", {opacity:0, x:-40}, {opacity:1, x:0, duration:0.5, ease:"power2.out"}, 0.6);
          tl.fromTo("#jun-catw", {scale:1}, {scale:1.04, duration:2.5, ease:"sine.inOut", transformOrigin:"50% 100%", immediateRender:false}, 1.1);
          tl.fromTo("#jun-q", {opacity:0, y:20}, {opacity:1, y:0, duration:0.3, ease:"back.out(3)"}, 1.9);
          tl.fromTo("#jun-dx", {opacity:0}, {opacity:1, duration:0.1}, 2.4);`;
        return [mk, "", tl];
      }
      let mk = "";
      for (let i = 0; i < 4; i++) mk += `<div class="ago-cat" id="ago-k${i}" style="left:${i * 230}px">${cat("", 'width="190" height="206"')}</div>`;
      mk += `<div id="ago-st" style="position:absolute;left:70px;top:70px;padding:10px 34px;border:8px solid ${p.acc};color:${p.acc};font-family:'League Gothic',sans-serif;font-size:150px;line-height:1;letter-spacing:0.03em;background:${p.bg}cc">PANDEMIA</div>
             <div id="ago-sub" class="mono" style="position:absolute;left:0;top:330px;font-size:34px;color:${p.dim}">ALERTA MÁXIMA · ESPECIE: <b style="color:${p.ink}">FELIS CATUS</b></div>`;
      const css = `.ago-cat { position:absolute; top:80px; width:190px; height:206px; color:${p.dim}; }`;
      const tl = `
        tl.fromTo(".ago-cat", {opacity:0, y:20}, {opacity:1, y:0, duration:0.3, stagger:0.08}, 0.4);
        tl.fromTo(".ago-cat", {color:"${p.dim}"}, {color:"${p.acc}", duration:0.2, stagger:0.1, immediateRender:false}, 1.2);
        tl.fromTo("#ago-st", {opacity:0, scale:2.4, rotation:-10}, {opacity:1, scale:1, rotation:-6, duration:0.2, ease:"power4.in"}, 1.8);
        tl.fromTo("#ago-sub", {opacity:0}, {opacity:1, duration:0.1}, 2.3);`;
      return [mk, css, tl];
    }
    case "jul": {
      const mk = `
        <svg id="jul-svg" width="920" height="380" viewBox="0 0 920 380" style="position:absolute;left:0;top:0">
          <path id="jul-sea" d="M0 0H920V380H0Z" fill="${p.cold}12"/>
          <path id="jul-ice" d="M80 120 L250 60 L420 90 L560 40 L700 110 L640 200 L700 290 L520 330 L330 300 L180 330 L110 250 Z" fill="${p.ink}"/>
          <path id="jul-chunk" d="M700 110 L800 140 L840 230 L760 300 L700 290 L640 200 Z" fill="${p.ink}"/>
          <path id="jul-crack" d="M700 110 L640 200 L700 290" stroke="${p.acc}" stroke-width="6" fill="none" stroke-dasharray="260" stroke-dashoffset="260"/>
        </svg>
        <div id="jul-tag" class="mono" style="position:absolute;left:420px;top:340px;white-space:nowrap;font-size:34px;font-weight:700;color:${p.acc}">≈ 176.000 km² · URUGUAY</div>`;
      const tl = `
        tl.fromTo("#jul-svg", {opacity:0}, {opacity:1, duration:0.4}, 0.4);
        tl.fromTo("#jul-crack", {strokeDashoffset:260}, {strokeDashoffset:0, duration:0.6, ease:"power2.in"}, 1.2);
        tl.fromTo("#jul-chunk", {x:0, y:0, rotation:0}, {x:70, y:30, rotation:8, svgOrigin:"760 200", duration:3.0, ease:"power1.inOut"}, 1.9);
        tl.fromTo("#jul-crack", {opacity:1}, {opacity:0, duration:0.3, immediateRender:false}, 2.2);
        tl.fromTo("#jul-tag", {opacity:0}, {opacity:1, duration:0.1}, 2.4);`;
      return [mk, "", tl];
    }
    case "sep": {
      const mk = `
        <div id="sep-box" style="position:absolute;left:0;top:0;width:920px;height:380px;overflow:hidden;border-bottom:4px solid ${p.dim}">
          <div id="sep-city" style="position:absolute;left:0;right:0;top:120px;text-align:center;font-family:'League Gothic',sans-serif;font-size:220px;line-height:1;color:${p.ink}">VENECIA</div>
          <div id="sep-water" style="position:absolute;left:0;right:0;bottom:0;height:380px;background:linear-gradient(${p.cold}cc, ${p.cold}88);transform-origin:50% 100%"></div>
        </div>
        <div id="sep-lvl" class="mono" style="position:absolute;right:0;top:-8px;font-size:60px;font-weight:700;color:${p.acc}">+0 cm</div>`;
      const tl = `
        tl.fromTo("#sep-box", {opacity:0}, {opacity:1, duration:0.3}, 0.4);
        tl.fromTo("#sep-water", {scaleY:0.05}, {scaleY:0.95, duration:3.4, ease:"power1.in"}, 0.7);
        tl.fromTo("#sep-city", {y:0}, {y:60, duration:3.4, ease:"power1.in"}, 0.7);
        const st = {v:0};
        tl.fromTo(st, {v:0}, {v:40, duration:3.4, ease:"power1.in", onUpdate(){ document.querySelector("#sep-lvl").textContent = "+" + Math.round(st.v) + " cm"; }}, 0.7);`;
      return [mk, "", tl];
    }
    case "nov": {
      const mk = `
        <svg id="nov-map" width="420" height="380" viewBox="0 0 420 380" style="position:absolute;left:0;top:0">
          <path d="M150 0 L300 10 L330 60 L300 110 L280 170 L240 220 L230 280 L190 330 L170 380 L120 360 L130 300 L110 240 L120 170 L110 100 L130 40 Z" fill="${p.ink}" stroke="${p.dim}" stroke-width="3"/>
        </svg>
        <div id="nov-tag" data-layout-allow-overlap style="position:absolute;left:300px;top:40px;padding:6px 28px;background:${p.acc};color:${p.bg};font-family:'League Gothic',sans-serif;font-size:96px;transform:rotate(-6deg)"><span id="nov-sale">SE VENDE</span></div>
        <div id="nov-sold" data-layout-allow-overlap style="position:absolute;left:300px;top:40px;padding:6px 28px;background:${p.ink};color:${p.bg};font-family:'League Gothic',sans-serif;font-size:96px">VENDIDA</div>
        <div id="nov-n1" style="position:absolute;left:460px;top:230px;font-family:'League Gothic',sans-serif;font-size:130px;line-height:1;color:${p.dim}">PATAGONIA</div>
        <div id="nov-n2" data-layout-allow-overlap style="position:absolute;left:460px;top:230px;font-family:'League Gothic',sans-serif;font-size:130px;line-height:1;color:${p.acc}">X-TAGONIA</div>`;
      const tl = `
        tl.fromTo("#nov-map", {opacity:0, y:30}, {opacity:1, y:0, duration:0.4}, 0.4);
        tl.fromTo("#nov-tag", {opacity:0}, {opacity:1, duration:0.12}, 0.9);
        tl.fromTo("#nov-n1", {opacity:0}, {opacity:1, duration:0.3}, 0.9);
        tl.fromTo("#nov-sold", {opacity:0, scale:1.6, rotation:-6}, {opacity:1, scale:1, rotation:-6, duration:0.18, ease:"power4.in"}, 2.1);
        tl.fromTo("#nov-n1", {opacity:1, x:0}, {opacity:0, x:-30, duration:0.25, immediateRender:false}, 2.8);
        tl.fromTo("#nov-n2", {opacity:0, x:30}, {opacity:1, x:0, duration:0.25}, 2.95);`;
      return [mk, "", tl];
    }
    case "dic": {
      const mk = `
        <div id="dic-card" style="position:absolute;left:0;top:0;width:920px;height:380px;border:3px solid ${p.dim};border-radius:24px">
          <div class="mono" style="position:absolute;left:40px;top:40px;font-size:34px;color:${p.dim}">NUEVA TEMPORADA · DISPONIBLE</div>
          <div class="mono" style="position:absolute;left:40px;top:120px;font-size:34px;color:${p.dim}">JUGADORES EN LÍNEA</div>
          <div id="dic-n" style="position:absolute;left:40px;top:150px;font-family:'League Gothic',sans-serif;font-size:220px;line-height:1;color:${p.ink}">0</div>
          <div id="dic-cur" style="position:absolute;left:150px;top:180px;width:16px;height:170px;background:${p.ink}"></div>
        </div>`;
      const tl = `
        tl.fromTo("#dic-card", {opacity:0, y:20}, {opacity:1, y:0, duration:0.4}, 0.4);
        tl.fromTo("#dic-cur", {opacity:1}, {opacity:0, duration:0.01, ease:"none", yoyo:true, repeat:9, repeatDelay:0.45}, 0.9);`;
      return [mk, "", tl];
    }
  }
}

function monthScene(m, idx) {
  const p = pal(idx / 11);
  const id = m.id;
  let body, extraCss = "", tlBody;
  if (id === "oct") {
    body = `
      <div id="oct-all">
        <div id="oct-kicker"><div id="oct-dot"></div>ELECCIONES PRESIDENCIALES · ARGENTINA</div>
        <div id="oct-month">OCTUBRE</div>
        <div id="oct-year">2027</div>
        <div id="oct-count" class="mono">ESCRUTADO <span id="oct-pct">0,00</span>%</div>
        <div id="oct-paper">
          <div id="oct-mast">EDICIÓN EXTRA · 2027</div>
          <div id="oct-h1">MILEI<br>REELECTO</div>
          <div id="oct-h2">4 AÑOS MÁS</div>
        </div>
      </div>`;
    extraCss = `
      #root { background:#050505; }
      #oct-kicker { position:absolute; left:120px; top:296px; font-family:"IBM Plex Mono",monospace; font-size:28px; font-weight:700; letter-spacing:0.06em; color:${p.acc}; display:flex; gap:16px; align-items:center; }
      #oct-dot { width:18px; height:18px; border-radius:50%; background:${p.acc}; }
      #oct-month { position:absolute; left:124px; top:340px; font-family:"League Gothic",sans-serif; font-size:300px; line-height:0.9; color:${p.ink}; }
      #oct-year { display:none; }
      #oct-count { position:absolute; left:120px; top:660px; font-size:40px; color:${p.dim}; }
      #oct-paper { position:absolute; left:120px; top:560px; width:768px; height:700px; background:#e9e6df; color:#111; padding:40px 44px; box-shadow:0 40px 120px rgba(0,0,0,0.8); }
      #oct-mast { font-family:"IBM Plex Mono",monospace; font-size:28px; font-weight:700; border-bottom:4px solid #111; padding-bottom:16px; letter-spacing:0.08em; }
      #oct-h1 { font-family:"League Gothic",sans-serif; font-size:224px; line-height:0.88; margin-top:30px; }
      #oct-h2 { font-family:"League Gothic",sans-serif; font-size:130px; line-height:1; margin-top:18px; color:#b3261e; }`;
    tlBody = `
      tl.fromTo("#oct-month", {opacity:0, scale:1.35, transformOrigin:"0% 50%"}, {opacity:1, scale:1, duration:0.32, ease:"power4.out"}, 0.05);
      tl.fromTo("#oct-kicker", {opacity:0}, {opacity:1, duration:0.3}, 0.15);
      tl.fromTo("#oct-year", {opacity:0}, {opacity:1, duration:0.3}, 0.3);
      tl.fromTo("#oct-dot", {opacity:1}, {opacity:0.15, duration:0.4, yoyo:true, repeat:5, ease:"none"}, 0.4);
      tl.fromTo("#oct-count", {opacity:0}, {opacity:1, duration:0.2}, 0.6);
      const oc = {v:0};
      tl.fromTo(oc, {v:0}, {v:100, duration:2.4, ease:"power2.inOut", onUpdate(){ document.querySelector("#oct-pct").textContent = oc.v.toFixed(2).replace(".", ","); }}, 0.7);
      tl.fromTo("#oct-month, #oct-kicker, #oct-year, #oct-count", {opacity:1}, {opacity:0, duration:0.15}, 3.3);
      tl.fromTo("#oct-paper", {opacity:0, scale:2.6, rotation:-22, y:-300}, {opacity:1, scale:1, rotation:-2, y:-250, duration:0.42, ease:"power4.in"}, 3.45);
      tl.fromTo("#oct-all", {x:0, y:0}, {x:14, y:-10, duration:0.04, yoyo:true, repeat:7, ease:"none"}, 3.87);
      tl.fromTo("#oct-paper", {scale:1}, {scale:1.06, duration:3.2, ease:"none", immediateRender:false}, 3.9);
      tl.fromTo("#oct-all", {opacity:1}, {opacity:0, duration:0.2, immediateRender:false}, ${(OCT - 0.24).toFixed(2)});`;
  } else {
    const [vm, vcss, vtl] = visual(m, p);
    body = `
      <div id="${id}-all">
        <div id="${id}-kicker"><div id="${id}-dot"></div>${m.kicker}</div>
        <div id="${id}-month">${m.name}</div>
        <div id="${id}-year">2027</div>
        <div id="${id}-rule"></div>
        <div id="${id}-vis">${vm}</div>
        ${headMarkup(id, m.lines)}
      </div>`;
    extraCss = baseCss(p, id) + vcss;
    tlBody = baseTl(id, m.lines, m.dur) + vtl;
  }
  return `<template>
  <style>
    #root { position:absolute; inset:0; background:${p.bg}; overflow:hidden; font-family:"Inter",sans-serif; color:${p.ink}; }
    ${extraCss}
    #${id}-all, #oct-all { position:absolute; inset:0; }
  </style>
  <div id="root" data-composition-id="${id}" data-width="${W}" data-height="${H}">
    ${id === "oct" ? "" : `<div id="${id}-vig"></div><div id="${id}-lines"></div>`}
    ${body}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    ${tlBody}
    window.__timelines["${id}"] = tl;
  </script>
</template>
`;
}

// ---------- chest + silhouette, shared by prologue/epilogue ----------
function chestSvg(pfx, ink, acc, top = 700) {
  return `
    <svg id="${pfx}-chest" width="520" height="430" viewBox="0 0 520 430" style="position:absolute;left:280px;top:${top}px;overflow:visible">
      <g id="${pfx}-glowg"><ellipse id="${pfx}-glow" cx="260" cy="170" rx="250" ry="120" fill="${acc}" opacity="0"/></g>
      <rect x="40" y="190" width="440" height="220" rx="16" fill="#2a2420" stroke="${ink}" stroke-width="6"/>
      <rect x="40" y="250" width="440" height="20" fill="${ink}" opacity="0.5"/>
      <rect x="236" y="220" width="48" height="70" rx="6" fill="${ink}"/>
      <g id="${pfx}-lid"><path d="M40 190 L40 120 Q260 20 480 120 L480 190 Z" fill="#3a302a" stroke="${ink}" stroke-width="6"/></g>
      <g id="${pfx}-item" opacity="0"><rect x="170" y="110" width="180" height="40" rx="6" fill="#8a8a8a"/><rect x="300" y="150" width="30" height="50" fill="#8a8a8a"/><rect x="190" y="98" width="40" height="14" fill="#8a8a8a"/></g>
    </svg>
    <svg id="${pfx}-gasti" width="420" height="380" viewBox="0 0 420 380" style="position:absolute;left:330px;top:${top + 300}px">
      <circle cx="210" cy="110" r="78" fill="#000"/>
      <path d="M40 380 Q40 200 210 200 Q380 200 380 380 Z" fill="#000"/>
    </svg>`;
}

function prologue() {
  const ink = "#e8e6e0", acc = "#ff3b30";
  return `<template>
  <style>
    #root { position:absolute; inset:0; background:#0d1018; overflow:hidden; font-family:"Inter",sans-serif; color:${ink}; }
    #pro-vig { position:absolute; inset:0; background:radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,255,255,0.06), rgba(0,0,0,0.7)); }
    #pro-time { position:absolute; left:120px; top:296px; font-family:"IBM Plex Mono",monospace; font-size:34px; font-weight:700; color:${acc}; letter-spacing:0.05em; }
    #pro-title { position:absolute; left:120px; width:768px; top:360px; font-family:"League Gothic",sans-serif; font-size:118px; line-height:0.94; }
    #pro-title b { color:${acc}; font-weight:400; }
    #pro-label { position:absolute; left:120px; top:400px; font-family:"IBM Plex Mono",monospace; font-size:34px; font-weight:700; color:#9a9a9a; letter-spacing:0.08em; }
    #pro-t1, #pro-t2 { position:absolute; left:120px; width:740px; font-weight:700; letter-spacing:-0.02em; }
    #pro-t1 { top:470px; font-size:62px; line-height:1.1; }
    #pro-t2 { top:640px; font-size:40px; color:#9a9a9a; font-weight:400; }
    #pro-black { position:absolute; inset:0; background:#000; }
  </style>
  <div id="root" data-composition-id="pro" data-width="${W}" data-height="${H}">
    <div id="pro-vig"></div>
    <div id="pro-time">5 DIC 2026 · 23:59</div>
    <div id="pro-title">QUÉ PASA EN 2027 SI GASTI <b>NO GANA EL TOKEN PIRATA</b></div>
    ${chestSvg("pro", ink, acc, 790)}
    <div id="pro-label">ARMA GRIS · COMÚN</div>
    <div id="pro-t1">Gasti no consiguió el token pirata.</div>
    <div id="pro-t2">Nadie le dio importancia.</div>
    <div id="pro-black"></div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
        tl.fromTo("#pro-time", {opacity:1}, {opacity:0.2, duration:0.4, yoyo:true, repeat:3, ease:"none"}, 0.2);
    tl.fromTo("#pro-chest", {y:0}, {y:-6, duration:0.06, yoyo:true, repeat:5, ease:"none"}, 2.3);
    tl.fromTo("#pro-lid", {rotation:0}, {rotation:-28, svgOrigin:"40 150", duration:0.35, ease:"back.out(2)"}, 2.9);
    tl.fromTo("#pro-glow", {opacity:0}, {opacity:0.18, duration:0.3}, 2.95);
    tl.fromTo("#pro-glow", {fill:"${acc}"}, {fill:"#777777", duration:0.5, immediateRender:false}, 3.3);
    tl.fromTo("#pro-item", {opacity:0, y:40}, {opacity:1, y:-50, duration:0.6, ease:"power3.out"}, 3.1);
    tl.fromTo("#pro-label", {opacity:0}, {opacity:1, duration:0.2}, 3.5);
    tl.fromTo("#pro-title", {opacity:1}, {opacity:0, duration:0.3}, 2.95);
    tl.fromTo("#pro-t1", {opacity:0, y:20}, {opacity:1, y:0, duration:0.4, ease:"power3.out"}, 3.9);
    tl.fromTo("#pro-t2", {opacity:0}, {opacity:1, duration:0.5}, 5.2);
    tl.fromTo("#pro-black", {opacity:0}, {opacity:1, duration:0.2}, ${PRO - 0.45});
    window.__timelines["pro"] = tl;
  </script>
</template>
`;
}

function epilogue() {
  const ink = "#9a9a9a", acc = "#8a8a8a";
  return `<template>
  <style>
    #root { position:absolute; inset:0; background:#151515; overflow:hidden; font-family:"Inter",sans-serif; color:${ink}; }
    #epi-vig { position:absolute; inset:0; background:radial-gradient(ellipse 70% 50% at 50% 50%, rgba(255,255,255,0.03), rgba(0,0,0,0.8)); }
    #epi-time { position:absolute; left:120px; top:296px; font-family:"IBM Plex Mono",monospace; font-size:34px; font-weight:700; color:#777; letter-spacing:0.05em; }
    #epi-t1 { position:absolute; left:120px; width:740px; top:420px; font-size:64px; font-weight:700; color:#bdbdbd; letter-spacing:-0.02em; }
    #epi-end { position:absolute; left:0; right:0; top:820px; text-align:center; font-family:"League Gothic",sans-serif; font-size:260px; color:#2a2a2a; }
    #epi-black { position:absolute; inset:0; background:#000; }
  </style>
  <div id="root" data-composition-id="epi" data-width="${W}" data-height="${H}">
    <div id="epi-vig"></div>
    <div id="epi-time">5 DIC 2027</div>
    ${chestSvg("epi", ink, acc)}
    <div id="epi-t1">Gasti sigue sin el token.</div>
    <div id="epi-black"></div>
    <div id="epi-end">2027</div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#epi-black", {opacity:1}, {opacity:0, duration:0.8}, 0);
    tl.fromTo("#epi-time", {opacity:0}, {opacity:1, duration:0.4}, 0.6);
    tl.fromTo("#epi-chest", {opacity:0.6}, {opacity:1, duration:1}, 0.6);
    tl.fromTo("#epi-t1", {opacity:0}, {opacity:1, duration:0.8}, 2.2);
    tl.fromTo("#epi-black", {opacity:0}, {opacity:1, duration:0.15, immediateRender:false}, 5.0);
    tl.fromTo("#epi-end", {opacity:0}, {opacity:1, duration:0.6}, 5.3);
    window.__timelines["epi"] = tl;
  </script>
</template>
`;
}

function hud() {
  // year progress strip across the months
  const segs = MONTHS.map((m, i) => `<div class="hud-s"><div class="hud-f" id="hud-f${i}"></div><span>${m.name[0]}</span></div>`).join("");
  const span = EPI_START - PRO;
  const tl = MONTHS.map((m, i) =>
    `tl.fromTo("#hud-f${i}", {scaleX:0}, {scaleX:1, duration:${(m.dur - 0.05).toFixed(2)}, ease:"none"}, ${(m.start - PRO).toFixed(2)});`
  ).join("\n    ");
  return `<template>
  <style>
    #root { position:absolute; inset:0; pointer-events:none; }
    #hud-bar { position:absolute; left:80px; right:80px; top:180px; display:flex; gap:8px; }
    .hud-s { position:relative; flex:1; height:6px; background:rgba(255,255,255,0.15); }
    .hud-f { position:absolute; inset:0; background:rgba(255,255,255,0.75); transform-origin:0 50%; }
    .hud-s span { position:absolute; left:0; top:12px; font-family:"IBM Plex Mono",monospace; font-size:16px; color:rgba(255,255,255,0.6); }
  </style>
  <div id="root" data-composition-id="hud" data-width="${W}" data-height="${H}">
    <div id="hud-bar" data-layout-ignore>${segs}</div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    ${tl}
    tl.fromTo("#hud-bar", {opacity:1}, {opacity:1, duration:0.01}, ${(span - 0.02).toFixed(2)});
    window.__timelines["hud"] = tl;
  </script>
</template>
`;
}

// ---------- audio plan ----------
const audio = [];
let n = 0;
const DUR = {"sfx_001.mp3":4.2,"sfx_002.mp3":2.0,"sfx_004.mp3":13,"sfx_005.mp3":2.1,"sfx_006.mp3":0.57,"sfx_008.mp3":4.4};
const A = (src, start, vol, extra = "") => audio.push(`<audio id="a${++n}" class="clip" src="assets/sfx/${src}" data-start="${start.toFixed(3)}" data-track-index="${extra.lane ?? 20}" data-volume="${vol}"${extra.attrs ? " " + extra.attrs : ` data-duration="${DUR[src]}"`}></audio>`);
// drone bed: overlapping 13 s pieces, lane 21/22 alternating
for (let s = 0, k = 0; s < TOTAL - 4; s += 11, k++) {
  const dur = Math.min(13, TOTAL - s);
  A("sfx_004.mp3", s, 0.32, { lane: 21 + (k % 2), attrs: `data-duration="${dur.toFixed(2)}" data-fade-in="1.5" data-fade-out="1.5"` });
}
// prologue: chest open impact (peak 0.073s) at 1.9
A("sfx_005.mp3", 2.9 - 0.073 + 0.033, 0.6, { lane: 20 });
// month cuts: rotate whoosh takes (006 peak .162; 002 peak 1.952)
MONTHS.forEach((m, i) => {
  if (m.id === "oct") return;
  if (i % 2 === 0) A("sfx_006.mp3", m.start + 0.08 - 0.162 + 0.033 < 0 ? 0 : m.start + 0.08 - 0.162 + 0.033, 0.7, { lane: 20 });
  else A("sfx_002.mp3", Math.max(0, m.start + 0.12 - 1.952 + 0.033), 0.28, { lane: 23 });
});
// stamps / slams inside months: impact on enero first stamp, agosto pandemia, nov vendida
const ene = MONTHS[0], ago = MONTHS[7], nov = MONTHS[10], oct = MONTHS[9];
A("sfx_005.mp3", ene.start + 1.8 - 0.073 + 0.033, 0.35, { lane: 24 });
A("sfx_005.mp3", ago.start + 2.0 - 0.073 + 0.033, 0.45, { lane: 24 });
A("sfx_005.mp3", nov.start + 2.28 - 0.073 + 0.033, 0.35, { lane: 24 });
// october payoff: whoosh+boom, peak 0.99 → paper lands at 3.87
A("sfx_001.mp3", oct.start + 3.87 - 0.99 + 0.033, 1.0, { lane: 25 });
A("sfx_005.mp3", oct.start + 3.87 - 0.073 + 0.033, 0.7, { lane: 24 });
// epilogue rumble
A("sfx_008.mp3", EPI_START + 0.2, 0.9, { lane: 25 });

// ---------- index ----------
const hosts = [
  `<div id="pro" class="clip" data-composition-id="pro" data-composition-src="compositions/pro.html" data-start="0" data-duration="${PRO}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`,
  ...MONTHS.map((m) => `<div id="${m.id}" class="clip" data-composition-id="${m.id}" data-composition-src="compositions/${m.id}.html" data-start="${m.start}" data-duration="${m.dur}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`),
  `<div id="epi" class="clip" data-composition-id="epi" data-composition-src="compositions/epi.html" data-start="${EPI_START}" data-duration="${EPI}" data-track-index="1" data-track-kind="graphics" data-width="${W}" data-height="${H}"></div>`,
  `<div id="hud" class="clip" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="${PRO}" data-duration="${EPI_START - PRO}" data-track-index="2" data-track-kind="graphics" data-width="${W}" data-height="${H}" style="z-index:5"></div>`,
];

const index = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      html, body { width:${W}px; height:${H}px; overflow:hidden; background:#000; }
      #root { position:relative; width:100%; height:100%; background:#000; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">
      ${hosts.join("\n      ")}
      ${audio.join("\n      ")}
    </div>
    <script>
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;

fs.mkdirSync(path.join(OUT, "compositions"), { recursive: true });
fs.writeFileSync(path.join(OUT, "compositions/pro.html"), prologue());
fs.writeFileSync(path.join(OUT, "compositions/epi.html"), epilogue());
fs.writeFileSync(path.join(OUT, "compositions/hud.html"), hud());
MONTHS.forEach((m, i) => fs.writeFileSync(path.join(OUT, `compositions/${m.id}.html`), monthScene(m, i)));
fs.writeFileSync(path.join(OUT, "index.html"), index);
console.log("total", TOTAL, "epi", EPI_START, MONTHS.map((m) => m.id + "@" + m.start).join(" "));
