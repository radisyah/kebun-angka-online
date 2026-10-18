/* Klien online Kebun Angka — dimuat setelah game utama di index.html.
   Pola sama dengan angry-birds-online / war-of-kingdom: kode ruangan 5 karakter, token sesi di localStorage,
   polling ke /api/room (Vercel Function + Upstash Redis). Gelombang zombie sama untuk semua pemain (seed dari server);
   permainan berjalan lokal di tiap perangkat. Room Master melihat layar para pemain lewat cuplikan (snapshot) ±1 dtk sekali. */
(() => {
'use strict';
const API = '/api/room', SESSION_KEY = 'kebun_online_session', NAME_KEY = 'kebun-nama';
const $$ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* generator acak bersertifikat seed — dipakai genWave() di game (window.NETSEED) */
window.mul32 = function (a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* bagian game yang disambungkan */
const goOrig = $('go').onclick, drawO = draw, overOrig = over;

/* ---------- state ---------- */
let ON = null;            // { code, token, side }
let V = null;             // tampilan terakhir dari server
let pollTimer = null, statT = 0, failCount = 0, toastTimer = 0, clockOffset = 0;
let playing = false, overSent = false, overBusy = false, statBusy = false, resultShown = false;
let menuForm = { name: '', code: '' }, menuErr = '', hostBuilt = false, lastGameNo = -1;

function toast(msg) { const t = $$('olt'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.style.display = 'none'; }, 4200); }
const getName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } };
const saveName = n => { try { localStorage.setItem(NAME_KEY, n); } catch (e) { } };
const saveSession = () => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(ON)); } catch (e) { } };
const loadSession = () => { try { const o = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); return o && o.code && o.token ? o : null; } catch (e) { return null; } };
const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch (e) { } };
const gesture = () => { try { A(); } catch (e) { } try { goFull(); } catch (e) { } try { wake(); } catch (e) { } };

async function call(action, extra) {
  const body = Object.assign({ action }, ON ? { code: ON.code, token: ON.token } : {}, extra || {});
  let r, j;
  try {
    r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    j = await r.json();
  } catch (e) { throw Object.assign(new Error('Tidak bisa terhubung ke server. Periksa koneksi internetmu.'), { status: 0 }); }
  if (!j.ok) throw Object.assign(new Error(j.error || 'Terjadi kesalahan.'), { status: r.status });
  return j;
}
function handleErr(e) {
  if (e.status === 401 || e.status === 404) return sessionLost(e.message);
  toast(e.message || 'Terjadi kesalahan.');
}
function sessionLost(msg) {
  stopPolling(); stopStats(); clearSession(); ON = null; V = null;
  if (playing) { location.reload(); return; }
  menuErr = msg || ''; render();
}

