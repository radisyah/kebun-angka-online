/* DIBUAT OTOMATIS oleh tools/build-render-worker.py — jangan edit tangan. */
"use strict";
const window = self;
const localStorage = { getItem() { return null; }, setItem() {} };
const __stub = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : __stub), set: () => true, apply: () => __stub, construct: () => __stub });
const document = { createElement: (t) => (t === "canvas" ? new OffscreenCanvas(1, 1) : __stub), getElementById: () => __stub, querySelector: () => __stub, querySelectorAll: () => [], addEventListener() {}, hidden: false };
const $ = (id) => document.getElementById(id);
      const C = 100,
        R = 5,
        PC = 8,
        W = C * 10,
        Y0 = 56,
        H = Y0 + C * R + 24;
      const cv = $("c");
      let g = cv.getContext("2d");
      const G0 = g;
      cv.width = W;
      cv.height = H;
      const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
      const OPS = {
        "−": [1, 2, 3, 4, 5, 6, 7, 8, 9],
        "+": [1, 2, 3, 4, 5, 6, 7, 8, 9],
        "×": [0, -1],
        "÷": [2, 3, 4, 5, 6, 7, 8, 9],
      };
      const NAME = { "−": "Kurang", "+": "Tambah", "×": "Kali", "÷": "Bagi" };
      const CDS = { "−": 1, "+": 1.5, "×": 6, "÷": 2, "×0": 120 };
      const ck = (o, v) => (o === "×" && v === 0 ? "×0" : o);
      const OC = {
        "−": ["#5cc04a", "#2f7a2e"],
        "+": ["#f2cf3f", "#a9861a"],
        "×": ["#f08a3c", "#a8501a"],
        "÷": ["#5aa9ff", "#2a62a8"],
      };
      const FM = 10,
        RL = 1.3,
        BREAK = 20,
        MAXW = 10;
      const pick = (a) => a[Math.floor(Math.random() * a.length)];
      const lbl = (o, v) => o + (v < 0 ? "−" + -v : v);
      const ap = (n, o, v) =>
        o === "−"
          ? n - v
          : o === "+"
          ? n + v
          : o === "×"
          ? n * v + 0
          : n % v === 0
          ? n / v
          : null;
      const neg1 = (p) => p && p.op === "×" && p.v === -1;
      const can = (m, o, v) =>
        m === 0
          ? false
          : o === "−"
          ? m > 0 && m >= v
          : o === "+"
          ? m < 0 && m + v <= 0
          : o === "×"
          ? v === 0
            ? true
            : m < 0
          : m % v === 0 && Math.abs(m) >= v;
      let S = null,
        hover = null,
        best = 0,
        last = 0,
        mute = false,
        ac = null,
        nb = null;
      try {
        best = +localStorage.getItem("kebun-best") || 0;
      } catch (e) {}

      /* ---------- Latar statis ---------- */
      const flat = document.createElement("canvas");
      flat.width = W;
      flat.height = H;
      (function () {
        const b = flat.getContext("2d"),
          T = Y0 + R * C;
        let seed = 7;
        const rr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        let q = b.createLinearGradient(0, 0, 0, Y0);
        q.addColorStop(0, "#4f86bd");
        q.addColorStop(1, "#d3e4ea");
        b.fillStyle = q;
        b.fillRect(0, 0, W, Y0);
        for (let i = 0; i < 9; i++) {
          const x = rr() * W,
            y = 6 + rr() * 26;
          for (let k = 0; k < 6; k++) {
            q = b.createRadialGradient(x + k * 14, y, 2, x + k * 14, y, 24);
            q.addColorStop(0, "rgba(255,255,255,.55)");
            q.addColorStop(1, "rgba(255,255,255,0)");
            b.fillStyle = q;
            b.fillRect(x + k * 14 - 26, y - 26, 52, 52);
          }
        }
        for (let L = 0; L < 3; L++)
          for (let x = -10; x < W + 20; x += 11 + rr() * 8) {
            const y = Y0 - 4 - L * 5 + rr() * 10,
              r = 14 + rr() * 12,
              g0 = [45, 62, 80][L];
            q = b.createRadialGradient(x - 5, y - 7, 2, x, y, r);
            q.addColorStop(0, `rgb(${g0 + 30},${g0 + 75},${g0})`);
            q.addColorStop(1, `rgb(${g0 - 20},${g0 + 10},${g0 - 25})`);
            b.fillStyle = q;
            b.beginPath();
            b.arc(x, y, r, 0, 7);
            b.fill();
          }
        q = b.createLinearGradient(0, Y0 - 6, 0, T);
        q.addColorStop(0, "#2f4d1c");
        q.addColorStop(1, "#4a7328");
        b.fillStyle = q;
        b.fillRect(0, Y0, W, R * C);
        for (let r = 0; r < R; r++)
          for (let c = 1; c < 10; c++) {
            b.fillStyle =
              (r + c) % 2 ? "rgba(20,50,5,.10)" : "rgba(190,230,110,.07)";
            b.fillRect(c * C, Y0 + r * C, C, C);
          }
        for (let i = 0; i < 5200; i++) {
          const x = C + rr() * (W - C),
            y = Y0 + rr() * R * C,
            l = 5 + rr() * 9,
            v = rr();
          b.strokeStyle = `rgba(${(30 + v * 70) | 0},${(80 + v * 100) | 0},${
            (10 + v * 30) | 0
          },.75)`;
          b.lineWidth = 1;
          b.beginPath();
          b.moveTo(x, y);
          b.quadraticCurveTo(
            x + (rr() - 0.5) * 4,
            y - l * 0.6,
            x + (rr() - 0.5) * 7,
            y - l
          );
          b.stroke();
        }
        for (let i = 0; i < 22; i++) {
          const x = C + rr() * (W - C),
            y = Y0 + rr() * R * C;
          q = b.createRadialGradient(x, y, 2, x, y, 20 + rr() * 22);
          q.addColorStop(0, "rgba(80,58,30,.38)");
          q.addColorStop(1, "rgba(80,58,30,0)");
          b.fillStyle = q;
          b.fillRect(x - 45, y - 45, 90, 90);
        }
        for (let r = 0; r < R; r++)
          for (let c = 0; c < 10; c++) {
            const x = c * C,
              y = Y0 + r * C;
            if (c === 0) {
              q = b.createLinearGradient(x, y, x + C, y + C);
              q.addColorStop(0, "#a39b8a");
              q.addColorStop(1, "#7b7467");
              b.fillStyle = q;
              b.fillRect(x, y, C, C);
              for (let k = 0; k < 160; k++) {
                b.fillStyle = `rgba(${rr() > 0.5 ? 255 : 0},${
                  rr() > 0.5 ? 255 : 0
                },${rr() > 0.5 ? 255 : 0},.05)`;
                b.fillRect(x + rr() * C, y + rr() * C, 2, 2);
              }
              b.strokeStyle = "rgba(30,25,20,.55)";
              b.lineWidth = 2;
              b.strokeRect(x + 3, y + 3, C - 6, C - 6);
            }
            if (c === 9) {
              q = b.createRadialGradient(
                x + C / 2,
                y + C / 2,
                5,
                x + C / 2,
                y + C / 2,
                C * 0.8
              );
              q.addColorStop(0, "rgba(70,52,34,.55)");
              q.addColorStop(1, "rgba(40,30,20,.2)");
              b.fillStyle = q;
              b.fillRect(x, y, C, C);
              for (let k = 0; k < 14; k++) {
                const px = x + rr() * C,
                  py = y + rr() * C;
                q = b.createRadialGradient(px - 1, py - 1, 0, px, py, 4);
                q.addColorStop(0, "#9a9184");
                q.addColorStop(1, "#3d372f");
                b.fillStyle = q;
                b.beginPath();
                b.arc(px, py, 2 + rr() * 3, 0, 7);
                b.fill();
              }
            }
            q = b.createLinearGradient(0, y, 0, y + C);
            q.addColorStop(0, "rgba(255,255,255,.05)");
            q.addColorStop(1, "rgba(0,0,0,.14)");
            b.fillStyle = q;
            b.fillRect(x, y, C, C);
            b.strokeStyle = "rgba(0,0,0,.10)";
            b.lineWidth = 1;
            b.strokeRect(x + 0.5, y + 0.5, C - 1, C - 1);
          }
        for (let x = 0; x < W; x += 24) {
          const y = T + 2;
          q = b.createLinearGradient(x, 0, x + 24, 0);
          q.addColorStop(0, "#7b5a38");
          q.addColorStop(0.5, "#6a4b2e");
          q.addColorStop(1, "#3c2a18");
          b.fillStyle = q;
          b.fillRect(x, y, 23, 24);
          b.strokeStyle = "rgba(30,18,8,.35)";
          b.lineWidth = 1;
          for (let k = 0; k < 5; k++) {
            b.beginPath();
            b.moveTo(x + 3 + k * 4.5, y);
            b.lineTo(x + 4 + k * 4.5 + rr() * 2, y + 24);
            b.stroke();
          }
          b.fillStyle = "#222";
          b.fillRect(x + 11, y + 4, 2, 2);
        }
        q = b.createLinearGradient(0, T - 14, 0, T + 2);
        q.addColorStop(0, "rgba(0,0,0,0)");
        q.addColorStop(1, "rgba(0,0,0,.45)");
        b.fillStyle = q;
        b.fillRect(0, T - 14, W, 16);
        q = b.createLinearGradient(0, Y0, 0, Y0 + 30);
        q.addColorStop(0, "rgba(0,0,0,.4)");
        q.addColorStop(1, "rgba(0,0,0,0)");
        b.fillStyle = q;
        b.fillRect(0, Y0, W, 30);
        q = b.createLinearGradient(0, 0, W, H);
        q.addColorStop(0, "rgba(255,225,150,.14)");
        q.addColorStop(1, "rgba(0,10,30,.18)");
        b.fillStyle = q;
        b.fillRect(0, 0, W, H);
        q = b.createRadialGradient(
          W / 2,
          H / 2,
          H * 0.45,
          W / 2,
          H / 2,
          W * 0.62
        );
        q.addColorStop(0, "rgba(0,0,0,0)");
        q.addColorStop(1, "rgba(0,0,10,.45)");
        b.fillStyle = q;
        b.fillRect(0, 0, W, H);
      })();

      /* ---------- Proyeksi 3D (perspektif) ---------- */
      const SXA = (r) => 0.8 + 0.045 * r,
        SYA = (r) => 0.8 + 0.1 * r;
      const YB = [Y0];
      for (let r = 0; r < R; r++) YB.push(YB[r] + C * SYA(r));
      const SXB = (k) =>
        k <= 0
          ? SXA(0) - 0.0225
          : k >= R
          ? SXA(R - 1) + 0.0225
          : (SXA(k - 1) + SXA(k)) / 2;
      const LCY = (r) => (YB[r] + YB[r + 1]) / 2;
      function lane3(r) {
        const s = SXA(r);
        g.translate(W / 2, LCY(r));
        g.scale(s, s);
        g.translate(-W / 2, -(Y0 + r * C + C / 2));
      }
      const bg = document.createElement("canvas");
      bg.width = W;
      bg.height = H;
      (function () {
        const b = bg.getContext("2d"),
          T = Y0 + R * C;
        let seed = 21;
        const rr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
        b.imageSmoothingEnabled = true;
        b.imageSmoothingQuality = "high";
        b.drawImage(flat, 0, 0, W, Y0, 0, 0, W, Y0);
        /* pagar tanaman di kiri-kanan */
        let q = b.createLinearGradient(0, Y0 - 8, 0, H);
        q.addColorStop(0, "#27421b");
        q.addColorStop(1, "#0b1407");
        b.fillStyle = q;
        b.fillRect(0, Y0 - 8, W, H - Y0 + 8);
        for (let i = 0; i < 260; i++) {
          const side = rr() < 0.5 ? 0 : 1,
            x = side ? W - rr() * W * 0.2 : rr() * W * 0.2,
            y = Y0 - 4 + rr() * (H - Y0),
            r = 10 + rr() * 22;
          q = b.createRadialGradient(x - r * 0.3, y - r * 0.35, 2, x, y, r);
          q.addColorStop(
            0,
            `rgb(${(50 + rr() * 30) | 0},${(110 + rr() * 50) | 0},${
              (40 + rr() * 20) | 0
            })`
          );
          q.addColorStop(1, "rgba(12,30,8,.95)");
          b.fillStyle = q;
          b.beginPath();
          b.arc(x, y, r, 0, 7);
          b.fill();
        }
        /* lantai kebun dengan perspektif: iris per garis */
        for (let r = 0; r < R; r++) {
          const a = YB[r],
            bb = YB[r + 1],
            sh = C / (bb - a);
          for (let y = Math.floor(a); y < Math.ceil(bb); y++) {
            const t = Math.min(1, Math.max(0, (y + 0.5 - a) / (bb - a))),
              sc = SXB(r) + (SXB(r + 1) - SXB(r)) * t,
              sw = W * sc;
            b.drawImage(
              flat,
              0,
              Y0 + r * C + t * C - sh / 2,
              W,
              sh,
              (W - sw) / 2,
              y,
              sw,
              1
            );
          }
        }
        /* batas petak jadi terasa timbul */
        for (let r = 0; r <= R; r++) {
          const y = YB[r],
            hw = (W / 2) * SXB(r);
          b.strokeStyle = "rgba(255,255,255,.10)";
          b.lineWidth = 1;
          b.beginPath();
          b.moveTo(W / 2 - hw, y + 0.5);
          b.lineTo(W / 2 + hw, y + 0.5);
          b.stroke();
          b.strokeStyle = "rgba(0,0,0,.25)";
          b.beginPath();
          b.moveTo(W / 2 - hw, y + 1.5);
          b.lineTo(W / 2 + hw, y + 1.5);
          b.stroke();
        }
        /* kabut jarak jauh */
        q = b.createLinearGradient(0, Y0, 0, Y0 + C * 3);
        q.addColorStop(0, "rgba(190,220,235,.34)");
        q.addColorStop(1, "rgba(190,220,235,0)");
        b.fillStyle = q;
        b.beginPath();
        b.moveTo(W / 2 - (W / 2) * SXB(0), Y0);
        b.lineTo(W / 2 + (W / 2) * SXB(0), Y0);
        b.lineTo(W / 2 + (W / 2) * SXB(R), T);
        b.lineTo(W / 2 - (W / 2) * SXB(R), T);
        b.closePath();
        b.fill();
        /* tepi batu kiri dan kanan */
        [-1, 1].forEach((sd) => {
          const x0 = W / 2 + ((sd * W) / 2) * SXB(0),
            x1 = W / 2 + ((sd * W) / 2) * SXB(R);
          b.strokeStyle = "#2a2620";
          b.lineWidth = 11;
          b.lineCap = "butt";
          b.beginPath();
          b.moveTo(x0 + sd * 3, Y0);
          b.lineTo(x1 + sd * 3, T);
          b.stroke();
          q = b.createLinearGradient(x0 - 9, 0, x0 + 9, 0);
          q.addColorStop(0, "#b9b19f");
          q.addColorStop(1, "#6e675a");
          b.strokeStyle = q;
          b.lineWidth = 7;
          b.beginPath();
          b.moveTo(x0 + sd * 2, Y0);
          b.lineTo(x1 + sd * 2, T);
          b.stroke();
          const sh = b.createLinearGradient(x0, 0, x0 - sd * 40, 0);
          sh.addColorStop(0, "rgba(0,0,0,.28)");
          sh.addColorStop(1, "rgba(0,0,0,0)");
        });
        /* sisi depan: tanah tebal dan pagar kayu */
        const fx0 = W / 2 - (W / 2) * SXB(R),
          fw = W * SXB(R);
        q = b.createLinearGradient(0, T, 0, T + 10);
        q.addColorStop(0, "#6a4a2a");
        q.addColorStop(1, "#2a1a0c");
        b.fillStyle = q;
        b.fillRect(fx0 - 4, T, fw + 8, 10);
        b.fillStyle = "rgba(0,0,0,.25)";
        for (let k = 0; k < 30; k++)
          b.fillRect(fx0 + rr() * fw, T + 1 + rr() * 8, 2 + rr() * 3, 1.5);
        b.drawImage(flat, 0, T + 10, W, H - T - 10, 0, T + 10, W, H - T - 10);
        q = b.createLinearGradient(0, T - 18, 0, T + 2);
        q.addColorStop(0, "rgba(0,0,0,0)");
        q.addColorStop(1, "rgba(0,0,0,.35)");
        b.fillStyle = q;
        b.fillRect(fx0, T - 18, fw, 20);
        /* cahaya dan vignet */
        q = b.createLinearGradient(0, 0, W, H);
        q.addColorStop(0, "rgba(255,225,150,.12)");
        q.addColorStop(1, "rgba(0,10,30,.16)");
        b.fillStyle = q;
        b.fillRect(0, 0, W, H);
        q = b.createRadialGradient(
          W / 2,
          H * 0.55,
          H * 0.4,
          W / 2,
          H * 0.55,
          W * 0.65
        );
        q.addColorStop(0, "rgba(0,0,0,0)");
        q.addColorStop(1, "rgba(0,0,10,.5)");
        b.fillStyle = q;
        b.fillRect(0, 0, W, H);
      })();

      /* ---------- State ---------- */
      const sum = (a) => a.reduce((x, y) => x + y, 0);
      const front = (L) => {
        for (let i = PC - 1; i >= 0; i--) if (L.p[i]) return i;
        return -1;
      };
      const wave = () => S.w;
      const say = (t) => {
        $("msg").textContent = t;
      };
      const pop = (x, y, txt, col) =>
        S.fx.push({
          k: "t",
          x,
          y,
          txt,
          col,
          t: 1.3,
          ln: Math.max(0, Math.min(R - 1, Math.floor((y + 30 - Y0) / C))),
        });
      function hud() {
        $("sc").textContent = S.score;
        $("wv").textContent = S.w + "/" + MAXW;
        $("mw").textContent = S.mowers;
        $("bs").textContent = best;
        document
          .querySelectorAll(".seed")
          .forEach((b) =>
            b.classList.toggle(
              "on",
              S.tool === "plant" && b.dataset.op === S.op
            )
          );
        document
          .querySelectorAll(".num")
          .forEach((b) =>
            b.classList.toggle("on", S.tool === "plant" && +b.dataset.v === S.v)
          );
        $("fr").classList.toggle("on", S.fz);
        $("fr").setAttribute("aria-pressed", S.fz);
        $("sv").classList.toggle("on", S.tool === "shovel");
        $("sv").setAttribute("aria-pressed", S.tool === "shovel");
        $("kt").classList.toggle("on", S.tool === "potato");
        $("kt").setAttribute("aria-pressed", S.tool === "potato");
        $("kt").style.opacity = S.score < 100 ? 0.65 : 1;
        cv.style.cursor = S.tool === "shovel" ? "crosshair" : "pointer";
      }
      function buildNums() {
        const n = $("nums");
        n.innerHTML = "";
        OPS[S.op].forEach((v) => {
          const b = document.createElement("button"),
            c = document.createElement("canvas");
          c.width = 100;
          c.height = 116;
          b.className = "num";
          b.dataset.v = v;
          b.setAttribute("aria-label", `Tanaman ${NAME[S.op]} ${v}`);
          b.appendChild(c);
          b.onclick = () => {
            A();
            S.v = v;
            S.vs[S.op] = v;
            if (v >= 1) S.pn = v;
            S.tool = "plant";
            SFX.pick();
            hud();
          };
          n.appendChild(b);
          icon(c, S.op, v);
          if (S.op === "×" && v === 0) {
            b.insertAdjacentHTML(
              "beforeend",
              '<span class="cd0"></span><span class="ct"></span>'
            );
          }
        });
      }
      /* angka pilihan (S.pn) dibawa ke jenis lain jika tersedia; jika tidak, pakai angka terakhir jenis itu */
      const vOf = (o) =>
        o === S.op ? S.v : OPS[o].includes(S.pn) ? S.pn : S.vs[o];
      function setOp(o) {
        const nv = vOf(o);
        S.op = o;
        S.v = nv;
        S.vs[o] = nv;
        S.tool = "plant";
        buildNums();
        hud();
      }
      function reset() {
        S = {
          L: Array.from({ length: R }, () => ({
            p: Array(PC).fill(null),
            z: [],
            hm: true,
            mx: -1,
            cd: 0,
          })),
          op: "−",
          v: 5,
          pn: 5,
          vs: { "−": 5, "+": 5, "×": 0, "÷": 5 },
          tool: "plant",
          score: 0,
          t: 0,
          sp: 1.2,
          run: true,
          fx: [],
          peas: [],
          dead: [],
          zid: 0,
          w: 1,
          phase: "break",
          bt: BREAK,
          wt: 0,
          q: [],
          wl: [],
          fz: false,
          fe: FM,
          cd: { "−": 0, "+": 0, "×": 0, "÷": 0, "×0": 0 },
          mowers: R,
        };
        buildNums();
        hud();
        say(
          "Pilih jenis dan angka tanaman, lalu ketuk petak rumput di kolom 1 sampai 8. Tanaman menetap di kebun."
        );
      }
      const ZN = {
        biasa: "Biasa",
        cone: "Cone",
        ember: "Ember",
        pelari: "Pelari",
        dokter: "Dokter",
        raksasa: "Raksasa",
        arwah: "Arwah",
      };
      function genWave(w) {
        if (window.NETSEED != null) {
          const o = Math.random;
          Math.random = mul32(window.NETSEED + w * 7919);
          try {
            genWave0(w);
          } finally {
            Math.random = o;
          }
        } else genWave0(w);
      }
      function genWave0(w) {
        const cnt = Math.min(12, 2 + Math.floor(w * 1.5)),
          gap = Math.max(2.4, 6.5 - 0.35 * w),
          L = [],
          lc = Array(R).fill(0);
        for (let k = 0; k < cnt; k++) {
          let n = rnd(4, Math.min(12 + w * 4, 45));
          if (w >= 2 && Math.random() < 0.25)
            n = -rnd(4, Math.min(8 + w * 2, 24));
          const a = Math.abs(n);
          let m = 99,
            ln = 0;
          lc.forEach((c, i) => {
            const q = c + Math.random();
            if (q < m) {
              m = q;
              ln = i;
            }
          });
          lc[ln]++;
          const type =
            n < 0
              ? "arwah"
              : a >= 32
              ? pick(["raksasa", "ember"])
              : a >= 20
              ? pick(["cone", "dokter"])
              : Math.random() < 0.4
              ? "pelari"
              : "biasa";
          const sp =
            type === "pelari"
              ? 1.7
              : type === "raksasa"
              ? 0.7
              : type === "arwah"
              ? 1.1
              : 1;
          L.push({
            t: 1.5 + k * gap + Math.random() * 1.2,
            lane: ln,
            n,
            type,
            v: (11 + w * 1.5 + rnd(0, 4)) * sp,
          });
        }
        L.sort((a, b) => a.t - b.t);
        S.q = L;
        S.wl = L.map((q) => ({ ...q }));
      }
      function addZ(q) {
        S.L[q.lane].z.push({
          id: ++S.zid,
          x: W + 14,
          n: q.n,
          n0: q.n,
          a: Math.abs(q.n),
          type: q.type,
          v: q.v,
          eat: 0,
          st: 0,
          ph: Math.random() * 6,
        });
        SFX.groan();
      }
      function showPop() {
        const box = $("pl");
        box.innerHTML = "";
        $("pt").textContent = `Gelombang ${S.w} dari ${MAXW}`;
        $(
          "pc"
        ).textContent = `${S.wl.length} zombie akan lewat. Zombie bernegatif (angka merah) perlu tanaman + atau × −1.`;
        S.wl.forEach((q) => {
          const d = document.createElement("div"),
            c = document.createElement("canvas"),
            b = document.createElement("b"),
            m = document.createElement("small");
          d.className = "zi";
          c.width = 70;
          c.height = 90;
          b.textContent = String(q.n).replace("-", "−");
          if (q.n < 0) b.className = "ng";
          m.textContent = `J${q.lane + 1} · ${ZN[q.type]}`;
          d.appendChild(c);
          d.appendChild(b);
          d.appendChild(m);
          box.appendChild(d);
          zicon(c, q);
        });
        $("pop").hidden = false;
      }
      function enterBreak() {
        Music.go("break");
        S.phase = "break";
        S.bt = BREAK;
        S.peas = [];
        S.fz = false;
        S.fe = FM;
        for (const o in S.cd) S.cd[o] = 0;
        genWave(S.w);
        showPop();
        hud();
        say(
          `Jeda sebelum gelombang ${S.w}. Tanam dan susun tanamanmu, serok jika perlu.`
        );
      }
      function startWave() {
        if (!S.run || S.phase !== "break") return;
        S.phase = "wave";
        S.wt = 0;
        Music.go("wave");
        $("pop").hidden = true;
        SFX.wave();
        hud();
        say(`Gelombang ${S.w} dimulai!`);
      }
      function clearWave() {
        const bonus = 30 * S.w;
        S.score += bonus;
        SFX.win();
        if (S.w >= MAXW) {
          over(true);
          return;
        }
        S.w++;
        enterBreak();
        say(
          `Gelombang ${
            S.w - 1
          } selesai! Bonus +${bonus}. Jeda dulu sebelum gelombang ${S.w}.`
        );
      }
      function bury(L, k, r, pts) {
        const z = L.z.splice(k, 1)[0];
        S.dead.push({ x: z.x, r, t: 0.9 });
        S.score += pts;
      }
      function hit(r, p) {
        const L = S.L[r],
          z = L.z[0],
          cy = Y0 + r * C + C / 2,
          o = z.n,
          q = ap(o, p.op, p.v),
          vs = p.v < 0 ? "(" + p.v + ")" : p.v;
        z.st = 0.35;
        if (q === null) {
          pop(z.x, cy - 60, "Tidak habis", "#ffd0a0");
          say(`${o} ÷ ${p.v} tidak habis dibagi, tembakan memantul.`);
          SFX.deny();
          return;
        }
        z.n = q;
        if (q === 0) {
          S.fx.push({ k: "b", x: z.x + 22, y: cy, t: 0.6 });
          pop(z.x, cy - 60, "PAS! +" + (10 + z.a), "#ffe27a");
          say(`Pas! ${o} ${p.op} ${vs} = 0. Zombie hancur.`);
          bury(L, 0, r, 10 + z.a);
          SFX.kill();
        } else if (neg1(p)) {
          pop(z.x, cy - 60, "× −1", "#ffb36a");
          say(`${o} × (−1) = ${q}. Tanda zombie dibalik.`);
          SFX.hit();
        } else if (o > 0 !== q > 0) {
          {
            const fi = front(L);
            z.x = Math.max(z.x - 36, fi < 0 ? z.x - 36 : C + (fi + 1) * C + 4);
          }
          pop(z.x, cy - 60, q < 0 ? "NEGATIF!" : "POSITIF!", "#ff6a4a");
          say(
            q < 0
              ? `Kelebihan: ${o} ${p.op} ${vs} = ${q}. Zombie jadi negatif dan menerjang. Tambahkan angka untuk menetralkannya.`
              : `${o} ${p.op} ${vs} = ${q}. Zombie kembali positif.`
          );
          SFX.over();
        } else {
          pop(z.x, cy - 60, lbl(p.op, p.v), "#fff");
          say(`${o} ${p.op} ${vs} = ${q}`);
          SFX.hit();
        }
        hud();
      }
      function over(win) {
        S.run = false;
        win ? SFX.win() : SFX.lose();
        Music.go(null);
        Music.after("menu", 3000);
        $("pop").hidden = true;
        if (S.score > best) {
          best = S.score;
          try {
            localStorage.setItem("kebun-best", best);
          } catch (e) {}
        }
        hud();
        $("ot").textContent = win ? "Kamu menang!" : "Zombie masuk rumah!";
        $("o1").textContent = win
          ? `Semua ${MAXW} gelombang bertahan! Skor ${S.score}. Terbaik: ${best}.`
          : `Skor kamu ${S.score}, sampai gelombang ${S.w}. Terbaik: ${best}.`;
        $("o2").textContent =
          "Tips: bagi angka besar dengan ÷ lebih dulu, lalu rapikan sisanya dengan − atau +. Pakai × 0 saat darurat.";
        $("o3").textContent = "";
        $("mn").hidden = true;
        $("o2").hidden = $("o3").hidden = false;
        $("go").textContent = "Main lagi";
        $("ov").hidden = false;
      }
      function pea(r) {
        const z = S.L[r].z[0];
        let m = z ? z.n : 0;
        S.peas
          .filter((p) => p.r === r)
          .sort((a, b) => b.x - a.x)
          .forEach((p) => {
            const q = ap(m, p.op, p.v);
            if (q !== null) m = q;
          });
        return m;
      }
      function fin(r, m) {
        const L = S.L[r],
          fi = front(L);
        if (fi < 0) return m;
        const stop = C + (fi + 1) * C + 4;
        let n = 0,
          ch = true;
        while (ch && n++ < 200) {
          ch = false;
          for (let i = PC - 1; i >= 0; i--) {
            const p = L.p[i];
            if (
              p &&
              !p.k &&
              p.op !== "×" &&
              stop <= C * (i + 2) + 2 * C + 10 &&
              can(m, p.op, p.v)
            ) {
              m = ap(m, p.op, p.v);
              ch = true;
            }
          }
        }
        return m;
      }
      function flipOk(r, z) {
        if (!z || z.fl) return false;
        const m = pea(r);
        if (m === 0) return false;
        return Math.abs(fin(r, -m)) <= Math.abs(fin(r, m));
      }
      function settle(r) {
        const L = S.L[r],
          z = L.z[0],
          fi = front(L);
        if (!z || fi < 0) return null;
        let m = pea(r),
          n = 0,
          ch = true;
        const stop = C + (fi + 1) * C + 4;
        if (
          m !== 0 &&
          !z.fl &&
          L.p.some((p, i) => neg1(p) && stop <= C * (i + 2) + 2 * C + 10) &&
          Math.abs(fin(r, -m)) <= Math.abs(fin(r, m))
        )
          m = -m;
        while (ch && n++ < 200) {
          ch = false;
          for (let i = PC - 1; i >= 0; i--) {
            const p = L.p[i];
            if (
              p &&
              !p.k &&
              !neg1(p) &&
              stop <= C * (i + 2) + 2 * C + 10 &&
              can(m, p.op, p.v)
            ) {
              m = ap(m, p.op, p.v);
              ch = true;
            }
          }
        }
        return m;
      }
      function tickFx(dt) {
        S.dead.forEach((d) => (d.t -= dt));
        S.dead = S.dead.filter((d) => d.t > 0);
        S.fx.forEach((f) => {
          f.t -= dt;
          if (f.k === "t") f.y -= 24 * dt;
        });
        S.fx = S.fx.filter((f) => f.t > 0);
      }
      function toggleFreeze() {
        if (!S.run) return;
        if (S.phase === "break") {
          say(
            "Sekarang masih jeda. Tanam dan serok dengan tenang. Beku dipakai saat gelombang berjalan."
          );
          return;
        }
        if (S.fz) {
          S.fz = false;
          say("Zombie bergerak lagi.");
        } else if (S.fe >= 1) {
          S.fz = true;
          SFX.freeze();
          say(
            "Beku! Zombie dan tembakan berhenti. Susun tanamanmu, lalu tekan Beku lagi untuk lanjut."
          );
        } else {
          say("Energi beku belum cukup.");
          SFX.deny();
          return;
        }
        hud();
      }
      function update(dt) {
        if (S.fz) {
          S.fe -= dt;
          if (S.fe <= 0) {
            S.fe = 0;
            S.fz = false;
            say("Energi beku habis. Zombie bergerak lagi!");
            hud();
          }
        } else S.fe = Math.min(FM, S.fe + dt * 0.4);
        for (const o in S.cd)
          if (S.cd[o] > 0) S.cd[o] = Math.max(0, S.cd[o] - dt);
        $("fr").style.setProperty("--m", (S.fe / FM) * 100 + "%");
        {
          const zb =
            S.op === "×" ? document.querySelector('.num[data-v="0"]') : null;
          if (zb) {
            const cdv = S.cd["×0"],
              f = cdv / CDS["×0"],
              sec = Math.ceil(cdv),
              was = zb.classList.contains("cool");
            zb.style.setProperty("--p", f * 360 + "deg");
            zb.querySelector(".ct").textContent =
              cdv > 0
                ? Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0")
                : "";
            zb.classList.toggle("cool", cdv > 0);
            if (was && cdv <= 0) {
              zb.classList.remove("rdy");
              void zb.offsetWidth;
              zb.classList.add("rdy");
            }
          }
        }
        document.querySelectorAll(".seed .cd").forEach((e) => {
          const o = e.parentNode.dataset.op,
            k = ck(o, vOf(o));
          e.style.height = (S.cd[k] / CDS[k]) * 100 + "%";
        });
        const left = S.L.reduce((a, L) => a + L.z.length, 0) + S.q.length;
        $("bt").textContent =
          S.phase === "break"
            ? `Jeda ${Math.ceil(S.bt)} dtk · Gel. ${S.w}`
            : `Sisa ${left} zombie`;
        $("bgo").hidden = S.phase !== "break";
        if (S.fz) {
          tickFx(dt);
          return;
        }
        S.t += dt;
        if (S.phase === "break") {
          S.bt -= dt;
          if (S.bt <= 0) startWave();
          tickFx(dt);
          return;
        }
        S.wt += dt;
        while (S.q.length && S.q[0].t <= S.wt) addZ(S.q.shift());
        S.L.forEach((L, r) => {
          const fi = front(L),
            stop = fi < 0 ? C - 34 : C + (fi + 1) * C + 4;
          for (let k = 0; k < L.z.length; k++) {
            const z = L.z[k];
            if (z.st > 0) {
              z.st -= dt;
              continue;
            }
            const lim = k ? Math.max(stop, L.z[k - 1].x + 70) : stop;
            if (z.x > lim + 0.5) {
              z.x = Math.max(lim, z.x - z.v * dt);
              z.eat = 0;
              z.ch = false;
            } else if (k === 0 && fi >= 0) {
              z.eat += dt;
              if (z.eat >= 1.1 && !z.ch) {
                z.ch = true;
                SFX.chew();
              }
              if (z.eat >= 2.2) {
                z.eat = 0;
                z.ch = false;
                const pp = L.p[fi];
                if (pp.k && --pp.hp > 0) {
                  pop(z.x, Y0 + r * C + 22, "krek!", "#ffb36a");
                  SFX.krek();
                } else {
                  const pk = pp.k;
                  L.p[fi] = null;
                  pop(z.x, Y0 + r * C + 22, pk ? "KRAK!" : "gigit!", "#ff6a4a");
                  pk ? SFX.potato() : SFX.bite();
                }
              }
            }
          }
          const tg = L.z[0];
          for (let i = PC - 1; i >= 0; i--) {
            const pl = L.p[i];
            if (!pl) continue;
            if (pl.sh > 0) pl.sh -= dt;
            pl.t -= dt;
            if (
              !tg ||
              pl.k ||
              pl.t > 0 ||
              tg.x > C * (i + 2) + 2 * C + 10 ||
              tg.x > W - 20
            )
              continue;
            if (neg1(pl)) {
              if (!flipOk(r, tg)) continue;
              tg.fl = true;
            } else if (!can(pea(r), pl.op, pl.v)) continue;
            pl.t = RL;
            pl.sh = 0.25;
            S.peas.push({ r, x: C * (i + 1) + C * 0.78, op: pl.op, v: pl.v });
            SFX.shoot();
            if (pl.op === "×" && pl.v === 0) {
              L.p[i] = null;
              S.fx.push({
                k: "b",
                x: C * (i + 1) + C / 2,
                y: Y0 + r * C + C / 2,
                t: 0.6,
              });
            }
          }
          if (L.mx >= 0) {
            L.mx += 650 * dt;
            for (let k = L.z.length - 1; k >= 0; k--)
              if (L.z[k].x <= L.mx + 60) bury(L, k, r, 5);
            if (L.mx > W + 60) L.mx = -1;
          } else if (tg && tg.x <= C - 33) {
            if (L.hm) {
              L.hm = false;
              L.mx = 10;
              S.mowers--;
              SFX.mow();
              pop(C, Y0 + r * C + 30, "Pemotong!", "#ffe27a");
              hud();
            } else over();
          }
        });
        if (!S.run) return;
        S.peas.forEach((p) => {
          p.x += 560 * dt;
          const z = S.L[p.r].z[0];
          if (z && p.x >= z.x + 6) {
            hit(p.r, p);
            p.d = 1;
          } else if (p.x > W) p.d = 1;
        });
        S.peas = S.peas.filter((p) => !p.d);
        tickFx(dt);
        if (!S.q.length && S.L.every((L) => !L.z.length)) clearWave();
      }

      /* ---------- Gambar ---------- */
      const hx = (h) => {
        h = h.replace("#", "");
        if (h.length === 3)
          h = h
            .split("")
            .map((c) => c + c)
            .join("");
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      };
      const mix = (h, k) =>
        `rgb(${hx(h).map(
          (v) =>
            Math.max(
              0,
              Math.min(255, k < 0 ? v * (1 + k) : v + (255 - v) * k)
            ) | 0
        )})`;
      const ci = (x, y, r, f) => el(x, y, r, r, 0, f);
      const el = (x, y, a, b, t, f) => {
        if (f[0] !== "#") {
          g.fillStyle = f;
          g.beginPath();
          g.ellipse(x, y, a, b, t, 0, 7);
          g.fill();
          return;
        }
        g.save();
        g.translate(x, y);
        g.rotate(t);
        g.scale(1, b / a);
        const q = g.createRadialGradient(
          -a * 0.35,
          -a * 0.4,
          a * 0.05,
          0,
          0,
          a * 1.05
        );
        q.addColorStop(0, mix(f, 0.42));
        q.addColorStop(0.5, f);
        q.addColorStop(1, mix(f, -0.6));
        g.fillStyle = q;
        g.beginPath();
        g.arc(0, 0, a, 0, 7);
        g.fill();
        if (a >= 8) {
          g.fillStyle = "rgba(255,255,255,.14)";
          g.beginPath();
          g.ellipse(-a * 0.3, -a * 0.4, a * 0.28, a * 0.15, -0.6, 0, 7);
          g.fill();
          g.strokeStyle = "rgba(0,0,0,.25)";
          g.lineWidth = 1;
          g.beginPath();
          g.arc(0, 0, a, 0, 7);
          g.stroke();
        }
        g.restore();
      };
      const eyes = (x, y, k) => {
        [-8, 8].forEach((d) => {
          const ex = x + d * k,
            r = 5 * k;
          g.save();
          g.translate(ex, y);
          let q = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
          q.addColorStop(0, "#fffdf6");
          q.addColorStop(0.7, "#e6e0d2");
          q.addColorStop(1, "#a89f90");
          g.fillStyle = q;
          g.beginPath();
          g.ellipse(0, 0, r, r * 1.05, 0, 0, 7);
          g.fill();
          const ix = r * 0.35;
          q = g.createRadialGradient(ix, 0, r * 0.1, ix, 0, r * 0.62);
          q.addColorStop(0, "#86b852");
          q.addColorStop(0.6, "#3d6a22");
          q.addColorStop(1, "#1d3a10");
          g.fillStyle = q;
          g.beginPath();
          g.arc(ix, 0, r * 0.58, 0, 7);
          g.fill();
          g.fillStyle = "#050805";
          g.beginPath();
          g.arc(ix + r * 0.06, 0, r * 0.28, 0, 7);
          g.fill();
          g.fillStyle = "rgba(255,255,255,.92)";
          g.beginPath();
          g.arc(ix - r * 0.12, -r * 0.2, r * 0.14, 0, 7);
          g.fill();
          q = g.createLinearGradient(0, -r, 0, r * 0.3);
          q.addColorStop(0, "rgba(0,0,0,.5)");
          q.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = q;
          g.beginPath();
          g.ellipse(0, 0, r, r * 1.05, 0, 0, 7);
          g.fill();
          g.strokeStyle = "rgba(0,0,0,.6)";
          g.lineWidth = Math.max(0.8, k * 1.2);
          g.beginPath();
          g.ellipse(0, 0, r, r * 1.05, 0, 0, 7);
          g.stroke();
          g.restore();
        });
      };
      const bx = (x, y, w, h, f, r = 3) => {
        let q = g.createLinearGradient(x, 0, x + w, 0);
        q.addColorStop(0, mix(f, 0.18));
        q.addColorStop(0.5, f);
        q.addColorStop(1, mix(f, -0.5));
        g.fillStyle = q;
        g.beginPath();
        g.roundRect(x, y, w, h, r);
        g.fill();
        q = g.createLinearGradient(0, y, 0, y + h);
        q.addColorStop(0, "rgba(0,0,0,0)");
        q.addColorStop(1, "rgba(0,0,0,.25)");
        g.fillStyle = q;
        g.fill();
      };
      const st = (x, y, a, b, c) => {
        g.fillStyle = c;
        g.beginPath();
        g.ellipse(x, y, a, b, 0.5, 0, 7);
        g.fill();
      };
      const petals = (n, a, b, d, f) => {
        for (let k = 0; k < n; k++) {
          g.save();
          g.rotate((k * 6.2832) / n);
          el(0, -d, a, b, 0, f);
          g.restore();
        }
      };
      function head(v) {
        g.save();
        g.translate(0, -10);
        switch (v) {
          case 1:
            el(-4, -27, 7, 15, -0.3, "#4fbf3f");
            ci(0, 0, 20, "#9be87a", "#3d8a2d");
            ci(21, 3, 7, "#9be87a", "#3d8a2d");
            eyes(0, -3, 0.8);
            break;
          case 2:
            ci(-11, -4, 16, "#5cc04a", "#2f7a2e");
            ci(11, 5, 16, "#74d65a", "#2f7a2e");
            ci(26, 7, 6, "#74d65a", "#2f7a2e");
            eyes(-12, -6, 0.55);
            eyes(10, 3, 0.55);
            break;
          case 3:
            ci(0, -15, 13, "#2fa86a", "#1b6a40");
            ci(-14, 8, 13, "#2fa86a", "#1b6a40");
            ci(14, 8, 13, "#2fa86a", "#1b6a40");
            ci(0, 0, 13, "#d6f7e0", "#1b6a40");
            eyes(0, -1, 0.6);
            break;
          case 4:
            petals(4, 11, 17, 16, "#5aa9ff");
            ci(0, 0, 14, "#ffe27a", "#c9a227");
            eyes(0, -1, 0.65);
            break;
          case 5:
            {
              const sg = g.createRadialGradient(-8, -10, 2, 0, 0, 32);
              sg.addColorStop(0, "#ffe98a");
              sg.addColorStop(1, "#a8780f");
              g.fillStyle = sg;
            }
            g.strokeStyle = "rgba(60,40,0,.5)";
            g.lineWidth = 1.2;
            g.beginPath();
            for (let k = 0; k < 10; k++) {
              const r = k % 2 ? 13 : 30,
                a = -1.5708 + k * 0.6283;
              g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            g.closePath();
            g.fill();
            g.stroke();
            eyes(0, 0, 0.7);
            break;
          case 6:
            petals(6, 9, 15, 19, "#ff9f1c");
            ci(0, 0, 15, "#7a4a1c", "#4a2a0c");
            eyes(0, -1, 0.65);
            break;
          case 7:
            el(0, 0, 17, 27, 0, "#4fa35a");
            g.strokeStyle = "#fff";
            g.lineWidth = 2;
            for (let k = 0; k < 7; k++) {
              const a = -2.6 + k * 0.72;
              g.beginPath();
              g.moveTo(Math.cos(a) * 17, Math.sin(a) * 27);
              g.lineTo(Math.cos(a) * 24, Math.sin(a) * 34);
              g.stroke();
            }
            ci(0, -28, 6, "#ff7fb0");
            eyes(1, -2, 0.7);
            break;
          case 8:
            petals(8, 6, 14, 20, "#b891e8");
            ci(0, 0, 20, "#8a58d0", "#4b2a8a");
            eyes(0, -2, 0.75);
            break;
          case 9:
            el(-18, -27, 6, 12, -0.6, "#3d9a38");
            ci(0, -4, 27, "#c0392b", "#701b14");
            el(8, 9, 18, 8, 0, "#3b0a0a");
            g.fillStyle = "#fff";
            for (let k = 0; k < 5; k++) {
              g.beginPath();
              g.moveTo(-6 + k * 7, 3);
              g.lineTo(-2.5 + k * 7, 11);
              g.lineTo(1 + k * 7, 3);
              g.fill();
            }
            eyes(-2, -14, 0.75);
            break;
          case 0:
            ci(-12, 6, 15, "#d8232a", "#7a0f14");
            ci(12, 6, 15, "#e63a3a", "#7a0f14");
            g.strokeStyle = "#3d9a38";
            g.lineWidth = 3;
            g.beginPath();
            g.moveTo(-12, -8);
            g.quadraticCurveTo(-4, -30, 6, -32);
            g.moveTo(12, -8);
            g.quadraticCurveTo(10, -26, 6, -32);
            g.stroke();
            eyes(-12, 5, 0.5);
            eyes(12, 5, 0.5);
            break;
          case -1:
            el(0, 0, 20, 27, 0, "#cfd8dc");
            g.strokeStyle = "rgba(120,150,170,.6)";
            g.lineWidth = 1.5;
            g.beginPath();
            g.ellipse(0, 0, 20, 27, 0, 0, 7);
            g.stroke();
            el(-9, -10, 4, 9, 0.5, "rgba(255,255,255,.75)");
            eyes(1, 0, 0.7);
            break;
        }
        g.restore();
      }
      function drawPotato(cx, cy, pl, a) {
        const d = pl.hp / pl.mh;
        g.save();
        g.globalAlpha = a;
        let q = g.createRadialGradient(cx, cy + 46, 2, cx, cy + 46, 38);
        q.addColorStop(0, "rgba(0,0,0,.5)");
        q.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = q;
        g.beginPath();
        g.ellipse(cx, cy + 46, 38, 10, 0, 0, 7);
        g.fill();
        g.translate(cx, cy + 6 + Math.sin(S.t * 2 + pl.ph));
        g.rotate(Math.sin(S.t * 1.5 + pl.ph) * 0.02);
        el(0, 0, 31, 39, 0.1, "#b58a55");
        for (let k = 0; k < 26; k++) {
          const ax = Math.sin(k * 12.9) * 22,
            ay = Math.cos(k * 7.3) * 30;
          st(ax, ay, 1.2 + (k % 3) * 0.7, 0.9 + (k % 2), "rgba(70,45,20,.55)");
        }
        st(-12, -10, 7, 4, "rgba(90,60,30,.5)");
        st(13, 12, 6, 5, "rgba(90,60,30,.45)");
        g.strokeStyle = "rgba(60,95,30,.8)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(-3, -37);
        g.quadraticCurveTo(-2, -46, 5, -50);
        g.stroke();
        if (d < 0.8) {
          g.strokeStyle = "#3a2410";
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(-20, -18);
          g.lineTo(-9, -8);
          g.lineTo(-15, 2);
          if (d < 0.5) {
            g.moveTo(18, -16);
            g.lineTo(9, -4);
            g.lineTo(15, 12);
          }
          g.stroke();
          st(-12, -4, 4, 6, "rgba(230,215,160,.6)");
        }
        g.restore();
      }
      function drawPlant(cx, cy, pl, a, rc, big) {
        if (pl.k) {
          drawPotato(cx, cy, pl, a);
          return;
        }
        const c = OC[pl.op],
          t = lbl(pl.op, pl.v);
        g.save();
        g.globalAlpha = a;
        g.translate(cx, cy + Math.sin(S.t * 3 + pl.ph) * 2);
        let q = g.createRadialGradient(10, 52, 2, 10, 52, 40);
        q.addColorStop(0, "rgba(0,0,0,.6)");
        q.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = q;
        g.beginPath();
        g.ellipse(10, 52, 42, 10, 0, 0, 7);
        g.fill();
        q = g.createLinearGradient(-3, 0, 3, 0);
        q.addColorStop(0, "#5a9a3a");
        q.addColorStop(1, "#1d4a14");
        g.strokeStyle = q;
        g.lineWidth = 6;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(0, 30);
        g.quadraticCurveTo(-4, 18, 0, 8);
        g.stroke();
        el(-15, 22, 13, 5, -0.5, "#3f8a2c");
        el(15, 19, 13, 5, 0.5, "#4a9a32");
        g.save();
        g.translate(-rc * 12, 0);
        head(pl.v);
        g.restore();
        q = g.createLinearGradient(-23, 0, 23, 0);
        q.addColorStop(0, "#d98a5a");
        q.addColorStop(0.4, "#b8613a");
        q.addColorStop(1, "#5a2a14");
        g.fillStyle = q;
        g.beginPath();
        g.moveTo(-18, 34);
        g.lineTo(18, 34);
        g.lineTo(14, 50);
        g.quadraticCurveTo(0, 55, -14, 50);
        g.closePath();
        g.fill();
        q = g.createLinearGradient(-26, 0, 26, 0);
        q.addColorStop(0, c[0]);
        q.addColorStop(0.5, mix(c[0], -0.15));
        q.addColorStop(1, c[1]);
        g.fillStyle = q;
        g.beginPath();
        g.roundRect(-25, 28, 50, 9, 3);
        g.fill();
        el(0, 28, 25, 5, 0, mix(c[0], -0.3));
        el(0, 28, 21, 3.5, 0, "#2a180a");
        g.fillStyle = "rgba(255,230,200,.9)";
        g.strokeStyle = "rgba(0,0,0,.45)";
        g.lineWidth = big ? 5 : 3;
        g.font = `700 ${
          big ? (t.length > 2 ? 27 : 34) : t.length > 2 ? 16 : 21
        }px "Oswald",sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = "#fff6dc";
        g.strokeStyle = "rgba(40,18,6,.9)";
        const ty = big ? 45 : 43;
        g.strokeText(t, 0, ty);
        g.fillText(t, 0, ty);
        g.restore();
      }
      function icon(c, op, v) {
        const sv = g;
        g = c.getContext("2d");
        try {
          g.clearRect(0, 0, c.width, c.height);
          g.save();
          g.translate(c.width / 2, c.height / 2 - 3);
          g.scale(0.9, 0.9);
          drawPlant(0, 0, { op, v, ph: 0 }, 1, 0, true);
          g.restore();
        } finally {
          g = sv;
        }
      }
      const ZT = {
        biasa: {
          sk: "#7dbb8d",
          hair: "#4f8f8a",
          jk: "#5a82a6",
          ti: "#d9b742",
          pa: "#5a3b28",
        },
        cone: {
          sk: "#7dbb8d",
          hair: "#4f8f8a",
          jk: "#5a82a6",
          ti: "#d9b742",
          pa: "#5a3b28",
        },
        ember: {
          sk: "#7dbb8d",
          hair: "#4f8f8a",
          jk: "#5a82a6",
          ti: "#d9b742",
          pa: "#5a3b28",
        },
        pelari: {
          sk: "#86c196",
          hair: "#3d6a66",
          jk: "#a8392f",
          ti: "#2b2b33",
          pa: "#2a2a36",
        },
        dokter: {
          sk: "#88c096",
          hair: "#6b8486",
          jk: "#e6ebe8",
          ti: "#4b86a6",
          pa: "#456f8a",
        },
        raksasa: {
          sk: "#6aa07a",
          hair: "#35504a",
          jk: "#6b4a32",
          ti: "#8a6a3a",
          pa: "#30302a",
        },
        arwah: {
          sk: "#aebcd8",
          hair: "#7885a8",
          jk: "#6f7ca0",
          ti: "#8a96b8",
          pa: "#5a6690",
        },
      };
      const hexm = (h, k) =>
        "#" +
        hx(h)
          .map(
            (v) =>
              Math.max(
                0,
                Math.min(255, k < 0 ? v * (1 + k) : v + (255 - v) * k)
              ) | 0
          )
          .map((v) => v.toString(16).padStart(2, "0"))
          .join("");
      function lb(x1, y1, x2, y2, w1, w2, f) {
        const dx = x2 - x1,
          dy = y2 - y1,
          L = Math.hypot(dx, dy) || 1;
        let nx = -dy / L,
          ny = dx / L;
        if (ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        const mx = (x1 + x2) / 2,
          my = (y1 + y2) / 2,
          wm = (w1 + w2) / 2;
        const q = g.createLinearGradient(
          mx - nx * wm,
          my - ny * wm,
          mx + nx * wm,
          my + ny * wm
        );
        q.addColorStop(0, hexm(f, 0.28));
        q.addColorStop(0.45, f);
        q.addColorStop(1, hexm(f, -0.55));
        g.fillStyle = q;
        g.beginPath();
        g.moveTo(x1 - nx * w1, y1 - ny * w1);
        g.lineTo(x2 - nx * w2, y2 - ny * w2);
        g.lineTo(x2 + nx * w2, y2 + ny * w2);
        g.lineTo(x1 + nx * w1, y1 + ny * w1);
        g.closePath();
        g.fill();
        g.beginPath();
        g.arc(x1, y1, w1, 0, 7);
        g.fill();
        g.beginPath();
        g.arc(x2, y2, w2, 0, 7);
        g.fill();
      }
      function zbody(z) {
        const c = ZT[z.type] || ZT.biasa,
          t = z.type,
          gh = t === "arwah",
          run = t === "pelari",
          big = t === "raksasa",
          sk = c.sk,
          dsk = hexm(sk, -0.25),
          OL = "#14231b";
        const w = Math.sin(S.t * (run ? 7 : 4) + z.ph) * (run ? 5 : 3),
          ay = z.eat > 0 ? Math.sin(S.t * 16) * 3 : 0,
          mo = z.eat > 0 ? Math.abs(Math.sin(S.t * 14)) * 2.6 : 0;
        let q;
        const lo = (x1, y1, x2, y2, w1, w2, f) => {
          lb(x1, y1, x2, y2, w1 + 1.8, w2 + 1.8, OL);
          lb(x1, y1, x2, y2, w1, w2, f);
        };
        const poly = (pts, f, lw) => {
          g.beginPath();
          pts.forEach((p, k) =>
            k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])
          );
          g.closePath();
          g.fillStyle = f;
          g.fill();
          g.strokeStyle = OL;
          g.lineWidth = lw || 2;
          g.lineJoin = "round";
          g.stroke();
        };
        const shoe = (x, y) => {
          g.fillStyle = OL;
          g.beginPath();
          g.ellipse(x - 3, y, 12.6, 6.4, -0.05, 0, 7);
          g.fill();
          q = g.createLinearGradient(0, y - 5, 0, y + 5);
          q.addColorStop(0, "#dcb88e");
          q.addColorStop(1, "#a9703f");
          g.fillStyle = q;
          g.beginPath();
          g.ellipse(x - 3, y, 11, 4.8, -0.05, 0, 7);
          g.fill();
          g.fillStyle = "#f2efe6";
          g.fillRect(x - 1, y - 4.4, 3.2, 8.4);
          g.fillRect(x - 7.5, y - 3.4, 2.6, 6.8);
          g.fillStyle = "#e0702a";
          g.beginPath();
          g.ellipse(x - 11, y + 1, 3.2, 2.6, 0, 0, 7);
          g.fill();
          g.fillStyle = "rgba(60,40,20,.7)";
          g.fillRect(x + 5, y + 1, 2, 2);
          g.fillRect(x + 7.5, y - 1.5, 1.6, 1.6);
        };
        g.save();
        if (gh) g.globalAlpha = 0.8;
        g.lineJoin = "round";
        g.lineCap = "round";
        q = g.createRadialGradient(28, 37, 2, 28, 37, 38);
        q.addColorStop(0, "rgba(0,0,0,.65)");
        q.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = q;
        g.beginPath();
        g.ellipse(28, 37, 42, 9, 0, 0, 7);
        g.fill();
        const leg = (h, kx, ky, ax) => {
          lo(h, 16, kx, ky, 4.6, 4, sk);
          lo(kx, ky, ax, 31, 4, 3.4, sk);
          st(kx, ky - 1, 3, 1.6, "rgba(30,70,50,.45)");
          shoe(ax, 34);
        };
        if (gh) {
          q = g.createLinearGradient(0, 10, 0, 44);
          q.addColorStop(0, "rgba(90,106,150,.9)");
          q.addColorStop(1, "rgba(90,106,150,0)");
          g.fillStyle = q;
          g.beginPath();
          g.moveTo(12, 10);
          g.lineTo(38, 10);
          for (let i = 0; i < 5; i++)
            g.lineTo(36 - i * 6, 40 + ((i + Math.floor(S.t * 6)) % 2) * 8);
          g.closePath();
          g.fill();
        } else {
          leg(29, 31 - w, 24, 36 - w * 1.4);
          leg(21, 17 + w, 24, 12 + w * 1.6);
          poly(
            [
              [12, 3],
              [35, 3],
              [38, 19],
              [25, 21],
              [22, 15],
              [18, 21],
              [10, 19],
            ],
            c.pa,
            2
          );
          g.strokeStyle = "rgba(0,0,0,.3)";
          g.lineWidth = 1.2;
          g.beginPath();
          g.moveTo(22, 8);
          g.lineTo(22, 15);
          g.moveTo(15, 12);
          g.lineTo(14, 18);
          g.stroke();
        }
        const arm = (sx, sy, ex, ey, hx2, hy, col, sl) => {
          lo(sx, sy, ex, ey, 5.8, 5, sl);
          lo(ex, ey, hx2, hy, 4, 3, col);
          for (let k = 0; k < 4; k++) {
            const fx = hx2 - 4,
              fy = hy - 3.2 + k * 2.2,
              tx = fx - 7 - (k % 2) * 1.6,
              ty = fy + 2 + k * 0.9 + (ay ? ay * 0.3 : 0);
            lo(fx, fy, tx, ty, 1.7, 0.9, col);
            g.fillStyle = "#ece6c4";
            g.beginPath();
            g.arc(tx - 0.4, ty + 0.2, 1, 0, 7);
            g.fill();
          }
          g.fillStyle = OL;
          g.beginPath();
          g.ellipse(hx2 - 2, hy, 6.4, 4.8, 0, 0, 7);
          g.fill();
          g.fillStyle = col;
          g.beginPath();
          g.ellipse(hx2 - 2, hy, 5, 3.6, 0, 0, 7);
          g.fill();
        };
        arm(30, -9, 10, -12 + w, -12, -9 + w + ay, dsk, hexm(c.jk, -0.3));
        /* kaus */
        poly(
          [
            [10, -13],
            [36, -13],
            [37, -2],
            [34, 6],
            [13, 6],
            [10, -2],
          ],
          c.ti,
          2
        );
        g.fillStyle = "rgba(255,255,255,.18)";
        g.fillRect(20, -12, 8, 16);
        if (t === "dokter") {
          g.strokeStyle = "#222";
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(15, -14);
          g.quadraticCurveTo(10, 6, 20, 8);
          g.stroke();
          el(20, 9, 2.6, 2.6, 0, "#9aa4ad");
        }
        /* jaket robek */
        poly(
          [
            [8, -14],
            [18, -16],
            [19, -5],
            [17, 6],
            [13, 14],
            [10, 8],
            [6, 11],
            [7, -2],
          ],
          c.jk,
          2
        );
        poly(
          [
            [28, -16],
            [37, -14],
            [42, -4],
            [41, 8],
            [38, 14],
            [35, 8],
            [31, 12],
            [28, 2],
          ],
          c.jk,
          2
        );
        g.strokeStyle = "rgba(0,0,0,.28)";
        g.lineWidth = 1.3;
        g.beginPath();
        g.moveTo(11, -8);
        g.lineTo(13, 4);
        g.moveTo(34, -8);
        g.lineTo(36, 4);
        g.stroke();
        poly(
          [
            [14, -16],
            [19, -16],
            [18, -9],
          ],
          hexm(c.jk, 0.25),
          1.5
        );
        poly(
          [
            [28, -16],
            [33, -15],
            [30, -9],
          ],
          hexm(c.jk, 0.25),
          1.5
        );
        st(35, 4, 5, 2.4, "rgba(80,10,10,.5)");
        /* lengan depan */
        arm(14, -9, -2, 0 - w, -20, 4 - w - ay, sk, c.jk);
        /* leher */
        lo(19, -17, 21, -25, 5.4, 5, dsk);
        /* kepala */
        g.save();
        g.translate(21, -31);
        g.rotate(-0.12 + Math.sin(S.t * 3 + z.ph) * 0.03);
        if (big) g.scale(1.1, 1.1);
        g.fillStyle = OL;
        g.beginPath();
        g.ellipse(16, 1, 4.4, 6.6, 0, 0, 7);
        g.fill();
        g.fillStyle = sk;
        g.beginPath();
        g.ellipse(16, 1, 2.9, 5, 0, 0, 7);
        g.fill();
        g.fillStyle = OL;
        g.beginPath();
        g.ellipse(0, 0, 18.2, 19, 0, 0, 7);
        g.ellipse(-1, 8, 13.8, 12.4, 0, 0, 7);
        g.fill();
        g.fillStyle = sk;
        g.beginPath();
        g.ellipse(0, 0, 16.4, 17.4, 0, 0, 7);
        g.ellipse(-1, 8, 12.2, 10.8, 0, 0, 7);
        g.fill();
        [
          [-10, 9],
          [10, 9],
        ].forEach((a) => {
          q = g.createRadialGradient(a[0], a[1], 1, a[0], a[1], 9);
          q.addColorStop(0, "rgba(10,50,30,.35)");
          q.addColorStop(1, "rgba(10,50,30,0)");
          g.fillStyle = q;
          g.fillRect(a[0] - 10, a[1] - 10, 20, 20);
        });
        /* luka */
        g.fillStyle = "#8c5b3c";
        g.strokeStyle = OL;
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(8, -15);
        g.lineTo(14, -10);
        g.lineTo(11, -4);
        g.lineTo(6, -10);
        g.closePath();
        g.fill();
        g.stroke();
        g.beginPath();
        g.ellipse(11.5, 8, 3, 4.4, 0.2, 0, 7);
        g.fill();
        g.stroke();
        g.strokeStyle = "rgba(20,35,27,.8)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(-14, -9);
        g.lineTo(-11, -6);
        g.moveTo(-12, -10);
        g.lineTo(-10, -7);
        g.stroke();
        /* rambut */
        poly(
          [
            [-17, -3],
            [-19, -16],
            [-11, -12],
            [-10, -27],
            [-3, -16],
            [2, -30],
            [6, -16],
            [14, -25],
            [13, -11],
            [20, -14],
            [17, -2],
            [10, -12],
            [0, -13],
            [-10, -9],
          ],
          c.hair,
          2
        );
        g.strokeStyle = hexm(c.hair, -0.45);
        g.lineWidth = 1.2;
        g.beginPath();
        [
          [-9, -12, -9, -22],
          [-2, -14, 1, -24],
          [6, -14, 11, -20],
          [-15, -8, -16, -13],
        ].forEach((a) => {
          g.moveTo(a[0], a[1]);
          g.lineTo(a[2], a[3]);
        });
        g.stroke();
        g.strokeStyle = "rgba(235,250,245,.5)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(-5, -14);
        g.lineTo(-4, -22);
        g.moveTo(8, -14);
        g.lineTo(11, -19);
        g.stroke();
        if (run) {
          g.fillStyle = "#b8352a";
          g.beginPath();
          g.moveTo(-17, -11);
          g.quadraticCurveTo(0, -17, 17, -11);
          g.lineTo(17, -6);
          g.quadraticCurveTo(0, -12, -17, -6);
          g.closePath();
          g.fill();
          g.strokeStyle = OL;
          g.lineWidth = 1.6;
          g.stroke();
        }
        /* mata kuning */
        [
          [-8.4, 1.2, 6.8, -1.6, 0],
          [8, 1.2, 6, -1.3, 1],
        ].forEach(([ex, ey, r, px, rt]) => {
          g.fillStyle = OL;
          g.beginPath();
          g.arc(ex, ey, r + 1.7, 0, 7);
          g.fill();
          q = g.createRadialGradient(ex - 1, ey - 1, 1, ex, ey, r);
          q.addColorStop(0, "#fff06a");
          q.addColorStop(0.65, "#ffc81c");
          q.addColorStop(1, "#e8821a");
          g.fillStyle = q;
          g.beginPath();
          g.arc(ex, ey, r, 0, 7);
          g.fill();
          g.fillStyle = "#120804";
          g.beginPath();
          g.ellipse(ex + px, ey + 0.8, 2.3, 3.5, 0, 0, 7);
          g.fill();
          g.fillStyle = "rgba(255,255,255,.9)";
          g.beginPath();
          g.arc(ex + px - 0.8, ey - 0.8, 0.95, 0, 7);
          g.fill();
          g.save();
          g.beginPath();
          g.arc(ex, ey, r, 0, 7);
          g.clip();
          g.fillStyle = hexm(sk, -0.32);
          g.beginPath();
          if (!rt) {
            g.moveTo(-16, -10);
            g.lineTo(-0.5, -10);
            g.lineTo(-0.5, 0.6);
            g.lineTo(-16, -4.4);
          } else {
            g.moveTo(-0.5, -10);
            g.lineTo(16, -10);
            g.lineTo(16, -4.4);
            g.lineTo(-0.5, 0.6);
          }
          g.closePath();
          g.fill();
          g.restore();
        });
        g.strokeStyle = OL;
        g.lineWidth = 3.2;
        g.beginPath();
        g.moveTo(-16.5, -8.4);
        g.lineTo(-1.5, -1.4);
        g.moveTo(16.5, -9.4);
        g.lineTo(1.5, -1.4);
        g.stroke();
        /* hidung */
        g.fillStyle = dsk;
        g.strokeStyle = OL;
        g.lineWidth = 1.4;
        g.beginPath();
        g.ellipse(-1, 5.6, 3.2, 2.4, 0, 0, 7);
        g.fill();
        g.stroke();
        g.fillStyle = OL;
        g.beginPath();
        g.arc(-2.2, 5.8, 0.8, 0, 7);
        g.arc(0.4, 5.8, 0.8, 0, 7);
        g.fill();
        /* mulut terbuka */
        const my = 12.4 + mo * 0.25,
          mh = 3.9 + mo;
        g.fillStyle = "#240a0a";
        g.strokeStyle = OL;
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(-1, my, 8.8, mh, 0, 0, 7);
        g.fill();
        g.stroke();
        if (mo > 0.6) {
          g.fillStyle = "#c4565a";
          g.beginPath();
          g.ellipse(-1, my + mh * 0.45, 4.2, 1.7, 0, 0, 7);
          g.fill();
        }
        g.fillStyle = "#ece4bc";
        g.strokeStyle = "rgba(20,35,27,.8)";
        g.lineWidth = 0.8;
        for (let k = 0; k < 5; k++) {
          g.beginPath();
          g.rect(-7.4 + k * 3, my - mh + 0.5, 2.4, 2.6 + (k % 2) * 1.2);
          g.fill();
          g.stroke();
        }
        for (let k = 0; k < 3; k++) {
          g.beginPath();
          g.rect(-5 + k * 3.6, my + mh - 3, 2.2, 2.4);
          g.fill();
          g.stroke();
        }
        if (t === "dokter") {
          g.strokeStyle = "#1c1c1c";
          g.lineWidth = 1.6;
          g.beginPath();
          g.arc(-8.4, 1.2, 8.6, 0, 7);
          g.moveTo(24, 1.2);
          g.arc(8, 1.2, 7.8, 0, 7);
          g.moveTo(0.2, 1);
          g.lineTo(0, 0.6);
          g.stroke();
          g.fillStyle = "rgba(190,220,240,.2)";
          g.beginPath();
          g.arc(-8.4, 1.2, 8.6, 0, 7);
          g.arc(8, 1.2, 7.8, 0, 7);
          g.fill();
        }
        if (t === "ember") {
          g.strokeStyle = "#5d666e";
          g.lineWidth = 2.4;
          g.beginPath();
          g.arc(0, -19, 21, 2.5, 0.65, true);
          g.stroke();
          q = g.createLinearGradient(-19, 0, 19, 0);
          q.addColorStop(0, "#e1e6ea");
          q.addColorStop(0.35, "#9ea7ae");
          q.addColorStop(1, "#353c42");
          g.fillStyle = q;
          g.beginPath();
          g.moveTo(-20, -37);
          g.lineTo(20, -37);
          g.lineTo(15, -13);
          g.lineTo(-15, -13);
          g.closePath();
          g.fill();
          g.strokeStyle = "rgba(0,0,0,.35)";
          g.lineWidth = 1.4;
          g.stroke();
          g.beginPath();
          g.moveTo(-17, -26);
          g.lineTo(17, -26);
          g.moveTo(-16, -18);
          g.lineTo(16, -18);
          g.stroke();
          st(-6, -24, 3, 5, "rgba(110,62,28,.45)");
          g.fillStyle = "rgba(255,255,255,.35)";
          g.fillRect(-15, -35, 3, 20);
          q = g.createLinearGradient(-20, 0, 20, 0);
          q.addColorStop(0, "#f1f4f6");
          q.addColorStop(1, "#7e878e");
          g.fillStyle = q;
          g.beginPath();
          g.ellipse(0, -37, 20, 4.2, 0, 0, 7);
          g.fill();
          g.fillStyle = "#2e353a";
          g.beginPath();
          g.ellipse(0, -37, 15, 2.6, 0, 0, 7);
          g.fill();
        }
        if (t === "cone") {
          q = g.createLinearGradient(-17, 0, 17, 0);
          q.addColorStop(0, "#ff9a38");
          q.addColorStop(0.4, "#e0661a");
          q.addColorStop(1, "#6e2a08");
          g.fillStyle = q;
          g.beginPath();
          g.moveTo(-18, -12);
          g.lineTo(18, -12);
          g.lineTo(2, -47);
          g.lineTo(-2, -47);
          g.closePath();
          g.fill();
          g.strokeStyle = OL;
          g.lineWidth = 2;
          g.stroke();
          g.fillStyle = "rgba(235,235,225,.9)";
          g.beginPath();
          g.moveTo(-12.5, -23);
          g.lineTo(12.5, -23);
          g.lineTo(9.5, -31);
          g.lineTo(-9.5, -31);
          g.closePath();
          g.fill();
          st(5, -17, 5, 2, "rgba(45,30,18,.45)");
          g.fillStyle = "rgba(255,255,255,.3)";
          g.beginPath();
          g.moveTo(-12, -14);
          g.lineTo(-3, -44);
          g.lineTo(-6, -44);
          g.lineTo(-15, -14);
          g.fill();
          q = g.createLinearGradient(-19, 0, 19, 0);
          q.addColorStop(0, "#d8761e");
          q.addColorStop(1, "#5a2306");
          g.fillStyle = q;
          g.beginPath();
          g.ellipse(0, -12, 19, 4, 0, 0, 7);
          g.fill();
          g.strokeStyle = OL;
          g.lineWidth = 1.6;
          g.stroke();
        }
        g.restore();
        g.restore();
      }
      function drawZ(z, r) {
        const cy = Y0 + r * C + C / 2 + 6,
          sc = z.type === "raksasa" ? 1.35 : 1.15,
          neg = z.n < 0,
          x = z.x + (z.st > 0 ? Math.sin(S.t * 70) * 2 : 0);
        g.save();
        g.translate(x, cy);
        g.scale(sc, sc);
        zbody(z);
        g.restore();
        let q = g.createLinearGradient(x + 21, 0, x + 27, 0);
        q.addColorStop(0, "#7a5a38");
        q.addColorStop(1, "#3a2814");
        g.fillStyle = q;
        g.fillRect(x + 21, cy - 80, 6, 16);
        q = g.createLinearGradient(0, cy - 108, 0, cy - 80);
        q.addColorStop(0, neg ? "#6a2a34" : "#7a5a3a");
        q.addColorStop(1, neg ? "#3a141a" : "#4a3420");
        g.fillStyle = q;
        g.beginPath();
        g.roundRect(x - 3, cy - 108, 54, 28, 3);
        g.fill();
        g.strokeStyle = "rgba(0,0,0,.6)";
        g.lineWidth = 1.5;
        g.stroke();
        g.strokeStyle = "rgba(20,10,0,.3)";
        g.lineWidth = 1;
        for (let k = 0; k < 4; k++) {
          g.beginPath();
          g.moveTo(x - 2, cy - 103 + k * 6);
          g.lineTo(x + 50, cy - 103 + k * 6);
          g.stroke();
        }
        g.fillStyle = "#999";
        g.beginPath();
        g.arc(x + 1, cy - 105, 1.3, 0, 7);
        g.arc(x + 45 + 3, cy - 105, 1.3, 0, 7);
        g.arc(x + 1, cy - 83, 1.3, 0, 7);
        g.arc(x + 48, cy - 83, 1.3, 0, 7);
        g.fill();
        g.fillStyle = neg ? "#ffb0a8" : "#f1e4c2";
        g.strokeStyle = "rgba(0,0,0,.55)";
        g.lineWidth = 2.5;
        g.font = '700 23px "Oswald",sans-serif';
        g.textAlign = "center";
        g.textBaseline = "middle";
        const nt = String(z.n).replace("-", "−");
        g.strokeText(nt, x + 24, cy - 93);
        g.fillText(nt, x + 24, cy - 93);
      }
      function zicon(c, q) {
        const sv = g;
        g = c.getContext("2d");
        try {
          g.clearRect(0, 0, c.width, c.height);
          g.save();
          g.translate(20, 62);
          const k = q.type === "raksasa" ? 0.74 : 0.62;
          g.scale(k, k);
          zbody({ type: q.type, ph: 0, eat: 0 });
          g.restore();
        } finally {
          g = sv;
        }
      }
      function drawMower(x, cy) {
        let q = g.createRadialGradient(x + 22, cy + 36, 2, x + 22, cy + 36, 34);
        q.addColorStop(0, "rgba(0,0,0,.5)");
        q.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = q;
        g.beginPath();
        g.ellipse(x + 22, cy + 36, 34, 7, 0, 0, 7);
        g.fill();
        g.strokeStyle = "#b9bec2";
        g.lineWidth = 3;
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(x + 2, cy + 6);
        g.lineTo(x - 8, cy - 14);
        g.lineTo(x - 1, cy - 16);
        g.stroke();
        bx(x, cy + 2, 42, 22, "#b02a20", 5);
        bx(x + 10, cy - 6, 20, 10, "#8a2018", 4);
        bx(x + 4, cy + 22, 34, 4, "#2a2a2a", 1);
        g.fillStyle = "rgba(255,255,255,.25)";
        g.fillRect(x + 4, cy + 4, 30, 2);
        [x + 9, x + 33].forEach((wx) => {
          q = g.createRadialGradient(wx - 2, cy + 25, 1, wx, cy + 28, 9);
          q.addColorStop(0, "#555");
          q.addColorStop(0.7, "#161616");
          q.addColorStop(1, "#000");
          g.fillStyle = q;
          g.beginPath();
          g.arc(wx, cy + 28, 9, 0, 7);
          g.fill();
          ci(wx, cy + 28, 3.5, "#a8aeb4");
        });
      }
      function drawShovel(x, y) {
        g.save();
        g.translate(x, y);
        g.rotate(0.5);
        bx(-3, -44, 6, 48, "#8a6238", 2);
        bx(-11, -50, 22, 6, "#2a2a2a", 3);
        let q = g.createLinearGradient(-14, 0, 14, 0);
        q.addColorStop(0, "#e3e8ec");
        q.addColorStop(0.5, "#9aa3aa");
        q.addColorStop(1, "#4a5258");
        g.fillStyle = q;
        g.strokeStyle = "rgba(0,0,0,.5)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(-14, 2);
        g.lineTo(14, 2);
        g.lineTo(9, 30);
        g.lineTo(0, 37);
        g.lineTo(-9, 30);
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
      }
      function draw() {
        g.drawImage(bg, 0, 0);
        for (let r = 0; r < R; r++) {
          const L = S.L[r],
            cy = Y0 + r * C + C / 2;
          g.save();
          lane3(r);
          if (
            hover &&
            S.run &&
            hover.r === r &&
            hover.c >= 1 &&
            hover.c <= PC
          ) {
            const hx = hover.c * C,
              hy = Y0 + r * C,
              has = !!L.p[hover.c - 1];
            if (S.tool === "shovel") {
              g.fillStyle = has
                ? "rgba(255,60,40,.38)"
                : "rgba(255,255,255,.12)";
              g.fillRect(hx, hy, C, C);
              drawShovel(hx + C / 2, hy + C / 2);
            } else if (!has && S.tool === "potato") {
              g.fillStyle = "rgba(255,255,255,.2)";
              g.fillRect(hx, hy, C, C);
              drawPlant(
                hx + C / 2,
                hy + C / 2,
                { k: 1, hp: 5, mh: 5, ph: 0 },
                0.45,
                0
              );
            } else if (!has) {
              g.fillStyle = "rgba(255,255,255,.2)";
              g.fillRect(hx, hy, C, C);
              g.fillStyle = "rgba(255,255,255,.1)";
              g.fillRect(hx + C, hy, 2 * C, C);
              g.strokeStyle = "rgba(255,255,255,.55)";
              g.lineWidth = 2;
              g.setLineDash([8, 6]);
              g.strokeRect(hx + C + 1, hy + 1, 2 * C - 2, C - 2);
              g.setLineDash([]);
              drawPlant(
                hx + C / 2,
                hy + C / 2,
                { op: S.op, v: S.v, ph: 0 },
                0.45,
                0
              );
            }
          }
          if (L.mx >= 0) drawMower(L.mx, cy);
          else if (L.hm) drawMower(16, cy);
          L.p.forEach((p, i) => {
            if (p)
              drawPlant(
                C * (i + 1) + C / 2,
                cy,
                p,
                1,
                p.sh > 0 ? p.sh / 0.25 : 0
              );
          });
          L.z.forEach((z) => {
            if (z.x < W + 10) {
              drawZ(z, r);
              if (S.fz) {
                g.fillStyle = "rgba(150,220,255,.45)";
                g.strokeStyle = "#e8f8ff";
                g.lineWidth = 3;
                g.beginPath();
                g.roundRect(z.x - 24, cy - 112, 92, 160, 14);
                g.fill();
                g.stroke();
              }
            }
          });
          const z0 = L.z[0],
            pj = z0 && z0.x < W ? settle(r) : null;
          if (pj !== null) {
            const t = "→ " + String(pj).replace("-", "−");
            g.textAlign = "left";
            g.textBaseline = "middle";
            g.font = '700 20px "Oswald",sans-serif';
            g.lineWidth = 5;
            g.strokeStyle = "#3b2410";
            g.fillStyle = pj === 0 ? "#8be28b" : "#ffe27a";
            g.strokeText(t, z0.x + 58, cy - 92);
            g.fillText(t, z0.x + 58, cy - 92);
          }
          S.dead.forEach((d) => {
            if (d.r !== r) return;
            const k = 1 - d.t / 0.9;
            g.save();
            g.globalAlpha = Math.max(0, d.t / 0.9);
            g.translate(d.x + 30, Y0 + d.r * C + C / 2 + 42);
            g.rotate(-k * 1.5);
            bx(-10, -48, 36, 40, "#5a5044", 4);
            ci(8, -58, 15, "#7e8f6a");
            g.restore();
          });
          S.peas.forEach((p) => {
            if (p.r !== r) return;
            const y = Y0 + p.r * C + C / 2 - 4,
              t = lbl(p.op, p.v);
            el(p.x, y + 30, 13, 4, 0, "rgba(0,0,0,.25)");
            ci(p.x, y, 15, OC[p.op][0], OC[p.op][1]);
            g.fillStyle = "#fff";
            g.strokeStyle = "rgba(0,0,0,.6)";
            g.lineWidth = 3;
            g.font = `700 ${t.length > 2 ? 11 : 15}px "Oswald",sans-serif`;
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.strokeText(t, p.x, y + 1);
            g.fillText(t, p.x, y + 1);
          });
          g.restore();
        }
        S.fx.forEach((f) => {
          const r =
            f.k === "t"
              ? f.ln
              : Math.max(0, Math.min(R - 1, Math.floor((f.y - Y0) / C)));
          g.save();
          lane3(r);
          g.globalAlpha = Math.max(0, Math.min(1, f.t * 2));
          if (f.k === "b") {
            g.strokeStyle = "#ffd84a";
            g.lineWidth = 7;
            g.beginPath();
            g.arc(f.x, f.y, (0.6 - f.t) * 150, 0, 7);
            g.stroke();
          } else {
            g.fillStyle = f.col;
            g.strokeStyle = "#3b2410";
            g.lineWidth = 5;
            g.font = '700 28px "Oswald",sans-serif';
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.strokeText(f.txt, f.x + 22, f.y);
            g.fillText(f.txt, f.x + 22, f.y);
          }
          g.globalAlpha = 1;
          g.restore();
        });
      }
      function info() {
        if (!S.run) return;
        S.L.forEach((L, r) => {
          const cy = Y0 + r * C + C / 2;
          g.save();
          lane3(r);
          g.textAlign = "left";
          g.textBaseline = "middle";
          g.font = '700 15px "Oswald",sans-serif';
          g.fillStyle = "rgba(30,18,6,.75)";
          g.fillText("J" + (r + 1), 6, cy - 38);
          const a = S.q.filter((x) => x.lane === r);
          if (a.length) {
            const t =
              a
                .slice(0, 4)
                .map((x) => String(x.n).replace("-", "−"))
                .join(" ") + (a.length > 4 ? " …" : "");
            g.textAlign = "right";
            g.font = '700 17px "Oswald",sans-serif';
            g.lineWidth = 4;
            g.strokeStyle = "#1d2a12";
            g.fillStyle = "#ffe27a";
            g.strokeText(t, W - 6, cy + 32);
            g.fillText(t, W - 6, cy + 32);
          }
          g.restore();
        });
        if (S.phase === "break" && $("pop").hidden) {
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.font = '700 34px "Cinzel",sans-serif';
          g.lineWidth = 7;
          g.strokeStyle = "#3b2410";
          g.fillStyle = "#ffe27a";
          const t = "JEDA " + Math.ceil(S.bt) + " dtk: susun tanamanmu";
          g.strokeText(t, W / 2, Y0 + 24);
          g.fillText(t, W / 2, Y0 + 24);
        }
      }
      function frost() {
        if (!S.fz) return;
        g.fillStyle = "rgba(120,200,255,.16)";
        g.fillRect(0, 0, W, H);
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = '700 40px "Cinzel",sans-serif';
        g.lineWidth = 7;
        g.strokeStyle = "#1d5a8a";
        g.fillStyle = "#e8f8ff";
        const t = "BEKU " + S.fe.toFixed(1) + "s";
        g.strokeText(t, W / 2, Y0 + 22);
        g.fillText(t, W / 2, Y0 + 22);
      }
      
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
