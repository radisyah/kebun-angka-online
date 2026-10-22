
/* ===== Cache gambar (hanya di worker): zombie & tanaman digambar sekali per variasi animasi lalu ditempel (drawImage) =====
   Gambar zombie hanya bergantung pada: jenis, fase langkah (w), kemiringan kepala, kedipan kaki, dan status makan -> bisa dikuantisasi.
   Tanaman hanya bergantung pada: operasi, angka, hentakan tembak (rc). Goyangan tanaman tetap dihitung langsung (hanya translate). */
const __SC = new Map(), __SC_MAX = 700;
function __sprite(key, bx, by, bw, bh, d, paint) {
  let s = __SC.get(key);
  if (s) { __SC.delete(key); __SC.set(key, s); return s; }
  const c = new OffscreenCanvas(Math.max(1, Math.ceil(bw * d)), Math.max(1, Math.ceil(bh * d))), x = c.getContext("2d");
  x.setTransform(d, 0, 0, d, -bx * d, -by * d);
  const sg = g, sS = S;
  g = x;
  try { paint(); } finally { g = sg; S = sS; }
  s = { c, d, bx, by };
  __SC.set(key, s);
  if (__SC.size > __SC_MAX) __SC.delete(__SC.keys().next().value);
  return s;
}
const __blit = (s) => g.drawImage(s.c, s.bx, s.by, s.c.width / s.d, s.c.height / s.d);
const __dens = () => { const m = g.getTransform(); return Math.max(0.3, Math.round(Math.hypot(m.a, m.b) / 0.15) * 0.15); };

const __zbody0 = zbody;
zbody = function (z) {
  if (z.eat > 0) return __zbody0(z); // sedang makan: animasi lebih rumit, gambar langsung
  const run = z.type === "pelari", d = __dens();
  const key = "z|" + z.type + "|" + Math.round(Math.sin(S.t * (run ? 7 : 4) + z.ph) * (run ? 5 : 3)) + "|" +
    Math.round(Math.sin(S.t * 3 + z.ph)) + "|" + (Math.floor(S.t * 6) % 2) + "|" + d.toFixed(2);
  __blit(__sprite(key, -44, -92, 116, 146, d, () => __zbody0(z)));
};

const __drawPlant0 = drawPlant;
drawPlant = function (cx, cy, pl, a, rc, big) {
  if (pl.k) return __drawPlant0(cx, cy, pl, a, rc, big); // kentang: gambar langsung
  const d = __dens(), rq = Math.round((rc || 0) * 4) / 4;
  const key = "p|" + pl.op + "|" + pl.v + "|" + rq + "|" + (big ? 1 : 0) + "|" + d.toFixed(2);
  const s = __sprite(key, -54, -54, 108, 126, d, () => {
    S = Object.assign({}, S, { t: 0 }); // goyangan (sin(S.t*3+ph)) dikeluarkan dari sprite
    __drawPlant0(0, 0, { op: pl.op, v: pl.v, ph: 0, sh: 0, k: 0 }, 1, rq, big);
  });
  g.save();
  g.globalAlpha = a;
  g.translate(cx, cy + Math.sin(S.t * 3 + pl.ph) * 2);
  __blit(s);
  g.restore();
};