/* ---------- polling ---------- */
function stopPolling() { if (pollTimer) clearTimeout(pollTimer); pollTimer = null; }
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
    if (!(playing && V && V.side === 'player' && V.status === 'playing' && !overSent)) await pollOnce();
    if (ON) pollTimer = setTimeout(loop, pollDelay());
  };
  pollTimer = setTimeout(loop, 600);
}
async function pollOnce() {
  if (!ON) return;
  try {
    const r = await fetch(API + '?' + new URLSearchParams({ code: ON.code, token: ON.token, v: V ? V.v : 0 }), { cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) { if (r.status === 404 || r.status === 401) return sessionLost(j.error); throw new Error(j.error); }
    failCount = 0;
    if (j.unchanged) {
      clockOffset = j.serverNow - Date.now();
      if (V && j.online && JSON.stringify(V.__on) !== JSON.stringify(j.online)) { V.__on = j.online; V.players.forEach(p => { p.online = !!j.online[p.id]; }); V.masterOnline = !!j.online.m; render(); }
      return;
    }
    applyView(j.view);
  } catch (e) { if (++failCount === 3) toast('Koneksi tidak stabil… mencoba menyambung kembali'); }
}
function applyView(v) {
  const prev = V; V = v; clockOffset = v.serverNow - Date.now();
  if (v.status === 'abandoned') { const m = v.leftBy === 'master' ? 'Room Master menutup ruangan.' : 'Ruangan ditutup.'; if (!(playing && prev && prev.status === 'finished')) { sessionLost(m); return; } }
  // kembali ke lobi (Main Lagi) setelah bermain: muat ulang agar game bersih
  if (playing && v.status === 'lobby') { location.reload(); return; }
  if (v.side === 'player' && v.status === 'playing' && !playing && v.seed != null) startPlayer(v.seed);
  if (v.side === 'player' && playing && v.status === 'finished') {
    stopStats();
    if (S && S.run) { over(false); $('ot').textContent = 'Permainan dihentikan'; }   // dihentikan Room Master
    resultShown = true;
  }
  if (v.side === 'master') feedSnaps(v);
  render();
}

/* ---------- layar ---------- */
function showOnly(which) {   // 'menu' | 'room' | 'host' | 'game'
  $$('lob').hidden = which === 'game' || which === 'host';
  $$('host').hidden = which !== 'host';
  $$('l1').hidden = which !== 'menu';
  $$('l2').hidden = which !== 'room';
}
function render() {
  if (!V) return showMenu();
  if (V.side === 'master') return renderHost();
  if (V.status === 'playing' && playing && !resultShown) return showOnly('game');
  return renderRoom();
}

/* ----- menu ----- */
function showMenu() {
  showOnly('menu');
  if (!menuForm.name) menuForm.name = getName();
  $$('nm').value = menuForm.name; $$('cd').value = menuForm.code; $$('lerr').textContent = menuErr; menuErr = '';
  ['cp', 'cm', 'jn'].forEach(i => { $$(i).disabled = false; });
}
const keep = () => { menuForm.name = $$('nm').value; menuForm.code = $$('cd').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); };
const nameOk = () => { keep(); if (!menuForm.name.trim()) { $$('lerr').textContent = 'Isi nama dulu.'; return false; } saveName(menuForm.name.trim()); return true; };
$$('nm').oninput = $$('cd').oninput = () => { keep(); $$('cd').value = menuForm.code; };
$$('jsolo').onclick = () => { $$('lob').hidden = true; $$('ov').hidden = false; };
const create = async role => {
  if (!nameOk()) return; if (role === 'master') mute = true; else A();
  try { enter(await call('create', { name: menuForm.name.trim(), role })); } catch (e) { $$('lerr').textContent = e.message; }
};
$$('cp').onclick = () => create('player');
$$('cm').onclick = () => create('master');
$$('jn').onclick = async () => {
  if (!nameOk()) return; if (menuForm.code.length !== 5) { $$('lerr').textContent = 'Kode ruangan harus 5 karakter.'; return; }
  A();
  try { enter(await call('join', { code: menuForm.code, name: menuForm.name.trim() })); } catch (e) { $$('lerr').textContent = e.message; }
};
function enter(j) {
  ON = { code: j.code, token: j.token, side: j.side }; saveSession(); V = null; applyView(j.view); startPolling();
  try { history.replaceState(null, '', location.pathname); } catch (e) { }
}
async function leave() {
  try { await call('leave'); } catch (e) { }
  stopPolling(); stopStats(); clearSession(); location.reload();
}
$$('lv').onclick = $$('hlv').onclick = leave;

