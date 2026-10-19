'use strict';
/* Kredensial TURN dari Metered (https://www.metered.ca), diambil di SERVER supaya API key tidak bocor ke browser.
   Env Vercel:
     METERED_DOMAIN   mis. "kebunangka.metered.live"  (atau cukup nama aplikasinya: "kebunangka")
     METERED_API_KEY  API key dari Dashboard Metered → TURN Server → "Create API Key"
   Opsional: METERED_REGION (mis. "asia", "global") untuk memilih server terdekat.
   Hanya anggota ruangan yang sah (kode + token) yang boleh meminta kredensial, supaya kuota TURN tidak disedot orang luar. */
const { getStore } = require('../lib/store.js');

const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
let cache = null;   // { at, servers } — dipakai bersama antar request pada instance yang sama
const CACHE_MS = 5 * 60 * 1000;

function meteredHost() {
  let d = String(process.env.METERED_DOMAIN || process.env.METERED_APP_NAME || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!d) return '';
  if (!d.includes('.')) d += '.metered.live';
  return d;
}

async function fetchMetered() {
  const host = meteredHost(), key = process.env.METERED_API_KEY;
  if (!host || !key) return null;
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.servers;
  const qs = new URLSearchParams({ apiKey: key });
  if (process.env.METERED_REGION) qs.set('region', process.env.METERED_REGION);
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 4000);
  try {
    const r = await fetch('https://' + host + '/api/v1/turn/credentials?' + qs, { signal: ctl.signal });
    if (!r.ok) throw new Error('Metered ' + r.status);
    const arr = await r.json();
    if (!Array.isArray(arr) || !arr.length) throw new Error('Metered: daftar kosong');
    cache = { at: Date.now(), servers: arr };
    return arr;
  } finally { clearTimeout(to); }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const send = (s, o) => res.status(s).json(o);
  try {
    const q = req.query || {};
    const code = String(q.code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), token = String(q.token || '');
    if (code.length !== 5 || !token) return send(401, { ok: false, error: 'Sesi tidak valid.' });
    const raw = await getStore().cmd(['GET', 'room:' + code]);
    let room = null; try { room = raw ? JSON.parse(raw) : null; } catch (e) { /* abaikan */ }
    const member = room && ((room.master && room.master.token === token) || room.players.some(p => p.token === token));
    if (!member) return send(401, { ok: false, error: 'Sesi tidak valid.' });
    let servers = null, turn = false;
    try { servers = await fetchMetered(); turn = !!servers; } catch (e) { console.error('TURN gagal:', e.message); }
    // STUN publik tetap disertakan; bila Metered belum diisi/gagal, klien tetap jalan (hanya jaringan longgar yang tersambung)
    send(200, { ok: true, turn, iceServers: servers ? STUN.slice(0, 1).concat(servers) : STUN });
  } catch (e) {
    console.error(e);
    send(500, { ok: false, error: 'Terjadi kesalahan di server.' });
  }
};
