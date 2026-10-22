#!/usr/bin/env python3
"""Membuat public/render-worker.js dari kode gambar di public/index.html (supaya selalu sama dengan game).
Jalankan ulang setiap kali kode gambar di index.html diubah:  python3 tools/build-render-worker.py"""
import re, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(root, 'public/index.html'), encoding='utf-8').read()
tail = open(os.path.join(root, 'tools/render-worker.tail.js'), encoding='utf-8').read()
a = src.index('const $ = (id) => document.getElementById(id);')
e = src.index('function loop(t) {')
body = src[a:e]
# buang bagian audio & musik (tidak dipakai untuk menggambar)
i = body.index('/* ---------- Audio'); j = body.index('/* ---------- Latar statis')
body = body[:i] + body[j:]
shim = '''/* DIBUAT OTOMATIS oleh tools/build-render-worker.py — jangan edit tangan. */
"use strict";
const window = self;
const localStorage = { getItem() { return null; }, setItem() {} };
const __stub = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : __stub), set: () => true, apply: () => __stub, construct: () => __stub });
const document = { createElement: (t) => (t === "canvas" ? new OffscreenCanvas(1, 1) : __stub), getElementById: () => __stub, querySelector: () => __stub, querySelectorAll: () => [], addEventListener() {}, hidden: false };
'''
open(os.path.join(root, 'public/render-worker.js'), 'w', encoding='utf-8').write(shim + body + tail)
print('ok')