/* ----- ruang tunggu / papan skor (pemain) ----- */
function renderRoom() {
  showOnly('room');
  const v = V, me = v.players.find(p => p.id === v.myId), lobby = v.status === 'lobby', fin = v.status === 'finished';
  $$('cb').textContent = v.code;
  const ul = $$('ls'); ul.innerHTML = '';
  for (let i = 0; i < v.maxPlayers; i++) {
    const p = v.players[i], li = document.createElement('li');
    let st = '';
    if (p) st = p.left ? 'Keluar' : lobby ? (p.ready ? 'SIAP ✔' : 'Belum siap') : (p.done ? 'Selesai ✔' : 'Bermain…');
    if (p && !p.left && !p.online && !(v.status === 'finished')) st += ' · terputus';
    li.className = 'ls' + (p ? (lobby && p.ready ? ' rdy' : '') : ' emp') + (p && p.id === v.myId ? ' me' : '');
    li.innerHTML = '<b>Pemain ' + (i + 1) + '</b><span>' + (p ? esc(p.name) + (p.id === v.myId ? ' (kamu)' : '') : 'Kosong') + '</span><i>' + (p ? st : '&nbsp;') + '</i>';
    ul.appendChild(li);
  }
  const rd = $$('rd'); let msg;
  if (lobby) {
    if (v.isOwner) {
      rd.textContent = '▶ MULAI'; rd.disabled = !v.canStart;
      msg = v.players.length < v.minPlayers ? 'Butuh minimal ' + v.minPlayers + ' pemain. Bagikan kode atau tautan ke temanmu.' : (v.canStart ? 'Semua siap — tekan MULAI!' : 'Menunggu semua pemain siap.');
    } else {
      rd.textContent = me && me.ready ? 'Batal siap' : 'SIAP'; rd.disabled = !me;
      msg = 'Menunggu ' + (v.hasMaster && !v.masterLeft ? 'Room Master' : 'pemilik ruangan') + ' menekan Mulai.';
    }
    if (v.hasMaster) msg += ' 👑 Room Master: ' + v.masterName + (v.masterLeft ? ' (sudah keluar)' : '') + '.';
  } else if (fin) {
    if (v.isOwner) { rd.textContent = '↩ Main lagi'; rd.disabled = false; } else { rd.textContent = 'Menunggu pemilik ruangan…'; rd.disabled = true; }
    const r = v.ranking || [];
    msg = r[0] ? '🏆 Pemenang: ' + r[0].name + ' (' + r[0].score + ' poin)' + (r[1] && r[1].score === r[0].score && r[1].wave === r[0].wave ? ' — seri dengan ' + r[1].name : '') : '';
  } else {
    rd.textContent = 'Menunggu pemain lain…'; rd.disabled = true;
    msg = v.players.filter(p => p.done).length + '/' + v.players.length + ' pemain selesai.';
  }
  $$('lmsg').textContent = msg;
  const tb = $$('lrk');
  if (fin && v.ranking) {
    tb.hidden = false;
    tb.innerHTML = '<tr><th>#</th><th>Pemain</th><th>Skor</th><th>Gelombang</th><th>Hasil</th></tr>' + v.ranking.map((x, i) =>
      '<tr class="' + (x.name === v.myName ? 'me' : '') + '"><td>' + (['🥇', '🥈', '🥉'][i] || i + 1) + '</td><td class="n">' + esc(x.name) + '</td><td class="s">' + x.score +
      '</td><td>' + x.wave + '/' + core().MAXW + '</td><td>' + (x.win ? '🌻 Menang' : x.forfeit ? '🚪 Keluar' : '🧟 Kalah') + '</td></tr>').join('');
  } else tb.hidden = true;
}
const core = () => window.GameCore;
$$('rd').onclick = async () => {
  gesture();
  const v = V; if (!v) return;
  try {
    if (v.status === 'lobby' && v.isOwner) applyView((await call('start')).view);
    else if (v.status === 'lobby') { const me = v.players.find(p => p.id === v.myId); applyView((await call('ready', { ready: !(me && me.ready) })).view); }
    else if (v.status === 'finished' && v.isOwner) applyView((await call('again')).view);
  } catch (e) { handleErr(e); }
};
$$('cl').onclick = async () => {
  const link = location.origin + location.pathname + '?room=' + (V ? V.code : '');
  try { await navigator.clipboard.writeText(link); toast('Tautan disalin'); } catch (e) { prompt('Salin tautan ini:', link); }
};

/* ---------- sisi pemain: main & kirim statistik + cuplikan layar ---------- */
function startPlayer(seed) {
  if (playing) return;
  playing = true; overSent = false; overBusy = false; resultShown = false;
  window.NETSEED = seed | 0;                    // gelombang zombie sama untuk semua pemain
  $$('lob').hidden = true;
  goOrig();
  sendStats(); statT = setInterval(sendStats, 1000);
}
over = function (w) {
  overOrig(w);
  if (ON && ON.side === 'player' && playing && !overSent) {
    $$('o3').textContent = 'Menunggu pemain lain…'; $$('o3').hidden = false;
    $$('go').textContent = 'Lihat ruang tunggu';
    sendOver(w);
  }
};
$$('go').onclick = () => {
  if (ON && ON.side === 'player' && S && !S.run) { resultShown = true; render(); return; }
  goOrig();
};
function mk() {   // cuplikan keadaan game (dipakai Room Master untuk menggambar layar pemain)
  return {
    t: S.t, w: S.w, phase: S.phase, bt: S.bt, score: S.score, mowers: S.mowers, fz: S.fz, fe: S.fe, run: S.run,
    q: S.q.map(x => ({ lane: x.lane, n: x.n })),
    L: S.L.map(L => ({
      hm: L.hm, mx: L.mx,
      p: L.p.map(p => p ? { op: p.op, v: p.v, k: p.k, hp: p.hp, mh: p.mh, ph: p.ph, sh: p.sh } : null),
      z: L.z.map(z => ({ x: Math.round(z.x), n: z.n, type: z.type, eat: z.eat, st: z.st, ph: z.ph, v: z.v, fl: z.fl }))
    })),
    peas: S.peas.map(p => ({ r: p.r, x: Math.round(p.x), op: p.op, v: p.v })),
    dead: S.dead, fx: S.fx
  };
}
async function sendStats() {
  if (!ON || overSent || !playing || !S || statBusy) return;
  statBusy = true;
  try {
    const j = await call('stats', { stats: { score: S.score, wave: S.w, done: !S.run, win: false }, snap: mk() });
    failCount = 0;
    if (V && (j.status !== 'playing' || j.gameNo !== V.gameNo)) pollOnce();
  } catch (e) { if (e.status === 401 || e.status === 404) handleErr(e); }
  statBusy = false;
}
async function sendOver(win) {
  if (overBusy || overSent) return;
  overBusy = true; stopStats();
  const result = { score: S.score, wave: S.w, win: !!win };
  for (let i = 0; i < 20 && !overSent; i++) {
    try { const j = await call('over', { result }); overSent = true; applyView(j.view); }
    catch (e) {
      if (e.status === 409) { overSent = true; pollOnce(); break; }   // permainan sudah dihentikan / selesai
      if (e.status === 401 || e.status === 404) { handleErr(e); break; }
      await new Promise(r => setTimeout(r, 1500));
    }
  }
  overBusy = false;
}
function stopStats() { clearInterval(statT); statT = 0; }

