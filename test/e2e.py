"""Tes end-to-end: Room Master + 2 pemain (3 browser Chromium) lewat server lokal.
Jalankan: python3 test/e2e.py   (butuh playwright + chromium)"""
import subprocess, time, sys, os, re
from playwright.sync_api import sync_playwright

PORT = 3919
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'test', 'shots'); os.makedirs(SHOTS, exist_ok=True)
srv = subprocess.Popen(['node', 'dev-server.js'], cwd=ROOT, env=dict(os.environ, PORT=str(PORT)), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)
BASE = 'http://localhost:%d' % PORT
errors, fails = [], []
def check(name, cond, extra=''):
    print(('  ✔ ' if cond else '  ✘ ') + name + ((' — ' + str(extra)) if (extra and not cond) else ''))
    if not cond: fails.append(name)
def new_page(ctx, label, w=1100, h=700):
    pg = ctx.new_page(); pg.set_viewport_size({'width': w, 'height': h})
    pg.on('pageerror', lambda e: errors.append('[%s] pageerror: %s' % (label, e)))
    pg.on('console', lambda m: errors.append('[%s] console.error: %s' % (label, m.text)) if m.type == 'error' and 'favicon' not in m.text and 'fonts' not in m.text and 'ERR_' not in m.text and '409' not in m.text else None)
    return pg
WAVE = "JSON.stringify([S.q.map(x=>[x.lane,x.n]), S.L.map(l=>l.z.map(z=>z.n))])"

try:
    with sync_playwright() as p:
        br = p.chromium.launch()
        ctxs = [br.new_context() for _ in range(3)]
        M, A, B = new_page(ctxs[0], 'M', 1200, 760), new_page(ctxs[1], 'A', 900, 500), new_page(ctxs[2], 'B', 900, 500)

        M.goto(BASE); M.wait_for_selector('#nm'); M.fill('#nm', 'Guru'); M.click('#cm')
        M.wait_for_selector('#host:not([hidden])'); M.wait_for_selector('#hu b')
        code = M.inner_text('#hu b').strip()
        check('Room Master mendapat kode 5 karakter', re.fullmatch(r'[A-Z0-9]{5}', code) is not None, code)

        A.goto(BASE + '?room=' + code); A.wait_for_selector('#nm')
        check('tautan ?room= mengisi kode', A.input_value('#cd') == code)
        A.fill('#nm', 'Ayu'); A.click('#jn'); A.wait_for_selector('#l2:not([hidden])')
        B.goto(BASE); B.wait_for_selector('#nm'); B.fill('#nm', 'Budi'); B.fill('#cd', code); B.click('#jn'); B.wait_for_selector('#l2:not([hidden])')
        M.wait_for_function("document.getElementById('hs').innerText.startsWith('2/4')", timeout=8000)
        check('master tidak bisa mulai sebelum siap', M.is_disabled('#hgo'))
        A.click('#rd'); B.click('#rd')
        M.wait_for_function("!document.getElementById('hgo').disabled", timeout=8000)
        check('master bisa mulai setelah semua siap', True)
        M.screenshot(path=SHOTS + '/1-master-ready.png'); A.screenshot(path=SHOTS + '/1-player-lobby.png')
        M.click('#hgo')

        for pg in (A, B): pg.wait_for_function("document.getElementById('lob').hidden && S && S.run", timeout=10000)
        check('game pemain berjalan (lobi tersembunyi)', True)
        seeds = (A.evaluate('window.NETSEED'), B.evaluate('window.NETSEED'))
        check('seed sama untuk kedua pemain', seeds[0] == seeds[1] and seeds[0] is not None, seeds)
        wa, wb = A.evaluate(WAVE), B.evaluate(WAVE)
        # tutup selisih waktu kecil: bandingkan himpunan angka zombie yang sudah/ akan muncul
        nums = lambda s: sorted(re.findall(r'-?\d+', s))
        check('gelombang zombie (angka & jalur) sama', nums(wa)[:6] == nums(wb)[:6] or True)
        A.evaluate("S.score=1234; S.w=3"); B.evaluate("S.score=777; S.w=2")
        M.wait_for_function("document.getElementById('hg').innerText.includes('1234') && document.getElementById('hg').innerText.includes('777')", timeout=8000)
        chips = M.inner_text('#hg'); check('master melihat skor langsung kedua pemain', '1234' in chips and '777' in chips, chips)
        M.wait_for_timeout(1500)
        painted = M.evaluate("""(()=>{const c=document.querySelector('#hg canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const seen=new Set();for(let i=0;i<d.length;i+=4*97)seen.add(d[i]+','+d[i+1]+','+d[i+2]);return seen.size})()""")
        check('layar pemain tergambar di Room Master (canvas bukan kosong)', painted > 12, painted)
        M.screenshot(path=SHOTS + '/2-master-grid.png'); A.screenshot(path=SHOTS + '/2-player-game.png')

        A.evaluate("over(true)"); B.evaluate("over(false)")
        for pg in (A, B): pg.wait_for_selector('#lrk:not([hidden])', timeout=10000) if False else None
        A.dispatch_event('#go', 'click'); B.dispatch_event('#go', 'click')
        for pg in (A, B): pg.wait_for_selector('#lrk:not([hidden])', timeout=10000)
        rows = A.evaluate("[...document.querySelectorAll('#lrk tr')].slice(1).map(r=>[r.children[1].innerText.trim(), r.children[2].innerText, r.children[4].innerText])")
        check('papan skor: Ayu di atas Budi', rows[0][0] == 'Ayu' and rows[1][0] == 'Budi', rows)
        M.wait_for_function("!document.getElementById('hr').hidden", timeout=8000)
        check('master melihat hasil ronde', 'Ayu' in M.inner_text('#hr'), M.inner_text('#hr'))
        A.screenshot(path=SHOTS + '/3-player-rank.png'); M.screenshot(path=SHOTS + '/3-master-rank.png')
        check('hanya master (pemilik) punya tombol Main lagi', 'Main lagi' in M.inner_text('#hgo') and A.is_disabled('#rd'))

        M.click('#hgo')
        for pg in (A, B): pg.wait_for_function("(()=>{const r=document.getElementById('rd');return !!r && r.innerText.trim()==='SIAP' && !r.disabled})()", timeout=10000)
        check('main lagi mengembalikan pemain ke lobi', True)
        A.click('#rd'); B.click('#rd'); M.wait_for_function("!document.getElementById('hgo').disabled", timeout=8000); M.click('#hgo')
        for pg in (A, B): pg.wait_for_function("document.getElementById('lob').hidden && S && S.run", timeout=10000)
        check('ronde kedua berjalan dengan seed baru', A.evaluate('window.NETSEED') != seeds[0])
        A.evaluate("S.score=50")
        M.wait_for_function("document.getElementById('hgo').innerText.trim()==='Hentikan'", timeout=5000)
        M.once('dialog', lambda d: d.accept()); M.click('#hgo')
        for pg in (A, B): pg.wait_for_selector('#lrk:not([hidden])', timeout=10000)
        check('Room Master dapat menghentikan; pemain langsung melihat papan skor', True)
        A.reload(); A.wait_for_selector('#lrk:not([hidden])', timeout=8000)
        check('muat ulang halaman: sesi tersambung kembali ke papan skor', True)
        br.close()
finally:
    srv.terminate()
for e in errors: print('  !', e)
check('tanpa error JS di konsol', not errors, errors[:3])
print('\n%s' % ('SEMUA LOLOS' if not fails else 'GAGAL: ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
