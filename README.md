# DAG Perencanaan — Deploy Terpisah (Netlify)

Situs ini berdiri sendiri, terpisah dari hub DAG Build.

## Struktur
```
dag-perencanaan.html      → aplikasi (root "/" otomatis membuka file ini)
dag-perencanaan-sw.js     → service worker (PWA + push)
assets/dag-theme.css      → tema monokrom + oranye (Futura / Century Gothic)
netlify/functions/
  send-push.js            → dipanggil app saat "Kirim Laporan Sore" ditekan
  morning-digest.js       → TERJADWAL 07:00 WIB (Sen–Sab) — job desk pagi (butuh deploy via GitHub)
  evening-digest.js       → TERJADWAL 17:30 WIB — reminder laporan sore
  digest-test.js          → uji manual: /.netlify/functions/digest-test?which=pagi|sore
  suggest-pic.js          → saran PIC otomatis (AI)
  _lib/push.js
netlify.toml, package.json
```

## Deploy (sekali)
1. Netlify → **Add new site → Deploy manually** → drag seluruh isi folder ini (atau ZIP-nya). Beri nama situs, yang sudah dipakai: `dagstudiodesignschedule`.
2. **Site settings → Environment variables** — isi:
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` (nilai sama dengan situs DAG Build — lihat README-NOTIFIKASI di paket Build).
   - `DAG_APP_URL` = URL situs ini, contoh `https://dagstudiodesignschedule.netlify.app/` (dipakai notifikasi terjadwal untuk link).
   - `ANTHROPIC_API_KEY` bila fitur Saran PIC dipakai (lihat README-WHATSAPP-AI.md).
3. **Deploys → Trigger deploy** ulang setelah env var diisi.
4. Ganti link "DAG Perencanaan" di hub (`index.html` paket Build) bila nama situs berbeda dari `dagstudiodesignschedule.netlify.app`.

Data tetap tersinkron ke Google Sheet / Apps Script yang sama seperti sebelumnya — pemisahan ini hanya soal hosting.

## Update v4 — Approval owner per fase gambar
- Fase Gantt yang berstatus **Selesai** otomatis membuat permintaan approval kategori Perencanaan di `approval-dagstudio.netlify.app` (klien tanda tangan digital). Badge di Gantt & Tampilan Owner: "Menunggu Approval Owner ↗" (+ tombol Kirim WA) → "✓ Disetujui Owner" / "✗ Ditolak Owner — revisi" (fase otomatis kembali Berjalan). Status ditarik tiap 60 detik & saat app dibuka. Tanpa auto-setuju.

## Update v5 — Proyek desain terpisah dari konstruksi
- Key penyimpanan proyek desain: `dag-projects-desain` (migrasi otomatis dari `dag-projects` lama). Centang "Klien juga memakai jasa membangun" di form proyek → didaftarkan otomatis ke DAG Build (`dag-projects-konstruksi`).

## Update v6 — Jadwal desain terpisah & terkorelasi Gantt · PIC tim desain
- Jadwal Studio kini memakai key `dag-schedule-desain` (migrasi otomatis: hanya agenda yang lahir dari tahapan desain atau PIC-nya bukan tim lapangan). Agenda konstruksi (PIC Firman/Bob/Zaki atau dari tahapan Build) tidak lagi tampil di sini.
- Korelasi Jadwal ↔ Gantt: agenda "Asistensi/Presentasi Desain" dibuat otomatis untuk tahapan yang selesai ≤14 hari, dan **mengikuti tahapannya**: tanggal ikut target, judul ikut nama, status Selesai bila tahapan Selesai, hilang bila tahapan dihapus. Badge "⇄ Gantt" di tabel jadwal → langsung buka tahapannya.
- PIC tim desain dikunci: Geni Rafsanjani, Risman, Rama. Data lama ber-PIC Firman/Bob/Zaki otomatis dialihkan ke Geni Rafsanjani (bisa diedit).

## Update v7 — Perbaikan deploy gagal (Deploying: Failed)
- Fungsi terjadwal (`morning-digest.js`, `evening-digest.js`) dipindah ke `netlify/functions-terjadwal/` (tidak ikut di-deploy) karena Netlify menolak scheduled functions pada deploy drag & drop. Aktifkan lagi dengan memindahkan situs ke deploy via GitHub — lihat README di folder tersebut.

## Update v9 — Penyesuaian ke Skema Baris v3 + Tombol Hapus Tahapan
**Konteks:** app sudah dipindah ke API skema baris (`AKfycbxdn6qg…`, `?action=read&table=…`) menggantikan pola lama "semua ditumpuk di 1 sel". Adapter di `dag-perencanaan.html` sudah menangani sisi app, TAPI fungsi terjadwal & skrip VPS masih membaca webhook lama — itu diperbaiki di sini.

- `netlify/functions/_lib/push.js`: ditambah `rowsGet(apiUrl, table)` dan `pushSubsGet(apiUrl)` untuk membaca skema baris. `sheetGet` lama tetap ada (masih dipakai untuk `dag-daily-reports` yang belum dipetakan).
- `morning-digest.js` & `evening-digest.js`: `DAILY_ITEMS` dan `PUSH_SUBS` kini dibaca dari API baris. Tanpa ini, job desk pagi & reminder sore akan membaca data lama yang sudah tidak diisi app → selalu tampak kosong.
- Env var baru (opsional): `DAG_API_URL` — override URL API skema baris. Default sudah benar di kode.
- **Tombol Hapus Tahapan dikembalikan** (hilang karena repo ini dibuat dari versi sebelum v8): ikon ✏️/🗑 per baris Gantt + tombol di modal. Menghapus tahapan juga melepas dependensi tahap lain, menghapus agenda Jadwal Studio yang terikat, dan memperingatkan bila ada approval owner tersambung.
- Service worker cache dinaikkan ke `dag-perencanaan-v11`.

**Skrip VPS Hermes** (`jobdesk-pagi.py`, `laporan-sore-desain.py`) juga sudah disesuaikan ke API baris — ganti file lamanya di `/opt/hermes/dag-jobdesk/` dan `~/.hermes/scripts/`, lalu uji `--dry-run`.