/* ---------- Room Master: melihat layar semua pemain ---------- */
const HV = {}, HC = {}, HS = 0.7, HW = 700, HH = Math.round(H * HS), CAP = 1.5;
function buildHost() {
  const gr = $$('hg'); gr.innerHTML = '';
  for (let k = 0; k < 4; k++) {
    const d = document.createElement('div'); d.className = 'hc';
    d.innerHTML = '<div class="hb"><b></b><span></span></div><div class="hw"><canvas></canvas><div class="ho"></div></div>';
    const cvs = d.querySelector('canvas'); cvs.width = HW; cvs.height = HH;
    const cx = cvs.getContext('2d'); cx.fillStyle = '#0e130b'; cx.fillRect(0, 0, HW, HH);
    HC[k] = { lab: d.querySelector('b'), chip: d.querySelector('.hb span'), ov: d.querySelector('.ho'), cx };
    gr.appendChild(d);
  }
  hostBuilt = true;
}
function enterHostMode() {
  mute = true; Music.go(null); Music.vol();
  A = function () { return null; };
  draw = function () { };
  $$('app').hidden = true; $$('ov').hidden = true;
  buildHost();
  requestAnimationFrame(hostRender);
}
function clearHost() {
  for (let k = 0; k < 4; k++) {
    delete HV[k]; const c = HC[k]; if (!c) continue;
    c.cx.setTransform(1, 0, 0, 1, 0, 0); c.cx.fillStyle = '#0e130b'; c.cx.fillRect(0, 0, HW, HH);
  }
}
function feedSnaps(v) {
  if (v.gameNo !== lastGameNo) { lastGameNo = v.gameNo; clearHost(); }
  if (v.status !== 'playing') return;
  v.players.forEach((p, k) => {
    const s = p.stats; if (!s || !s.snap) return;
    const cur = HV[k]; if (cur && cur.t >= s.t) return;
    HV[k] = { snap: s.snap, t: s.t, at: performance.now(), pt: 0 };
  });
}
function setT(el, t) { if (el && el.textContent !== t) el.textContent = t; }
function renderHost() {
  showOnly('host');
  if (!hostBuilt) enterHostMode();
  const v = V, n = v.players.length, rd = v.players.filter(p => p.ready).length, b = $$('hgo');
  $$('hs').textContent = v.status === 'playing' ? 'Pertandingan berlangsung' : v.status === 'finished' ? 'Ronde selesai' : n + '/' + v.maxPlayers + ' pemain · ' + rd + ' siap';
  if (!$$('hu').firstChild || $$('hu').dataset.c !== v.code) {
    $$('hu').dataset.c = v.code;
    $$('hu').innerHTML = 'Kode ruangan: <b>' + esc(v.code) + '</b> · <button class="lbtn sm" id="hcl">🔗 Salin Tautan</button>';
    $$('hcl').onclick = $$('cl').onclick;
  }
  if (v.status === 'playing') { b.textContent = 'Hentikan'; b.disabled = false; b.className = 'lbtn red'; }
  else if (v.status === 'finished') { b.textContent = '↩ Main lagi'; b.disabled = false; b.className = 'lbtn'; }
  else { b.textContent = 'MULAI'; b.disabled = !v.canStart; b.className = 'lbtn'; }
  const show = v.status === 'finished' && v.ranking;
  $$('hr').hidden = !show;
  if (show) $$('hr').textContent = '🏆 Hasil ronde terakhir: ' + v.ranking.map((r, i) => (i + 1) + '. ' + r.name + ' (' + r.score + (r.win ? ', menang' : r.forfeit ? ', keluar' : ', gel. ' + r.wave) + ')').join('  ·  ');
  for (let k = 0; k < 4; k++) cellStatus(k);
}
function cellStatus(k) {
  const v = V, c = HC[k]; if (!v || !c) return;
  const p = v.players[k], h = HV[k];
  let chip = '', ov = '';
  if (!p) { chip = 'Kosong'; ov = 'Menunggu pemain…'; }
  else if (v.status === 'lobby') { chip = p.left ? 'Keluar' : p.online ? (p.ready ? 'SIAP ✔' : 'Belum siap') : 'Terputus'; ov = h ? '' : chip; }
  else if (v.status === 'finished') {
    const r = (v.ranking || []).find(x => x.name === p.name);
    chip = r ? 'Selesai · Skor ' + r.score + ' · Gel. ' + r.wave + (r.win ? ' · MENANG' : r.forfeit ? ' · keluar' : '') : 'Selesai'; ov = h ? '' : chip;
  } else {
    const s = p.stats;
    chip = p.left ? 'Keluar' : p.done ? 'Selesai' + (s ? ' · Skor ' + s.score + ' · Gel. ' + s.wave : '') : !p.online ? 'Terputus' : s ? 'Skor ' + s.score + ' · Gel. ' + s.wave + '/' + core().MAXW : 'Memulai…';
    ov = h ? '' : (p.done || p.left ? chip : 'Memulai…');
  }
  setT(c.lab, 'Pemain ' + (k + 1) + (p ? ' · ' + p.name : '')); setT(c.chip, chip); setT(c.ov, ov); c.ov.hidden = !ov;
}
$$('hgo').onclick = async () => {
  const v = V; if (!v) return;
  try {
    if (v.status === 'playing') { if (!confirm('Hentikan pertandingan untuk semua pemain?')) return; applyView((await call('stop')).view); }
    else if (v.status === 'finished') applyView((await call('again')).view);
    else applyView((await call('start')).view);
  } catch (e) { handleErr(e); }
};
let hlast = 0;
function hostRender(now) {
  if (now - hlast >= 60) {
    hlast = now;
    for (let k = 0; k < 4; k++) { const h = HV[k]; if (h) { try { paintHost(HC[k], h, now); } catch (e) { } } }
  }
  requestAnimationFrame(hostRender);
}
function paintHost(c, v, now) {
  const sn = v.snap;
  if (!sn.run && v.pt) return;
  v.pt = 1;
  const el = sn.fz || !sn.run ? 0 : Math.min(CAP, (now - v.at) / 1000);   // gerakan diperkirakan di antara dua cuplikan
  const view = el ? Object.assign({}, sn, {
    t: sn.t + el,
    peas: sn.peas.map(p => Object.assign({}, p, { x: p.x + 560 * el })),
    L: sn.L.map(L => Object.assign({}, L, {
      mx: L.mx >= 0 ? L.mx + 650 * el : L.mx,
      z: L.z.map(z => z.eat > 0 || z.st > 0 ? z : Object.assign({}, z, { x: z.x - z.v * el }))
    }))
  }) : sn;
  const sg = g, sS = S, sh = hover;
  g = c.cx; S = view; hover = null;
  try { g.setTransform(HS, 0, 0, HS, 0, 0); drawO(); info(); frost(); }
  finally { g = sg; S = sS; hover = sh; }
}

