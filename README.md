# DAG Perencanaan

App jadwal desain DAG Studio — **standalone, tanpa hosting/Netlify**. Repo GitHub
ini adalah sumber & arsip kerja (source of truth), bukan situs yang di-deploy live.
Data tetap tersinkron ke Google Sheet / Apps Script yang sama seperti sebelumnya —
itu terpisah dari hosting dan tidak terpengaruh oleh perubahan ini.

## Struktur
```
dag-perencanaan.html      → aplikasi (buka file ini langsung di browser, atau host statis apapun)
dag-perencanaan-sw.js     → service worker (caching offline dasar, tanpa push)
assets/dag-theme.css      → tema monokrom + oranye (Futura / Century Gothic)
dag-icon-192.png / dag-icon-512.png → ikon PWA
package.json
README-WHATSAPP-AI.md     → tombol Kirim ke WA & saran PIC (rule-based)
```

## Cara pakai
1. Clone / download repo ini.
2. Buka `dag-perencanaan.html` langsung (double-click) atau host statis manapun
   yang Bro pakai — tidak butuh build step, environment variable, atau server
   apa pun.
3. Data proyek/tahapan/jadwal otomatis sinkron ke Google Sheet DAG Studio lewat
   Apps Script (URL sudah tertanam di kode; bisa diganti lewat menu Pengaturan
   Sinkronisasi kalau perlu Sheet lain).

## Yang sudah dilepas dari versi sebelumnya
- Semua fungsi Netlify (`netlify/functions/*`, `netlify.toml`) — termasuk
  notifikasi push terjadwal (job desk pagi 07:00 & reminder sore 17:30) dan
  saran PIC via Claude di server.
- Link "Beranda DAG Studio" ke hub `dagconst-promanagement.netlify.app` — app
  ini sekarang berdiri sendiri sepenuhnya, tidak terhubung ke hub manapun.
- Notifikasi push browser — diganti tombol **Kirim ke WA** (client-side, tanpa
  server) sebagai satu-satunya jalur notifikasi tugas. Lihat
  `README-WHATSAPP-AI.md`.
- Saran PIC otomatis tetap ada, sekarang murni rule-based (beban kerja
  paling ringan) tanpa panggilan ke server AI mana pun.

## Riwayat update (ringkas)
- **v4** — Approval owner per fase gambar, terhubung ke sistem approval klien
  terpisah (`approval-dagstudio.netlify.app` — layanan lain, tetap aktif,
  tidak terkait hosting app ini).
- **v5** — Proyek desain dipisah dari proyek konstruksi (`dag-projects-desain`).
- **v6** — Jadwal desain dipisah dari jadwal konstruksi (`dag-schedule-desain`),
  korelasi otomatis Jadwal ↔ Gantt, PIC tim desain dikunci (Geni, Risman, Rama).
- **v9** — Penyesuaian ke skema API baris (`?action=read&table=...`), tombol
  hapus tahapan dikembalikan.
- **v10 (rilis ini)** — Lepas total dari Netlify: semua serverless function,
  konfigurasi deploy, dan link hub dihapus. App berdiri sendiri, dikelola
  manual lewat GitHub sebagai repo/dokumentasi.
