'use strict';
/* Tes /api/turn: node test/turn.test.js — fetch ke Metered dipalsukan, tanpa jaringan. */
const assert = require('assert');
const { getStore } = require('../lib/store.js');
const handler = require('../api/turn.js');

const call = async q => { let code, body; const res = { setHeader() { }, status(c) { code = c; return res; }, json(o) { body = o; } }; await handler({ query: q }, res); return { http: code, ...body }; };
(async () => {
  const store = getStore();
  await store.cmd(['SET', 'room:ABCDE', JSON.stringify({ master: { token: 'mt' }, players: [{ id: '0', token: 'p0' }] }), 'EX', 60]);
  let hits = 0, lastUrl = '';
  const metered = [{ urls: 'turn:a.relay.metered.ca:80', username: 'u', credential: 'c' }, { urls: 'turns:a.relay.metered.ca:443?transport=tcp', username: 'u', credential: 'c' }];
  globalThis.fetch = async u => { hits++; lastUrl = String(u); return { ok: true, json: async () => metered }; };

  // 1. belum dikonfigurasi -> STUN saja
  delete process.env.METERED_API_KEY; delete process.env.METERED_DOMAIN;
  let r = await call({ code: 'ABCDE', token: 'p0' });
  assert(r.ok && r.turn === false && r.iceServers.every(s => /^stun:/.test(s.urls)) && hits === 0);
  // 2. token / kode salah ditolak
  assert.strictEqual((await call({ code: 'ABCDE', token: 'x' })).http, 401);
  assert.strictEqual((await call({ code: 'ZZZZZ', token: 'p0' })).http, 401);
  assert.strictEqual((await call({})).http, 401);
  // 3. dikonfigurasi -> TURN Metered, pemain & master boleh, di-cache
  process.env.METERED_API_KEY = 'KEY123'; process.env.METERED_DOMAIN = 'kebunangka';
  r = await call({ code: 'abcde', token: 'mt' });
  assert(r.ok && r.turn === true && r.iceServers.some(s => /^turns?:/.test(s.urls)) && r.iceServers[0].urls.startsWith('stun:'));
  assert(lastUrl.startsWith('https://kebunangka.metered.live/api/v1/turn/credentials?') && lastUrl.includes('apiKey=KEY123'));
  await call({ code: 'ABCDE', token: 'p0' }); assert.strictEqual(hits, 1);
  console.log('  ✔ api/turn: 4 tes lolos'); process.exit(0);
})().catch(e => { console.error('  ✘', e); process.exit(1); });
