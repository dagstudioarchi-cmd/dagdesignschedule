# DAG Perencanaan — Deploy via GitHub (agar reminder terjadwal AKTIF)

Netlify hanya menjalankan *scheduled functions* (job desk pagi 07:00 & reminder sore 17:30 WIB)
untuk situs yang terhubung ke repo Git. Paket ini sudah menaruh keduanya di `netlify/functions/`.

## A. Buat repo & upload (sekali)
1. GitHub → **New repository** → nama `dag-perencanaan` (Private boleh) → Create.
2. **Add file → Upload files** → ekstrak ZIP ini, lalu drag SEMUA isi folder (bukan foldernya):
   `dag-perencanaan.html`, `dag-perencanaan-sw.js`, `manifest`/ikon, `assets/`, `netlify/`, `netlify.toml`, `package.json`, README.
   Pastikan `netlify/functions/morning-digest.js`, `evening-digest.js`, `send-push.js`, `suggest-pic.js`, `_lib/push.js`, `digest-test.js` ikut masuk.
3. Commit changes.

## B. Sambungkan situs Netlify yang sudah ada ke repo (tetap URL dagstudiodesignschedule.netlify.app)
1. Netlify → situs **dagstudiodesignschedule** → **Site configuration → Build & deploy → Continuous deployment → Link repository** (atau "Link site to Git").
2. Pilih GitHub → repo `dag-perencanaan` → branch `main`.
3. Build settings: Build command = (kosong) · Publish directory = `.` · Functions directory = `netlify/functions` (sudah di netlify.toml). Deploy.

## C. Environment variables (Site configuration → Environment variables)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT_EMAIL` — nilai SAMA dengan situs DAG Build (`dagconst-promanagement`).
- `DAG_APP_URL` = `https://dagstudiodesignschedule.netlify.app/`
- (opsional) `DAG_SYNC_URL` = URL /exec webhook Perencanaan (default sudah benar di kode).
- (opsional) `ANTHROPIC_API_KEY` = untuk fitur Saran PIC AI.
Setelah env var diisi → **Deploys → Trigger deploy → Deploy site**.

## D. Cek
- Netlify → **Functions**: `morning-digest` & `evening-digest` harus berlabel **Scheduled**.
- Uji kirim sekarang (tanpa menunggu jam 07:00): buka
  `https://dagstudiodesignschedule.netlify.app/.netlify/functions/digest-test?which=pagi`
  → HP tim yang sudah menekan "🔔 Aktifkan Notifikasi" harus berbunyi. (`?which=sore` untuk reminder sore.)

## E. Update berikutnya
Cukup upload ulang file yang berubah ke repo (Add file → Upload files → replace) → Netlify build otomatis.
Jangan lagi drag ZIP ke Netlify untuk situs ini (akan memutus sambungan Git).

Catatan: subscriber push disimpan di key `dag-push-subs` di sheet yang sama dengan DAG Build, jadi
satu kali "Aktifkan Notifikasi" di HP berlaku untuk pesan dari kedua app.
