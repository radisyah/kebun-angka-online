# Kebun Angka: Zombie Hitung — Online (2–4 pemain) untuk Vercel

Versi online *Kebun Angka*, dengan cara kerja yang sama seperti **angry-birds-online**:
kode ruangan 5 karakter, token sesi di `localStorage`, polling ke satu Vercel Function (`/api/room`), dan state di **Upstash Redis**.
Server LAN lama (`server.js` + SSE) tidak dipakai lagi karena Vercel tidak bisa menahan koneksi terbuka.

Semua pemain menghadapi **gelombang zombie yang sama** (seed dari server). Permainan berjalan di perangkat masing-masing;
skor tertinggi menang (seri dipecah dengan gelombang terjauh, lalu yang menang).

```
Browser P1..P4 ─┐                         ┌─ Upstash Redis (room, tanda hadir, statistik + cuplikan layar, kunci)
Room Master ────┼─ polling ─ /api/room ───┤
                └                         └─ public/game-core.js (penyaringan skor & papan peringkat, dipakai server & klien)
```

## Alur
- **Buat Ruangan** (pembuat = Pemain 1 & pemilik) atau **Jadi Room Master** (hanya memantau, tidak bermain). Teman bergabung dengan kode / *Salin Tautan* (`?room=KODE`).
- 2–4 pemain (dulu wajib tepat 4). Pemain menekan **SIAP**; pemilik (Room Master bila ada, kalau tidak Pemain 1) menekan **MULAI**.
- Saat bermain, tiap pemain mengirim skor & gelombang tiap ±1 detik, dan **layar gamenya dikirim sebagai video langsung 60 fps ke Room Master lewat WebRTC**
  (peer-to-peer; `canvas.captureStream(60)`, ±667×387, ≤2,5 Mbps, mempertahankan fps). Server hanya menukar sinyal SDP sekali per koneksi
  (aksi `sig`, ±2 perintah Redis), videonya tidak lewat Vercel/Redis. Lencana di tiap kotak (mis. "VIDEO 60 FPS") dan di header
  menunjukkan fps video yang benar-benar diterima & ditampilkan.
- **Cadangan otomatis:** bila WebRTC tidak tersambung (jaringan memblokir P2P), kotak itu kembali memakai cuplikan ±1 dtk + perkiraan gerakan
  (digambar 60 fps tapi data posisi hanya 1×/detik; lencana menampilkan "Cuplikan"). Pemain mencoba menawarkan ulang tiap 9 dtk (maks. 8×).
  Cuplikan berhenti dikirim selama video tersambung (hemat Redis). Untuk jaringan ketat (sekolah/seluler) tambahkan server TURN di `ICE.iceServers` (`public/online.js`).
Room Master bisa **Hentikan**.
- Semua selesai → papan skor. Pemilik menekan **Main lagi** (kembali ke lobi, seed baru).
- Pemain keluar / terputus > 45 dtk tanpa statistik / dihentikan Master → dihitung gugur dengan skor terakhir. Batas keras satu ronde 30 menit.
- Muat ulang halaman saat bermain = dianggap keluar dari ronde itu. Di lobi, papan skor, dan layar Room Master, sesi tersambung kembali otomatis.
- Tombol **Main Solo** tetap ada (tanpa server).

## Deploy ke Vercel
1. Taruh folder ini di repositori GitHub, lalu **Add New → Project** di Vercel (preset "Other", tanpa build command). Atau: `npm i -g vercel && vercel`.
2. Dashboard proyek → **Storage / Marketplace** → tambahkan **Upstash Redis** → hubungkan ke proyek. Otomatis terisi
   `KV_REST_API_URL` + `KV_REST_API_TOKEN` (atau `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`); keduanya didukung.
3. **Redeploy** (variabel baru hanya berlaku untuk deployment baru).
4. Buka URL proyek → buat ruangan → bagikan kode.

Bila Redis belum terhubung, API membalas: *"Database belum dikonfigurasi…"*.

## Lokal
```bash
node dev-server.js        # http://localhost:3000 (penyimpanan memori, hanya untuk pengembangan)
npm test                  # 17 tes API: lewat memori DAN lewat jalur Redis REST (server tiruan format Upstash)
python3 test/e2e.py       # 3 browser Chromium: Room Master + 2 pemain (pip install playwright && playwright install chromium)
```

## Catatan biaya & batasan
- Redis: tiap pemain yang bermain ±1 SET per detik (statistik + cuplikan ±4–10 KB); Room Master ±4 perintah per polling (1 dtk).
  Satu ronde 4 pemain ±10 menit ≈ 15.000–20.000 perintah (jatah gratis Upstash biasanya 10.000/hari → pertimbangkan paket berbayar
  bila sering main, atau perpanjang interval di `online.js`: `setInterval(sendStats, 1000)` dan `pollDelay()`).
- **Skor dihitung di perangkat pemain**, jadi tidak kebal kecurangan lewat konsol browser. Server hanya membatasi nilai ke rentang wajar.
  Cocok untuk kelas/teman, bukan turnamen berhadiah.
- Tab yang disembunyikan menghentikan game (browser menghentikan animasi) sehingga statistik berhenti → setelah 45 dtk pemain dianggap gugur.
- Tanpa akun/login: siapa pun yang tahu kode & ruangan belum penuh/berjalan bisa bergabung. Ruangan kedaluwarsa 6 jam setelah aktivitas terakhir.
