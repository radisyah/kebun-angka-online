/* Klien online FloraBite — dimuat setelah game utama di index.html.
   Pola sama dengan angry-birds-online / war-of-kingdom: kode ruangan 5 karakter, token sesi di localStorage,
   polling ke /api/room (Vercel Function + Upstash Redis). Gelombang zombie sama untuk semua pemain (seed dari server);
   permainan berjalan lokal di tiap perangkat. Room Master melihat layar para pemain lewat cuplikan (snapshot) ±1 dtk sekali. */
(() => {
  "use strict";
  const API = "/api/room",
    SESSION_KEY = "kebun_online_session",
    NAME_KEY = "kebun-nama";
  const $$ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );

  /* generator acak bersertifikat seed — dipakai genWave() di game (window.NETSEED) */
  window.mul32 = function (a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /* bagian game yang disambungkan */
  const goOrig = $("go").onclick,
    drawO = draw,
    overOrig = over;

  /* ---------- state ---------- */
  let ON = null; // { code, token, side }
  let V = null; // tampilan terakhir dari server
  let pollTimer = null,
    statT = 0,
    failCount = 0,
    toastTimer = 0,
    clockOffset = 0;
  let playing = false,
    overSent = false,
    overBusy = false,
    statBusy = false,
    resultShown = false;
  let menuForm = { name: "", code: "" },
    menuErr = "",
    hostBuilt = false,
    lastGameNo = -1;

  function toast(msg) {
    const t = $$("olt");
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.style.display = "none";
    }, 4200);
  }
  const getName = () => {
    try {
      return localStorage.getItem(NAME_KEY) || "";
    } catch (e) {
      return "";
    }
  };
  const saveName = (n) => {
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch (e) {}
  };
  const saveSession = () => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(ON));
    } catch (e) {}
  };
  const loadSession = () => {
    try {
      const o = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return o && o.code && o.token ? o : null;
    } catch (e) {
      return null;
    }
  };
  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  };
  const gesture = () => {
    try {
      A();
    } catch (e) {}
    try {
      goFull();
    } catch (e) {}
    try {
      wake();
    } catch (e) {}
  };

  async function call(action, extra) {
    const body = Object.assign(
      { action },
      ON ? { code: ON.code, token: ON.token } : {},
      extra || {}
    );
    let r, j;
    try {
      r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      j = await r.json();
    } catch (e) {
      throw Object.assign(
        new Error(
          "Tidak bisa terhubung ke server. Periksa koneksi internetmu."
        ),
        { status: 0 }
      );
    }
    if (!j.ok)
      throw Object.assign(new Error(j.error || "Terjadi kesalahan."), {
        status: r.status,
      });
    return j;
  }
  function handleErr(e) {
    if (e.status === 401 || e.status === 404) return sessionLost(e.message);
    toast(e.message || "Terjadi kesalahan.");
  }
  function sessionLost(msg) {
    stopPolling();
    stopStats();
    clearSession();
    ON = null;
    V = null;
    if (playing) {
      location.reload();
      return;
    }
    menuErr = msg || "";
    render();
  }

  /* ---------- polling ---------- */
  function stopPolling() {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = null;
  }
  function pollDelay() {
    if (document.hidden) return 4000;
    if (!V) return 1000;
    return 1000;
  }
  function startPolling() {
    stopPolling();
    const loop = async () => {
      if (!ON) return;
      // pemain yang sedang bermain tidak perlu polling: balasan pengiriman statistik memberi tahu bila status berubah
      if (
        !(
          playing &&
          V &&
          V.side === "player" &&
          V.status === "playing" &&
          !overSent
        )
      )
        await pollOnce();
      if (ON) pollTimer = setTimeout(loop, pollDelay());
    };
    pollTimer = setTimeout(loop, 600);
  }
  async function pollOnce() {
    if (!ON) return;
    try {
      const r = await fetch(
        API +
          "?" +
          new URLSearchParams({
            code: ON.code,
            token: ON.token,
            v: V ? V.v : 0,
            sg: needSig() ? 1 : 0,
          }),
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!j.ok) {
        if (r.status === 404 || r.status === 401) return sessionLost(j.error);
        throw new Error(j.error);
      }
      failCount = 0;
      if (j.unchanged) {
        clockOffset = j.serverNow - Date.now();
        if (j.sig) onSigs(j.sig);
        if (
          V &&
          j.online &&
          JSON.stringify(V.__on) !== JSON.stringify(j.online)
        ) {
          V.__on = j.online;
          V.players.forEach((p) => {
            p.online = !!j.online[p.id];
          });
          V.masterOnline = !!j.online.m;
          render();
        }
        return;
      }
      applyView(j.view);
      if (j.sig) onSigs(j.sig);
    } catch (e) {
      if (++failCount === 3)
        toast("Koneksi tidak stabil… mencoba menyambung kembali");
    }
  }
  function applyView(v) {
    const prev = V;
    V = v;
    clockOffset = v.serverNow - Date.now();
    if (v.status === "abandoned") {
      const m =
        v.leftBy === "master"
          ? "Room Master menutup ruangan."
          : "Ruangan ditutup.";
      if (!(playing && prev && prev.status === "finished")) {
        sessionLost(m);
        return;
      }
    }
    // kembali ke lobi (Main Lagi) setelah bermain: muat ulang agar game bersih
    if (playing && v.status === "lobby") {
      location.reload();
      return;
    }
    if (
      v.side === "player" &&
      v.status === "playing" &&
      !playing &&
      v.seed != null
    )
      startPlayer(v.seed);
    if (v.side === "player" && playing && v.status === "finished") {
      stopStats();
      if (S && S.run) {
        over(false);
        $("ot").textContent = "Permainan dihentikan";
      } // dihentikan Room Master
      resultShown = true;
    }
    if (v.side === "master") feedSnaps(v);
    render();
  }

  /* ---------- layar ---------- */
  function showOnly(which) {
    // 'menu' | 'room' | 'host' | 'game'
    $$("lob").hidden = which === "game" || which === "host";
    $$("host").hidden = which !== "host";
    $$("l1").hidden = which !== "menu";
    $$("l2").hidden = which !== "room";
  }
  function render() {
    if (!V) return showMenu();
    if (V.side === "master") return renderHost();
    if (V.status === "playing" && playing && !resultShown)
      return showOnly("game");
    return renderRoom();
  }

  /* ----- menu ----- */
  function showMenu() {
    showOnly("menu");
    if (!menuForm.name) menuForm.name = getName();
    $$("nm").value = menuForm.name;
    $$("cd").value = menuForm.code;
    $$("lerr").textContent = menuErr;
    menuErr = "";
    ["cp", "cm", "jn"].forEach((i) => {
      $$(i).disabled = false;
    });
  }
  const keep = () => {
    menuForm.name = $$("nm").value;
    menuForm.code = $$("cd")
      .value.toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);
  };
  const nameOk = () => {
    keep();
    if (!menuForm.name.trim()) {
      $$("lerr").textContent = "Isi nama dulu.";
      return false;
    }
    saveName(menuForm.name.trim());
    return true;
  };
  $$("nm").oninput = $$("cd").oninput = () => {
    keep();
    $$("cd").value = menuForm.code;
  };
  $$("jsolo").onclick = () => {
    $$("lob").hidden = true;
    $$("ov").hidden = false;
  };
  const create = async (role) => {
    if (!nameOk()) return;
    if (role === "master") mute = true;
    else A();
    try {
      enter(await call("create", { name: menuForm.name.trim(), role }));
    } catch (e) {
      $$("lerr").textContent = e.message;
    }
  };
  $$("cp").onclick = () => create("player");
  $$("cm").onclick = () => create("master");
  $$("jn").onclick = async () => {
    if (!nameOk()) return;
    if (menuForm.code.length !== 5) {
      $$("lerr").textContent = "Kode ruangan harus 5 karakter.";
      return;
    }
    A();
    try {
      enter(
        await call("join", { code: menuForm.code, name: menuForm.name.trim() })
      );
    } catch (e) {
      $$("lerr").textContent = e.message;
    }
  };
  function enter(j) {
    ON = { code: j.code, token: j.token, side: j.side };
    saveSession();
    V = null;
    applyView(j.view);
    startPolling();
    try {
      history.replaceState(null, "", location.pathname);
    } catch (e) {}
  }
  async function leave() {
    try {
      await call("leave");
    } catch (e) {}
    stopPolling();
    stopStats();
    clearSession();
    location.reload();
  }
  $$("lv").onclick = $$("hlv").onclick = leave;

  /* ----- ruang tunggu / papan skor (pemain) ----- */
  function renderRoom() {
    showOnly("room");
    const v = V,
      me = v.players.find((p) => p.id === v.myId),
      lobby = v.status === "lobby",
      fin = v.status === "finished";
    $$("cb").textContent = v.code;
    const ul = $$("ls");
    ul.innerHTML = "";
    for (let i = 0; i < v.maxPlayers; i++) {
      const p = v.players[i],
        li = document.createElement("li");
      let st = "";
      if (p)
        st = p.left
          ? "Keluar"
          : lobby
          ? p.ready
            ? "SIAP ✔"
            : "Belum siap"
          : p.done
          ? "Selesai ✔"
          : "Bermain…";
      if (p && !p.left && !p.online && !(v.status === "finished"))
        st += " · terputus";
      li.className =
        "ls" +
        (p ? (lobby && p.ready ? " rdy" : "") : " emp") +
        (p && p.id === v.myId ? " me" : "");
      li.innerHTML =
        "<b>Pemain " +
        (i + 1) +
        "</b><span>" +
        (p ? esc(p.name) + (p.id === v.myId ? " (kamu)" : "") : "Kosong") +
        "</span><i>" +
        (p ? st : "&nbsp;") +
        "</i>";
      ul.appendChild(li);
    }
    const rd = $$("rd");
    let msg;
    if (lobby) {
      if (v.isOwner) {
        rd.textContent = "▶ MULAI";
        rd.disabled = !v.canStart;
        msg =
          v.players.length < v.minPlayers
            ? "Butuh minimal " +
              v.minPlayers +
              " pemain. Bagikan kode atau tautan ke temanmu."
            : v.canStart
            ? "Semua siap — tekan MULAI!"
            : "Menunggu semua pemain siap.";
      } else {
        rd.textContent = me && me.ready ? "Batal siap" : "SIAP";
        rd.disabled = !me;
        msg =
          "Menunggu " +
          (v.hasMaster && !v.masterLeft ? "Room Master" : "pemilik ruangan") +
          " menekan Mulai.";
      }
      if (v.hasMaster)
        msg +=
          " 👑 Room Master: " +
          v.masterName +
          (v.masterLeft ? " (sudah keluar)" : "") +
          ".";
    } else if (fin) {
      if (v.isOwner) {
        rd.textContent = "↩ Main lagi";
        rd.disabled = false;
      } else {
        rd.textContent = "Menunggu pemilik ruangan…";
        rd.disabled = true;
      }
      const r = v.ranking || [];
      msg = r[0]
        ? "🏆 Pemenang: " +
          r[0].name +
          " (" +
          r[0].score +
          " poin)" +
          (r[1] && r[1].score === r[0].score && r[1].wave === r[0].wave
            ? " — seri dengan " + r[1].name
            : "")
        : "";
    } else {
      rd.textContent = "Menunggu pemain lain…";
      rd.disabled = true;
      msg =
        v.players.filter((p) => p.done).length +
        "/" +
        v.players.length +
        " pemain selesai.";
    }
    $$("lmsg").textContent = msg;
    const tb = $$("lrk");
    if (fin && v.ranking) {
      tb.hidden = false;
      tb.innerHTML =
        "<tr><th>#</th><th>Pemain</th><th>Skor</th><th>Gelombang</th><th>Hasil</th></tr>" +
        v.ranking
          .map(
            (x, i) =>
              '<tr class="' +
              (x.name === v.myName ? "me" : "") +
              '"><td>' +
              (["🥇", "🥈", "🥉"][i] || i + 1) +
              '</td><td class="n">' +
              esc(x.name) +
              '</td><td class="s">' +
              x.score +
              "</td><td>" +
              x.wave +
              "/" +
              core().MAXW +
              "</td><td>" +
              (x.win ? "🌻 Menang" : x.forfeit ? "🚪 Keluar" : "🧟 Kalah") +
              "</td></tr>"
          )
          .join("");
    } else tb.hidden = true;
  }
  const core = () => window.GameCore;
  $$("rd").onclick = async () => {
    gesture();
    const v = V;
    if (!v) return;
    try {
      if (v.status === "lobby" && v.isOwner)
        applyView((await call("start")).view);
      else if (v.status === "lobby") {
        const me = v.players.find((p) => p.id === v.myId);
        applyView((await call("ready", { ready: !(me && me.ready) })).view);
      } else if (v.status === "finished" && v.isOwner)
        applyView((await call("again")).view);
    } catch (e) {
      handleErr(e);
    }
  };
  $$("cl").onclick = async () => {
    const link =
      location.origin + location.pathname + "?room=" + (V ? V.code : "");
    try {
      await navigator.clipboard.writeText(link);
      toast("Tautan disalin");
    } catch (e) {
      prompt("Salin tautan ini:", link);
    }
  };

  /* ---------- video langsung 360p 24 fps: pemain -> Room Master lewat WebRTC (peer-to-peer) ----------
   Server (Vercel/Redis) hanya dipakai untuk bertukar sinyal SDP satu kali; videonya tidak lewat server.
   Bila WebRTC gagal (jaringan memblokir P2P tanpa TURN), Room Master otomatis memakai cuplikan seperti sebelumnya.
   Jaringan ketat (sekolah/seluler) dilayani server TURN Metered lewat /api/turn. */
  /* Video Room Master: 360p @ 24 fps, DIKUNCI (hemat CPU/jaringan, 4 video sekaligus tetap mulus) */
  const VID_H = 360, VID_FPS = 24, VID_BPS = 8e5;
  /* MODE HEMAT DATA (default): pemain TIDAK mengirim video, hanya keadaan game (JSON terkompresi, ±5–10 KB/dtk)
     lewat WebRTC DataChannel; Room Master menggambar ulang sendiri di 60 fps. USE_VIDEO=true -> kembali ke video 360p lama. */
  const USE_VIDEO = false, SNAP_HZ = 30; // 30×/dtk ≈ 20 KB/dtk per pemain (terkompresi), tembakan & zombie tampak sinkron
  /* Room Master: tiap layar pemain digambar oleh Web Worker + OffscreenCanvas sendiri (render-worker.js) -> memakai beberapa inti CPU
     & GPU laptop secara paralel, sehingga 60 fps tetap lancar. Bila browser tidak mendukung / worker gagal: otomatis pakai cara lama. */
  const CAN_WORKER =
    !USE_VIDEO && typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" && "transferControlToOffscreen" in HTMLCanvasElement.prototype;
  const WCAP = [60, 60, 45, 30];
  const FPS_OK = 21, FPS_MID = 14; // ambang lencana hijau / kuning (24 fps target)
  const STUN_ONLY = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];
  /* Server TURN Metered diambil lewat /api/turn (kunci API tersimpan di env Vercel). Di-cache 5 menit. */
  let iceCache = null,
    iceAt = 0,
    icePromise = null;
  async function getIce() {
    if (iceCache && Date.now() - iceAt < 5 * 60 * 1000) return iceCache;
    if (!icePromise)
      icePromise = (async () => {
        try {
          const ctl = new AbortController(),
            to = setTimeout(() => ctl.abort(), 4000);
          const r = await fetch(
            "/api/turn?" +
              new URLSearchParams({ code: ON.code, token: ON.token }),
            { cache: "no-store", signal: ctl.signal }
          );
          clearTimeout(to);
          const j = await r.json();
          if (j.ok && Array.isArray(j.iceServers) && j.iceServers.length) {
            iceCache = { iceServers: j.iceServers };
            iceAt = Date.now();
            if (!j.turn) console.warn("TURN Metered belum aktif: hanya STUN.");
            return iceCache;
          }
        } catch (e) {}
        return { iceServers: STUN_ONLY }; // gagal: coba lagi pada tawaran berikutnya
      })().finally(() => {
        icePromise = null;
      });
    return icePromise;
  }
  const rid = () => Math.random().toString(36).slice(2, 12);
  function iceDone(pc, ms) {
    // selesai bila pengumpulan kandidat lengkap, atau (setelah relay TURN ada) 400 ms kemudian, atau batas waktu
    return new Promise((res) => {
      if (pc.iceGatheringState === "complete") return res();
      let relayT = 0;
      const t = setTimeout(done, ms || 4000);
      function done() {
        clearTimeout(t);
        clearTimeout(relayT);
        pc.removeEventListener("icegatheringstatechange", chk);
        pc.removeEventListener("icecandidate", cand);
        res();
      }
      function chk() {
        if (pc.iceGatheringState === "complete") done();
      }
      function cand(e) {
        if (e.candidate && e.candidate.type === "relay" && !relayT)
          relayT = setTimeout(done, 400);
      }
      pc.addEventListener("icegatheringstatechange", chk);
      pc.addEventListener("icecandidate", cand);
    });
  }
  /* -- sisi pemain -- */
  let ppc = null,
    pOid = "",
    pSeen = "",
    pAt = 0,
    pTries = 0;
  let pdc = null,
    dcT = 0,
    dcSeq = 0;
  const pConn = () =>
    !!ppc &&
    ppc.connectionState === "connected" &&
    (USE_VIDEO || (!!pdc && pdc.readyState === "open"));
  async function pack(obj) {
    const u = new TextEncoder().encode(JSON.stringify(obj));
    let z = null;
    if (window.CompressionStream && u.length > 300)
      try {
        const cs = new CompressionStream("deflate-raw"),
          w = cs.writable.getWriter();
        w.write(u);
        w.close();
        z = new Uint8Array(await new Response(cs.readable).arrayBuffer());
      } catch (e) {}
    const b = z || u,
      o = new Uint8Array(b.length + 1);
    o[0] = z ? 1 : 0;
    o.set(b, 1);
    return o;
  }
  async function unpack(buf) {
    const u = new Uint8Array(buf);
    let b = u.subarray(1);
    if (u[0] === 1) {
      const ds = new DecompressionStream("deflate-raw"),
        w = ds.writable.getWriter();
      w.write(b);
      w.close();
      b = new Uint8Array(await new Response(ds.readable).arrayBuffer());
    }
    return JSON.parse(new TextDecoder().decode(b));
  }
  function stopDC() {
    clearInterval(dcT);
    dcT = 0;
    pdc = null;
  }
  function openDC(pc) {
    stopDC();
    // tidak berurutan & tanpa pengiriman ulang: data lama dibuang, tidak pernah menumpuk di jaringan lemah
    const ch = (pdc = pc.createDataChannel("state", {
      ordered: false,
      maxRetransmits: 0,
    }));
    ch.binaryType = "arraybuffer";
    ch.onopen = () => {
      clearInterval(dcT);
      let endN = 0;
      dcT = setInterval(async () => {
        if (!playing || !S || pdc !== ch || ch.readyState !== "open") return;
        if (!S.run && ++endN > 4) {
          clearInterval(dcT); // game selesai: hentikan pengiriman (4 frame "selesai" sudah terkirim)
          dcT = 0;
          return;
        }
        if (ch.bufferedAmount > 12000) return; // jaringan macet: lewati frame ini
        try {
          ch.send(await pack({ q: ++dcSeq, s: mk() }));
        } catch (e) {}
      }, 1000 / SNAP_HZ);
    };
    ch.onclose = () => {
      if (pdc === ch) stopDC();
    };
  }
  function closeStream() {
    stopDC();
    if (ppc) {
      try {
        ppc.close();
      } catch (e) {}
    }
    ppc = null;
  }
  async function startStream() {
    if (
      !window.RTCPeerConnection ||
      (USE_VIDEO && !cv.captureStream) ||
      !ON ||
      ON.side !== "player"
    )
      return;
    closeStream();
    pAt = Date.now();
    pTries++;
    const ice = await getIce();
    if (!ON || !playing) return;
    const pc = (ppc = new RTCPeerConnection(ice)),
      oid = (pOid = rid());
    try {
      if (!USE_VIDEO) openDC(pc);
      const stream = USE_VIDEO ? cv.captureStream(VID_FPS) : new MediaStream();
      stream.getVideoTracks().forEach((t) => {
        try {
          t.contentHint = "motion";
        } catch (e) {}
        pc.addTrack(t, stream);
      });
      try {
        // 360p @ 24 fps: resolusi dibatasi, fps dipertahankan (resolusi yang turun lebih dulu bila jaringan lambat)
        const sd = pc.getSenders()[0],
          pr = sd.getParameters();
        if (!pr.encodings || !pr.encodings.length) pr.encodings = [{}];
        pr.encodings[0].maxFramerate = VID_FPS;
        pr.encodings[0].maxBitrate = VID_BPS;
        pr.encodings[0].scaleResolutionDownBy = Math.max(1, cv.height / VID_H);
        pr.degradationPreference = "maintain-framerate";
        await sd.setParameters(pr);
      } catch (e) {}
      await pc.setLocalDescription(await pc.createOffer());
      await iceDone(pc);
      if (ppc !== pc) return;
      await call("sig", {
        to: "m",
        msg: {
          id: oid,
          g: V ? V.gameNo : 0,
          type: "offer",
          sdp: pc.localDescription.sdp,
        },
      });
    } catch (e) {
      /* dicoba lagi oleh maybeRestream() */
    }
  }
  function onPlayerSig(m) {
    if (
      !ppc ||
      m.type !== "answer" ||
      m.id === pSeen ||
      m.oid !== pOid ||
      ppc.signalingState !== "have-local-offer"
    )
      return;
    pSeen = m.id;
    ppc.setRemoteDescription({ type: "answer", sdp: m.sdp }).catch(() => {});
  }
  function maybeRestream() {
    // belum tersambung setelah 9 dtk / terputus -> tawarkan ulang (maks. 8x)
    if (!playing || overSent || pTries >= 8 || !ppc) return;
    const st = ppc.connectionState;
    if (st !== "connected" && Date.now() - pAt > 9000) startStream();
  }
  /* -- sisi Room Master -- */
  const MP = {},
    MSEEN = {}; // MP[k] = { pc, oid }
  const needSig = () =>
    !!V &&
    V.side === "master" &&
    V.status === "playing" &&
    V.players.some((p, k) => !p.done && !p.left && !(HC[k] && (HC[k].live || HC[k].dc || HC[k].fin)));
  function closePeer(k) {
    const m = MP[k];
    if (m) {
      try {
        m.pc.close();
      } catch (e) {}
      delete MP[k];
    }
    const c = HC[k];
    if (c) {
      c.live = false;
      c.dc = false;
      c.dseq = -1;
      c.fps = 0;
      if (c.vid) {
        c.vid.srcObject = null;
        c.vid.hidden = true;
      }
      const cvEl = c.d && c.d.querySelector("canvas"); // layar yang digambar worker tidak punya c.cx
      if (cvEl) cvEl.style.visibility = "";
      setT(c.hf, "Cuplikan");
      c.hf.className = "hf";
    }
    if (HV[k]) HV[k].pt = 0;
  }
  function onSigs(sig) {
    if (!V || V.side !== "master" || V.status !== "playing") return;
    Object.keys(sig).forEach((k) => {
      if (HC[k] && HC[k].fin) return;
      const m = sig[k];
      if (m && m.type === "offer" && m.g === V.gameNo && MSEEN[k] !== m.id) {
        MSEEN[k] = m.id;
        answerOffer(k, m);
      }
    });
  }
  async function answerOffer(k, m) {
    if (!window.RTCPeerConnection) return;
    closePeer(k);
    const pc = new RTCPeerConnection(await getIce());
    MP[k] = { pc, oid: m.id };
    const c = HC[k];
    if (!c) return;
    pc.ondatachannel = (e) => onDC(k, c, pc, e.channel);
    pc.ontrack = (e) => {
      c.vid.srcObject = e.streams[0] || new MediaStream([e.track]);
      c.vid.hidden = false;
      c.vid.play().catch(() => {});
      try {
        e.receiver.jitterBufferTarget = 40;
      } catch (er) {}
      try {
        e.receiver.playoutDelayHint = 0.04;
      } catch (er) {}
      watchFps(c, k);
    };
    pc.onconnectionstatechange = () => {
      if (MP[k] && MP[k].pc !== pc) return;
      if (pc.connectionState === "connected") {
        if (USE_VIDEO) {
          c.live = true;
          const cvEl = c.d && c.d.querySelector("canvas");
          if (cvEl) cvEl.style.visibility = "hidden";
        }
      } else if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      )
        closePeer(k);
      else if (pc.connectionState === "disconnected")
        setTimeout(() => {
          if (MP[k] && MP[k].pc === pc && pc.connectionState !== "connected")
            closePeer(k);
        }, 4000);
    };
    try {
      await pc.setRemoteDescription({ type: "offer", sdp: m.sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await iceDone(pc);
      if (!MP[k] || MP[k].pc !== pc) return;
      await call("sig", {
        to: String(k),
        msg: {
          id: rid(),
          oid: m.id,
          g: m.g,
          type: "answer",
          sdp: pc.localDescription.sdp,
        },
      });
    } catch (e) {
      if (MP[k] && MP[k].pc === pc) closePeer(k);
    }
  }
  /* Mode hemat data: terima keadaan game dari pemain, gambar ulang di canvas Room Master (60 fps) */
  function onDC(k, c, pc, ch) {
    ch.binaryType = "arraybuffer";
    let n = 0,
      t0 = 0;
    ch.onmessage = async (e) => {
      if (c.fin || !MP[k] || MP[k].pc !== pc) return;
      let o, sn = null;
      try {
        o = await unpack(e.data);
        sn = core().cleanSnap(o.s);
      } catch (er) {
        return;
      }
      if (!sn || typeof o.q !== "number" || o.q <= c.dseq) return; // frame lama/tiba terlambat: buang
      c.dseq = o.q;
      c.dc = true;
      if (sn.run === false) {
        finishCell(k, sn.score, sn.w); // pemain selesai: langsung hentikan & hitamkan
        return;
      }
      HV[k] = { snap: sn, t: 0, at: performance.now(), pt: 0 };
      const now = performance.now();
      if (!t0) t0 = now;
      n++;
      if (now - t0 >= 1000) {
        const hz = Math.round((n * 1000) / (now - t0));
        n = t0 = 0;
        setT(c.hf, "DATA " + hz + "/dtk");
        c.hf.className = "hf " + (hz >= SNAP_HZ * 0.6 ? "ok" : hz >= SNAP_HZ * 0.3 ? "mid" : "bad");
      }
    };
    ch.onclose = () => {
      if (MP[k] && MP[k].pc === pc) closePeer(k);
    };
  }
  /* fps video yang benar-benar diterima & ditampilkan (bukan perkiraan) */
  function watchFps(c, k) {
    const v = c.vid;
    if (!v.requestVideoFrameCallback) return;
    const stamp = ++c.wf;
    let n = 0,
      t0 = 0;
    const cb = (now) => {
      if (c.wf !== stamp) return;
      n++;
      if (!t0) t0 = now;
      if (now - t0 >= 1000) {
        c.fps = Math.round((n * 1000) / (now - t0));
        n = 0;
        t0 = now;
        setT(c.hf, "VIDEO " + c.fps + " FPS");
        c.hf.className =
          "hf " + (c.fps >= FPS_OK ? "ok" : c.fps >= FPS_MID ? "mid" : "bad");
      }
      v.requestVideoFrameCallback(cb);
    };
    v.requestVideoFrameCallback(cb);
  }
  function closeAllPeers() {
    for (let k = 0; k < 4; k++) closePeer(k);
  }

  /* ---------- sisi pemain: main & kirim statistik + cuplikan layar ---------- */
  function startPlayer(seed) {
    if (playing) return;
    playing = true;
    overSent = false;
    overBusy = false;
    resultShown = false;
    window.NETSEED = seed | 0; // gelombang zombie sama untuk semua pemain
    $$("lob").hidden = true;
    goOrig();
    sendStats();
    statT = setInterval(sendStats, 1000);
    startStream();
  }
  over = function (w) {
    overOrig(w);
    if (ON && ON.side === "player" && playing && !overSent) {
      $$("o3").textContent = "Menunggu pemain lain…";
      $$("o3").hidden = false;
      $$("go").textContent = "Lihat ruang tunggu";
      sendOver(w);
    }
  };
  $$("go").onclick = () => {
    if (ON && ON.side === "player" && S && !S.run) {
      resultShown = true;
      render();
      return;
    }
    goOrig();
  };
  function mk() {
    // cuplikan keadaan game (dipakai Room Master untuk menggambar layar pemain)
    return {
      t: S.t,
      w: S.w,
      phase: S.phase,
      wl: S.run && S.wl && !$$("pop").hidden ? S.wl.map((q) => ({ lane: q.lane, n: q.n, type: q.type })) : undefined, // info zombie: hanya selama popup "Gelombang N" terlihat di layar pemain
      bt: S.bt,
      score: S.score,
      mowers: S.mowers,
      fz: S.fz,
      fe: S.fe,
      run: S.run,
      q: S.q.map((x) => ({ lane: x.lane, n: x.n })),
      L: S.L.map((L) => ({
        hm: L.hm,
        mx: L.mx,
        p: L.p.map((p) =>
          p
            ? {
                op: p.op,
                v: p.v,
                k: p.k,
                hp: p.hp,
                mh: p.mh,
                ph: p.ph,
                sh: p.sh,
              }
            : null
        ),
        z: L.z.map((z) => ({
          x: Math.round(z.x),
          n: z.n,
          type: z.type,
          eat: z.eat,
          st: z.st,
          ph: z.ph,
          v: z.v,
          fl: z.fl,
        })),
      })),
      peas: S.peas.map((p) => ({
        r: p.r,
        x: Math.round(p.x),
        op: p.op,
        v: p.v,
      })),
      dead: S.dead,
      fx: S.fx,
    };
  }
  async function sendStats() {
    if (!ON || overSent || !playing || !S || statBusy) return;
    statBusy = true;
    try {
      const live = pConn(); // video langsung tersambung -> cuplikan tidak perlu dikirim
      maybeRestream();
      const j = await call("stats", {
        stats: { score: S.score, wave: S.w, done: !S.run, win: false },
        snap: live ? undefined : mk(),
        sg: live ? 0 : 1,
      });
      failCount = 0;
      if (j.sig) onPlayerSig(j.sig);
      if (V && (j.status !== "playing" || j.gameNo !== V.gameNo)) pollOnce();
    } catch (e) {
      if (e.status === 401 || e.status === 404) handleErr(e);
    }
    statBusy = false;
  }
  async function sendOver(win) {
    if (overBusy || overSent) return;
    overBusy = true;
    stopStats();
    const result = { score: S.score, wave: S.w, win: !!win };
    for (let i = 0; i < 20 && !overSent; i++) {
      try {
        const j = await call("over", { result });
        overSent = true;
        applyView(j.view);
      } catch (e) {
        if (e.status === 409) {
          overSent = true;
          pollOnce();
          break;
        } // permainan sudah dihentikan / selesai
        if (e.status === 401 || e.status === 404) {
          handleErr(e);
          break;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    overBusy = false;
  }
  function stopStats() {
    clearInterval(statT);
    statT = 0;
  }

  /* ---------- Room Master: melihat layar semua pemain ---------- */
  const HV = {},
    HC = {},
    HS = 0.7,
    HW = 700,
    HH = Math.round(H * HS),
    CAP = 1.5;
  /* Info zombie per gelombang DI DALAM kotak tiap pemain: cermin popup "Gelombang N" di layar pemain (muncul/hilang realtime). */
  function popSync(c, h) {
    const sn = h && h.snap,
      raw = !c.fin && sn && sn.run !== false && Array.isArray(sn.wl) ? sn.wl.slice(0, 40) : [];
    if (!raw.length) {
      if (!c.hp.hidden) c.hp.hidden = true;
      c.pk = "";
      return;
    }
    const list = raw.map((q) => ({ lane: (+q.lane | 0) % 5, n: +q.n | 0, type: String(q.type) })),
      key = sn.w + ":" + list.map((q) => q.lane + "," + q.n + "," + q.type).join(";");
    if (key !== c.pk) {
      c.pk = key;
      const box = c.hp.querySelector(".hpl"),
        sS = S;
      box.innerHTML = "";
      setT(c.hp.querySelector(".hpt"), "Gelombang " + sn.w + " dari " + core().MAXW);
      setT(c.hp.querySelector(".hpc"), list.length + " zombie akan lewat. Zombie bernegatif (angka merah) perlu tanaman + atau × −1.");
      S = { t: 0 }; // gambar ikon zombie membaca S.t
      try {
        list.forEach((q) => {
          const d = document.createElement("div"),
            cv = document.createElement("canvas"),
            b = document.createElement("b"),
            m = document.createElement("small");
          d.className = "zi";
          cv.width = 70;
          cv.height = 90;
          b.textContent = String(q.n).replace("-", "−");
          if (q.n < 0) b.className = "ng";
          m.textContent = "J" + (q.lane + 1) + " · " + (ZN[q.type] || "Zombie");
          d.appendChild(cv);
          d.appendChild(b);
          d.appendChild(m);
          box.appendChild(d);
          try {
            zicon(cv, q);
          } catch (e) {}
        });
      } finally {
        S = sS;
      }
    }
    if (c.hp.hidden) c.hp.hidden = false;
  }
  /* Pemain selesai: hentikan pengambilan gameplay (tutup koneksi & berhenti menggambar), kotak jadi hitam + "Selesai" & skor. */
  function finishCell(k, score, wave) {
    k = +k; // dari jalur DataChannel k berupa teks: jangan sampai "0"+1 = "01"
    const c = HC[k];
    if (!c || c.fin) return;
    c.fin = true;
    c.fs = { score: +score || 0, wave: +wave || 0 };
    c.d.classList.add("fin");
    c.hp.hidden = true;
    c.pk = "";
    if (c.w) {
      c.sent = null;
      c.w.postMessage({ t: "clear" });
      c.w.postMessage({ t: "pause", v: true });
    }
    delete HV[k];
    closePeer(k);
    setT(c.hf, "Selesai");
    c.hf.className = "hf";
    cellStatus(k);
  }
  function unfinCell(c) {
    if (!c || !c.fin) return;
    c.fin = false;
    c.fs = null;
    c.d.classList.remove("fin");
    if (c.w) c.w.postMessage({ t: "pause", v: false });
  }
  function mkCx(cvs) {
    const cx = cvs.getContext("2d", { alpha: false }); // tanpa transparansi: komposit lebih ringan
    cx.fillStyle = "#0e130b";
    cx.fillRect(0, 0, cvs.width, cvs.height);
    return cx;
  }
  function workerFail(k) {
    const c = HC[k];
    if (!c || !c.w) return;
    try { c.w.terminate(); } catch (e) {}
    c.w = null;
    const old = c.d.querySelector("canvas"), nw = document.createElement("canvas");
    nw.width = Math.round(W * (c.hs || HS));
    nw.height = Math.round(H * (c.hs || HS));
    old.replaceWith(nw); // canvas lama sudah diserahkan ke worker; pakai canvas baru di thread utama
    c.cx = mkCx(nw);
    c.nx = undefined;
    if (HV[k]) HV[k].pt = 0;
  }
  function buildHost() {
    const gr = $$("hg");
    for (const k in HC) if (HC[k].w) try { HC[k].w.terminate(); } catch (e) {}
    gr.innerHTML = "";
    for (let k = 0; k < 4; k++) {
      const d = document.createElement("div");
      d.className = "hc";
      d.innerHTML =
        '<div class="hb"><b></b><i class="hf">Cuplikan</i><span></span><em class="zb">🔍 Zoom</em></div><div class="hw"><canvas></canvas><video muted playsinline autoplay hidden></video><div class="ho"></div><div class="hp" hidden><b class="hpt"></b><span class="hpc"></span><div class="hpl"></div></div></div>';
      const cvs = d.querySelector("canvas");
      cvs.width = HW;
      cvs.height = HH;
      let cx = null, w = null;
      if (CAN_WORKER)
        try {
          const off = cvs.transferControlToOffscreen();
          w = new Worker("render-worker.js");
          w.postMessage({ t: "init", canvas: off, scale: HS }, [off]);
        } catch (e) { w = null; }
      if (!w) cx = mkCx(cvs);
      HC[k] = {
        w,
        sent: null,
        wf: 0,
        wlv: 0,
        lab: d.querySelector("b"),
        chip: d.querySelector(".hb span"),
        hf: d.querySelector(".hf"),
        zb: d.querySelector(".zb"),
        hp: d.querySelector(".hp"),
        pk: "",
        fin: false,
        d,
        hs: HS,
        vid: d.querySelector("video"),
        ov: d.querySelector(".ho"),
        cx,
        live: false,
        fps: 0,
        wf: 0,
      };
      if (w) {
        w.onmessage = (e) => {
          const m = e.data, c = HC[k];
          if (!c) return;
          if (m.t === "fps") { c.wf = m.f; c.wlv = m.lv; }
          else if (m.t === "err") workerFail(k);
        };
        w.onerror = () => workerFail(k);
      }
      d.onclick = () => zoomCell(ZK === k ? -1 : k);
      gr.appendChild(d);
    }
    ZK = -1;
    hostBuilt = true;
  }
  /* Zoom: klik kotak pemain (atau tombol 1–4) untuk memperbesar; klik lagi / Esc untuk kembali.
     Kotak yang diperbesar digambar ulang beresolusi lebih tinggi; kotak lain berhenti digambar selama zoom (hemat CPU). */
  let ZK = -1;
  function zoomCell(k) {
    if (!hostBuilt || (k >= 0 && !HC[k])) return;
    ZK = k;
    gBad = gGood = 0;
    for (let i = 0; i < 4; i++) {
      const c = HC[i];
      c.d.classList.toggle("zoom", i === k);
      setT(c.zb, i === k ? "✕ Tutup" : "🔍 Zoom");
      if (c.w) c.w.postMessage({ t: "pause", v: !!c.fin || (k >= 0 && i !== k) }); // layar yang tertutup berhenti digambar
    }
    requestAnimationFrame(() => {
      for (let i = 0; i < 4; i++) {
        const c = HC[i],
          cs = c.d.querySelector("canvas");
        let hs = c.w ? HS : hsc;
        if (i === k) {
          const r = cs.getBoundingClientRect(),
            dpr = window.devicePixelRatio || 1;
          hs = Math.min(1.5, Math.max(hsc, Math.min(r.width / W, r.height / H) * dpr));
        }
        c.hs = hs;
        if (c.w) c.w.postMessage({ t: "size", scale: hs });
        else {
          cs.width = Math.round(W * hs);
          cs.height = Math.round(H * hs);
        }
        if (HV[i]) HV[i].pt = 0; // paksa gambar ulang
      }
    });
  }
  window.addEventListener("resize", () => {
    if (ZK >= 0) zoomCell(ZK);
  });
  document.addEventListener("keydown", (e) => {
    if (!hostBuilt || $$("host").hidden || /INPUT|TEXTAREA/.test((e.target || {}).tagName || "")) return;
    if (e.key === "Escape") zoomCell(-1);
    else if (/^[1-4]$/.test(e.key)) zoomCell(ZK === +e.key - 1 ? -1 : +e.key - 1);
  });
  function enterHostMode() {
    mute = true;
    Music.go(null);
    Music.vol();
    A = function () {
      return null;
    };
    draw = function () {};
    $$("app").hidden = true;
    $$("ov").hidden = true;
    buildHost();
    requestAnimationFrame(hostRender);
  }
  function clearHost() {
    for (let k = 0; k < 4; k++) {
      delete HV[k];
      const c = HC[k];
      if (!c) continue;
      unfinCell(c);
      c.hp.hidden = true;
      c.pk = "";
      if (c.w) {
        c.sent = null;
        c.w.postMessage({ t: "clear" });
        continue;
      }
      c.cx.setTransform(1, 0, 0, 1, 0, 0);
      c.cx.fillStyle = "#0e130b";
      c.cx.fillRect(0, 0, c.cx.canvas.width, c.cx.canvas.height);
    }
  }
  function feedSnaps(v) {
    if (v.gameNo !== lastGameNo) {
      lastGameNo = v.gameNo;
      closeAllPeers();
      for (const k in MSEEN) delete MSEEN[k];
      clearHost();
    }
    if (v.status !== "playing") return;
    v.players.forEach((p, k) => {
      const s = p.stats;
      if (!s || !s.snap || (HC[k] && (HC[k].dc || HC[k].fin))) return;
      const cur = HV[k];
      if (cur && cur.t >= s.t) return;
      HV[k] = { snap: s.snap, t: s.t, at: performance.now(), pt: 0 };
    });
  }
  function setT(el, t) {
    if (el && el.textContent !== t) el.textContent = t;
  }
  function renderHost() {
    showOnly("host");
    if (!hostBuilt) enterHostMode();
    const v = V,
      n = v.players.length,
      rd = v.players.filter((p) => p.ready).length,
      b = $$("hgo");
    $$("hs").textContent =
      v.status === "playing"
        ? "Pertandingan berlangsung"
        : v.status === "finished"
        ? "Ronde selesai"
        : n + "/" + v.maxPlayers + " pemain · " + rd + " siap";
    if (!$$("hu").firstChild || $$("hu").dataset.c !== v.code) {
      $$("hu").dataset.c = v.code;
      $$("hu").innerHTML =
        "Kode ruangan: <b>" +
        esc(v.code) +
        '</b> · <button class="lbtn sm" id="hcl">🔗 Salin Tautan</button>';
      $$("hcl").onclick = $$("cl").onclick;
    }
    if (v.status === "playing") {
      b.textContent = "Hentikan";
      b.disabled = false;
      b.className = "lbtn red";
    } else if (v.status === "finished") {
      b.textContent = "↩ Main lagi";
      b.disabled = false;
      b.className = "lbtn";
    } else {
      b.textContent = "MULAI";
      b.disabled = !v.canStart;
      b.className = "lbtn";
    }
    const show = v.status === "finished" && v.ranking;
    $$("hr").hidden = !show;
    if (show)
      $$("hr").textContent =
        "🏆 Hasil ronde terakhir: " +
        v.ranking
          .map(
            (r, i) =>
              i +
              1 +
              ". " +
              r.name +
              " (" +
              r.score +
              (r.win
                ? ", menang"
                : r.forfeit
                ? ", keluar"
                : ", gel. " + r.wave) +
              ")"
          )
          .join("  ·  ");
    for (let k = 0; k < 4; k++) cellStatus(k);
  }
  const finText = (c, head) =>
    head + "\nSkor " + (c.fs ? c.fs.score : 0) + (c.fs && c.fs.wave ? " · Gel. " + c.fs.wave + "/" + core().MAXW : "");
  function cellStatus(k) {
    const v = V,
      c = HC[k];
    if (!v || !c) return;
    const p = v.players[k],
      h = HV[k];
    let chip = "",
      ov = "";
    if (!p) {
      chip = "Kosong";
      ov = "Menunggu pemain…";
    } else if (v.status === "lobby") {
      chip = p.left
        ? "Keluar"
        : p.online
        ? p.ready
          ? "SIAP ✔"
          : "Belum siap"
        : "Terputus";
      if (c.fin) unfinCell(c);
      ov = h ? "" : chip;
    } else if (v.status === "finished") {
      const r = (v.ranking || []).find((x) => x.name === p.name);
      if (!c.fin) finishCell(k, r ? r.score : 0, r ? r.wave : 0);
      chip = r
        ? "Selesai · Skor " +
          r.score +
          " · Gel. " +
          r.wave +
          (r.win ? " · MENANG" : r.forfeit ? " · keluar" : "")
        : "Selesai";
      ov = finText(c, r ? "Selesai" : "Selesai") + (r && r.win ? "\nMENANG 🎉" : "");
    } else {
      const s = p.stats;
      if ((p.done || p.left) && !c.fin) finishCell(k, s ? s.score : h && h.snap ? h.snap.score : 0, s ? s.wave : h && h.snap ? h.snap.w : 0);
      chip = p.left
        ? "Keluar"
        : p.done
        ? "Selesai" + (s ? " · Skor " + s.score + " · Gel. " + s.wave : "")
        : !p.online
        ? "Terputus"
        : s
        ? "Skor " + s.score + " · Gel. " + s.wave + "/" + core().MAXW
        : "Memulai…";
      ov = c.fin ? finText(c, p.left ? "Keluar" : "Selesai") : h ? "" : "Memulai…";
    }
    setT(c.lab, "Pemain " + (k + 1) + (p ? " · " + p.name : ""));
    setT(c.chip, chip);
    setT(c.ov, ov);
    c.ov.hidden = !ov;
  }
  $$("hgo").onclick = async () => {
    const v = V;
    if (!v) return;
    try {
      if (v.status === "playing") {
        if (!confirm("Hentikan pertandingan untuk semua pemain?")) return;
        applyView((await call("stop")).view);
      } else if (v.status === "finished") applyView((await call("again")).view);
      else applyView((await call("start")).view);
    } catch (e) {
      handleErr(e);
    }
  };
  /* Tayangan cadangan Room Master digambar 24 fps (diatur dengan pewaktu akumulator supaya tetap rata-rata 24 di layar 120/144 Hz)
   dan fps yang benar-benar tergambar ditampilkan di #hfps. */
  /* Pengatur beban otomatis (Room Master): menjaga fps tiap pemain ±30.
     Bila laptop kewalahan, turun bertahap: resolusi gambar 0.7 -> 0.62 (±360p), lalu fps per pemain 30 -> 24 -> 20 -> 15.
     Bila sudah longgar beberapa detik, naik lagi. Gambar tiap pemain digilir (paling banyak 2 per frame) agar beban merata. */
  const LV = [[HS, 30], [0.62, 30], [0.62, 24], [0.62, 20], [0.62, 15]]; // [skala gambar, fps per pemain]
  let lvl = 0,
    hsc = LV[0][0],
    hz = LV[0][1],
    gBad = 0,
    gGood = 0,
    gN = 0,
    gMs = 0,
    fpsT = 0,
    fpsEl = null;
  function applyLevel() {
    hsc = LV[lvl][0];
    hz = LV[lvl][1];
    for (let k = 0; k < 4; k++) {
      const c = HC[k];
      if (!c || c.w || k === ZK || c.hs === hsc) continue;
      c.hs = hsc;
      c.cx.canvas.width = Math.round(W * hsc);
      c.cx.canvas.height = Math.round(H * hsc);
      if (HV[k]) HV[k].pt = 0;
    }
  }
  function hostRender(now) {
    const zoomed = ZK >= 0,
      tgt = zoomed ? Math.min(60, hz * 2) : hz,
      step = 1000 / tgt,
      due = [];
    let act = 0;
    for (let k = 0; k < 4; k++) {
      const h = HV[k],
        c = HC[k];
      if (c && h !== c.psnap) {
        c.psnap = h;
        popSync(c, h); // popup info zombie realtime di kotak pemain
      }
      if (c && c.w) {
        if (h && c.sent !== h) {
          c.sent = h;
          c.w.postMessage({ t: "snap", s: h.snap }); // worker menggambar sendiri di 60 fps
        }
        continue;
      }
      if (!h || !c || c.live || (zoomed && ZK !== k)) continue;
      act++;
      if (c.nx === undefined || now - c.nx > 250) c.nx = now + (k * step) / 4; // awal / setelah tab disembunyikan: sebar waktunya
      if (now >= c.nx - 1) due.push(c);
    }
    due.sort((a, b) => a.nx - b.nx);
    for (let i = 0; i < due.length && i < 2; i++) {
      const c = due[i],
        k = +Object.keys(HC).find((x) => HC[x] === c),
        t0 = performance.now();
      c.nx += step;
      if (now > c.nx) c.nx = now + step; // tidak menumpuk frame yang terlewat
      try {
        paintHost(c, HV[k], now);
      } catch (e) {}
      gMs += performance.now() - t0;
      gN++;
    }
    if (!fpsT) fpsT = now;
    const dt = now - fpsT;
    if (dt >= 500) {
      let f = act ? Math.round((gN * 1000) / dt / act) : 0;
      const busy = gMs / dt; // porsi waktu yang dipakai untuk menggambar
      if (act && dt < 1500) {
        if (f < tgt * 0.85) {
          gBad++;
          gGood = 0;
        } else if (f >= tgt * 0.95 && busy < 0.5) {
          gGood++;
          gBad = 0;
        } else gGood = gBad = 0;
        if (gBad >= 3 && lvl < LV.length - 1) {
          lvl++;
          applyLevel();
          gBad = 0;
        } else if (gGood >= 12 && lvl > 0) {
          lvl--;
          applyLevel();
          gGood = 0;
        }
      }
      gN = 0;
      gMs = 0;
      fpsT = now;
      const lv = [0, 1, 2, 3]
        .map((k) => HC[k])
        .filter((c) => c && c.live && c.fps);
      if (lv.length)
        f = Math.min.apply(
          null,
          lv.map((c) => c.fps)
        ); // ada video langsung: tampilkan fps video terendah
      let top = tgt, q = lvl;
      const wk = [0, 1, 2, 3].filter((k) => HC[k] && HC[k].w && HV[k] && HC[k].wf >= 0 && (!zoomed || ZK === k));
      if (wk.length) {
        f = Math.min.apply(null, wk.map((k) => HC[k].wf));
        q = Math.max.apply(null, wk.map((k) => HC[k].wlv));
        top = Math.min.apply(null, wk.map((k) => WCAP[HC[k].wlv || 0]));
      }
      fpsEl = fpsEl || $$("hfps");
      if (fpsEl) {
        setT(fpsEl, (lv.length ? "VIDEO " : "") + f + " FPS" + (q ? " ·hemat" + q : ""));
        const r = lv.length ? f / VID_FPS : f / top;
        fpsEl.className = r >= 0.85 ? "ok" : r >= 0.6 ? "mid" : "bad";
      }
    }
    requestAnimationFrame(hostRender);
  }
  function paintHost(c, v, now) {
    const sn = v.snap;
    if (!sn.run && v.pt) return;
    const el = sn.fz || !sn.run ? 0 : Math.min(CAP, (now - v.at) / 1000); // gerakan diperkirakan di antara dua cuplikan
    if (!el && v.pt === 2) return; // tidak ada gerakan: gambar sebelumnya masih sama
    v.pt = el ? 1 : 2;
    const view = el
      ? Object.assign({}, sn, {
          t: sn.t + el,
          peas: sn.peas.map((p) => Object.assign({}, p, { x: p.x + 560 * el })),
          L: sn.L.map((L) =>
            Object.assign({}, L, {
              mx: L.mx >= 0 ? L.mx + 650 * el : L.mx,
              z: L.z.map((z) =>
                z.eat > 0 || z.st > 0
                  ? z
                  : Object.assign({}, z, { x: z.x - z.v * el })
              ),
            })
          ),
        })
      : sn;
    const sg = g,
      sS = S,
      sh = hover;
    g = c.cx;
    S = view;
    hover = null;
    try {
      g.setTransform(c.hs || HS, 0, 0, c.hs || HS, 0, 0);
      drawO();
      info();
      frost();
    } finally {
      g = sg;
      S = sS;
      hover = sh;
    }
  }

  /* ---------- awal ---------- */
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && ON) pollOnce();
  });
  (async function init() {
    const q = new URLSearchParams(location.search);
    const roomParam = (q.get("room") || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);
    const saved = loadSession();
    if (roomParam && !(saved && saved.code === roomParam))
      menuForm.code = roomParam;
    if (saved && (!roomParam || roomParam === saved.code)) {
      ON = saved;
      try {
        const r = await fetch(
          API +
            "?" +
            new URLSearchParams({ code: ON.code, token: ON.token, v: 0 }),
          { cache: "no-store" }
        );
        const j = await r.json();
        if (j.ok && j.view && j.view.status !== "abandoned") {
          const v = j.view;
          // game berjalan & halaman dimuat ulang di tengah main: skor lokal hilang, jadi pemain dianggap gugur
          if (
            v.side === "player" &&
            v.status === "playing" &&
            !v.players.find((p) => p.id === v.myId).done
          ) {
            try {
              await call("leave");
            } catch (e) {}
            clearSession();
            ON = null;
            menuErr =
              "Halaman dimuat ulang saat bermain, jadi kamu dianggap keluar dari ronde ini. Gabung lagi di ronde berikutnya.";
            render();
            return;
          }
          if (v.side === "master") mute = true;
          else A();
          applyView(v);
          startPolling();
          return;
        }
      } catch (e) {
        /* jatuh ke menu */
      }
      clearSession();
      ON = null;
      V = null;
    }
    render();
  })();
})();
