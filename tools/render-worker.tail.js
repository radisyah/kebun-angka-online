
/* ===== Bagian Worker: menggambar layar SATU pemain di OffscreenCanvas (thread & GPU terpisah dari halaman utama) ===== */
(function () {
  let off = null, cx = null, V = null, base = 0.7, qf = 1, paused = false;
  let capLv = 0, lastPaint = 0, nPaint = 0, ticks = 0, msSum = 0, repT = 0, lowN = 0, hiN = 0, lastSize = "";
  const CAP = [60, 60, 45, 30], QF = [1, 0.886, 0.886, 0.886]; // tingkat kualitas: [fps maks], [pengali resolusi]
  const CAPE = 1.5;
  const raf = self.requestAnimationFrame ? (f) => self.requestAnimationFrame(f) : (f) => setTimeout(() => f(performance.now()), 16);

  function resize() {
    if (!off) return;
    const w = Math.round(W * base * qf), h = Math.round(H * base * qf), key = w + "x" + h;
    if (key === lastSize) return;
    lastSize = key; off.width = w; off.height = h;
    if (V) V.pt = 0;
  }
  function paint(now) {
    const sn = V.snap;
    if (!sn.run && V.pt) return false;
    const el = sn.fz || !sn.run ? 0 : Math.min(CAPE, (now - V.at) / 1000);
    if (!el && V.pt === 2) return false;
    V.pt = el ? 1 : 2;
    const view = el ? Object.assign({}, sn, {
      t: sn.t + el,
      peas: sn.peas.map((p) => Object.assign({}, p, { x: p.x + 560 * el })),
      L: sn.L.map((L) => Object.assign({}, L, {
        mx: L.mx >= 0 ? L.mx + 650 * el : L.mx,
        z: L.z.map((z) => (z.eat > 0 || z.st > 0 ? z : Object.assign({}, z, { x: z.x - z.v * el }))),
      })),
    }) : sn;
    g = cx; S = view; hover = null;
    g.setTransform(base * qf, 0, 0, base * qf, 0, 0);
    draw(); info(); frost();
    return true;
  }
  function loop(now) {
    raf(loop);
    if (!cx) return;
    ticks++;
    if (!repT) repT = now;
    if (V && !paused && now - lastPaint >= 1000 / CAP[capLv] - 2) {
      const t0 = performance.now();
      let ok = false;
      try { ok = paint(now); } catch (e) { postMessage({ t: "err", m: String(e && e.message || e) }); cx = null; return; }
      if (ok) { lastPaint = now; nPaint++; msSum += performance.now() - t0; }
    }
    if (now - repT >= 1000) {
      const dt = now - repT, fps = Math.round(nPaint * 1000 / dt), tk = ticks * 1000 / dt, busy = msSum / dt;
      // pengatur kualitas: laju frame browser jatuh di bawah ±50 (GPU/CPU tertinggal) -> turun; lancar ±8 detik -> naik
      const slow = !paused && V && nPaint > 0 && tk < Math.min(50, CAP[capLv] * 0.85);
      if (slow) { lowN++; hiN = 0; } else if (!paused && tk >= 56 && busy < 0.5) { hiN++; lowN = 0; } else lowN = hiN = 0;
      if (lowN >= 2 && capLv < CAP.length - 1) { capLv++; lowN = 0; resize(); }
      else if (hiN >= 8 && capLv > 0) { capLv--; hiN = 0; resize(); }
      postMessage({ t: "fps", f: paused ? -1 : (nPaint ? fps : Math.round(tk)), lv: capLv });
      nPaint = 0; msSum = 0; ticks = 0; repT = now;
    }
  }
  onmessage = (e) => {
    const m = e.data;
    if (m.t === "init") {
      off = m.canvas; base = m.scale || 0.7;
      cx = off.getContext("2d", { alpha: false });
      resize();
      cx.fillStyle = "#0e130b"; cx.fillRect(0, 0, off.width, off.height);
      loadFonts();
      postMessage({ t: "ready" });
      raf(loop);
    } else if (m.t === "snap") V = { snap: m.s, at: performance.now(), pt: 0 };
    else if (m.t === "size") { base = m.scale; resize(); if (V) V.pt = 0; }
    else if (m.t === "pause") { paused = !!m.v; if (V) V.pt = 0; }
    else if (m.t === "clear") { V = null; if (cx) { cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = "#0e130b"; cx.fillRect(0, 0, off.width, off.height); } }
  };
  /* font Oswald/Cinzel untuk worker (opsional; kalau gagal dipakai font cadangan) */
  async function loadFonts() {
    try {
      if (!self.FontFace || !self.fonts) return;
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Oswald:wght@500;700&display=swap")).text();
      const re = /@font-face\s*{([^}]*)}/g; let m;
      while ((m = re.exec(css))) {
        const b = m[1];
        if (!/U\+0000-00FF/i.test(b)) continue; // hanya subset latin
        const fam = /font-family:\s*'?([^';]+)'?/.exec(b), wt = /font-weight:\s*(\d+)/.exec(b), u = /url\(([^)]+)\)/.exec(b);
        if (!fam || !u) continue;
        const f = new FontFace(fam[1], "url(" + u[1] + ")", { weight: wt ? wt[1] : "400" });
        await f.load(); self.fonts.add(f);
      }
      if (V) V.pt = 0;
    } catch (e) {}
  }
  postMessage({ t: "boot" });
})();
