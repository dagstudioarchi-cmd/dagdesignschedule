# Kirim Tugas via WhatsApp + Saran PIC Otomatis — DAG Design Manager

Update ini mengganti ketergantungan pada notifikasi push (yang sering tidak konsisten,
terutama di iPhone) dengan cara yang lebih pasti: tombol kirim langsung ke WhatsApp,
plus saran pembagian tugas otomatis berdasarkan beban kerja tim.

## 1. Tombol "Kirim ke WA" per PIC (Rencana Kerja Harian)

- Tiap kartu PIC di halaman **Rencana Kerja Harian** sekarang punya tombol hijau
  **📱 Kirim ke WA**. Klik → membuka WhatsApp Web/App dengan pesan berisi daftar
  tugas PIC tersebut untuk tanggal yang sedang dilihat (belum selesai + ringkasan
  yang sudah selesai), siap dikirim.
- Nomor WA tiap PIC diatur lewat tombol **📇 Kontak WA Tim** di bagian atas halaman
  Rencana Kerja Harian. Format nomor: `62812xxxxxxxx` (kode negara 62, tanpa `+`
  atau spasi/strip). Kalau nomor belum diisi, tombol WA akan tampil abu-abu dan
  otomatis membuka form kontak saat diklik.
- Data kontak disimpan di key `dag-team-contacts` lewat mekanisme sinkron yang sama
  dengan data lain (Google Sheet webhook / localStorage) — tidak perlu setup
  tambahan.
- Notifikasi push server (butuh Netlify function) sudah dilepas total — tombol
  Kirim ke WA ini sekarang satu-satunya jalur notifikasi tugas.

## 2. Saran PIC otomatis berdasarkan beban kerja

- Di modal **"Tambah Item Kerja Manual"**, ada tombol **🤖 Sarankan** di sebelah
  field PIC. Klik → sistem menghitung beban kerja tiap anggota tim (jumlah tahapan
  Gantt aktif yang overlap hari ini + jumlah item kerja harian yang belum selesai)
  dan mengisi PIC dengan beban paling ringan secara otomatis.
- Level beban (Normal / Sedang / Tinggi) memakai skala yang sama dengan halaman
  **Beban Kerja Tim**. Kalau *semua* anggota tim sudah berstatus "Tinggi", muncul
  peringatan ⚠ di catatan saran dan juga sebagai banner merah di halaman Beban
  Kerja Tim serta Rencana Kerja Harian — mengingatkan untuk mengalihkan tugas ke
  anggota tim lain atau mempertimbangkan freelance.
- Ini berjalan sepenuhnya di sisi app (rule-based), **tidak butuh setup tambahan**.

## 3. Proyek "Selesai" disembunyikan dari daftar aktif

Di halaman **Perencanaan Proyek**, dropdown pemilihan proyek sekarang otomatis
menyembunyikan proyek berstatus **Selesai** supaya tidak bercampur dengan proyek
yang masih berjalan. Centang **"Tampilkan proyek selesai"** di sebelah dropdown
kalau sewaktu-waktu perlu membuka kembali proyek yang sudah selesai (misalnya
untuk cek riwayat tahapan). Data proyek selesai tidak dihapus — hanya
disembunyikan dari tampilan default.