/* ---------- awal ---------- */
document.addEventListener('visibilitychange', () => { if (!document.hidden && ON) pollOnce(); });
(async function init() {
  const q = new URLSearchParams(location.search);
  const roomParam = (q.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  const saved = loadSession();
  if (roomParam && !(saved && saved.code === roomParam)) menuForm.code = roomParam;
  if (saved && (!roomParam || roomParam === saved.code)) {
    ON = saved;
    try {
      const r = await fetch(API + '?' + new URLSearchParams({ code: ON.code, token: ON.token, v: 0 }), { cache: 'no-store' });
      const j = await r.json();
      if (j.ok && j.view && j.view.status !== 'abandoned') {
        const v = j.view;
        // game berjalan & halaman dimuat ulang di tengah main: skor lokal hilang, jadi pemain dianggap gugur
        if (v.side === 'player' && v.status === 'playing' && !v.players.find(p => p.id === v.myId).done) {
          try { await call('leave'); } catch (e) { }
          clearSession(); ON = null; menuErr = 'Halaman dimuat ulang saat bermain, jadi kamu dianggap keluar dari ronde ini. Gabung lagi di ronde berikutnya.'; render(); return;
        }
        if (v.side === 'master') mute = true; else A();
        applyView(v); startPolling(); return;
      }
    } catch (e) { /* jatuh ke menu */ }
    clearSession(); ON = null; V = null;
  }
  render();
})();
})();
