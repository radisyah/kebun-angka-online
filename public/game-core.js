/* FloraBite Online: aturan bersama (dipakai SERVER untuk menyaring & menghitung papan skor, dan KLIEN untuk tampilan).
   Permainan berjalan di perangkat tiap pemain; server memegang seed gelombang, status ruangan, dan papan skor akhir. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GameCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
const MAXW = 10;             // jumlah gelombang (sama dengan MAXW di game)
const MAX_PLAYERS = 4;
const MIN_PLAYERS = 2;
const MAX_SCORE = 1000000;   // batas kewajaran
const MAX_SNAP = 30000;      // batas ukuran satu cuplikan layar (karakter JSON)

const int = (v, a, b, d) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : (d === undefined ? a : d); };

/* Statistik langsung (dikirim tiap ±1 detik) -> disaring supaya aman disimpan & ditampilkan. */
function cleanLive(s) {
  s = s || {};
  return { score: int(s.score, 0, MAX_SCORE), wave: int(s.wave, 1, MAXW, 1), done: !!s.done, win: !!s.win };
}
/* Cuplikan layar pemain untuk layar Room Master: hanya objek JSON berukuran wajar (kalau tidak, dibuang). */
function cleanSnap(snap) {
  if (!snap || typeof snap !== 'object' || Array.isArray(snap)) return null;
  let str; try { str = JSON.stringify(snap); } catch (e) { return null; }
  return str.length <= MAX_SNAP ? snap : null;
}
/* Hasil akhir satu pemain (dari over() di game). */
function cleanFinal(r, name) {
  r = r || {};
  return { name: name, score: int(r.score, 0, MAX_SCORE), wave: int(r.wave, 1, MAXW, 1), win: !!r.win };
}
/* Hasil dari statistik terakhir (pemain keluar / terputus / dihentikan Room Master). */
function finalFromLive(live, name) {
  live = cleanLive(live);
  return Object.assign(cleanFinal({ score: live.score, wave: live.wave, win: false }, name), { forfeit: true });
}
/* Urutan: skor tertinggi, lalu gelombang terjauh, lalu yang menang. */
function rank(finals) {
  return finals.slice().sort((a, b) => b.score - a.score || b.wave - a.wave || (b.win ? 1 : 0) - (a.win ? 1 : 0)).map((f, i) => Object.assign({}, f, { rank: i + 1 }));
}
return { MAXW, MAX_PLAYERS, MIN_PLAYERS, MAX_SCORE, MAX_SNAP, int, cleanLive, cleanSnap, cleanFinal, finalFromLive, rank };
});
