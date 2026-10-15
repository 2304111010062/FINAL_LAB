# FINAL LAB SISMIK - Sistem Ujian Praktikum Cepat & Rekap Nilai

Aplikasi web full-stack modern yang dibangun menggunakan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **MongoDB Atlas**, dirancang khusus untuk memfasilitasi ujian praktikum Laboratorium Sistem Mikroprosesor yang digunakan secara bergantian dan berurutan oleh sekitar **160 mahasiswa**.

---

## 🌟 Fitur Utama

### 1. Halaman Utama: Alur Ujian Cepat Tanpa Login Terpisah
- **Input Cepat Mahasiswa:** Kolom isian NPM (auto-uppercase) dan dropdown Kelompok Praktikum (Kelompok 1 sampai 20).
- **Aktivasi Otomatis:** Tombol **Spin Wheel** hanya akan aktif setelah NPM dan Kelompok terisi valid.
- **Single-Page Rapid Reset:** Begitu nilai mahasiswa disimpan oleh Dosen/Asisten, layar otomatis tereset bersih dan siap untuk mahasiswa berikutnya tanpa perlu refresh halaman manual.

### 2. Spin Wheel & Truly Random Question Picker (Nomor 1 - 25)
- **Animasi Roda Putar Realistis:** Roda Canvas 25 sektor berputar dengan kurva deselerasi fisika (*quintic ease-out*), dilengkapi jarum penunjuk (*pointer indicator*).
- **Sound Effects Terintegrasi (Web Audio API):** Efek suara detak mekanik (*ticking sound*) saat jarum melintasi bilah roda, suara *win fanfare*, dan letusan konfeti (*confetti blast*). 100% tanpa file audio eksternal.
- **Truly Random & Fair Distribution:** Menggunakan generator acak kriptografis **CSPRNG** (`crypto.randomInt` / `crypto.getRandomValues`) untuk memastikan peluang nomor 1 s.d. 25 terdistribusi 100% adil dan seragam untuk seluruh 160 mahasiswa.
- **Pemuatan Soal Otomatis:** Saat roda berhenti pada nomor tertentu, teks soal langsung muncul secara dinamis di layar mahasiswa.

### 3. Halaman Admin & CRUD Soal dengan Rich Text Editor
- **Keamanan PIN Admin:** Dilindungi gerbang PIN 6-digit (Default: `123456`, dapat diubah via `ADMIN_PIN`).
- **Rich Text Editor:**
  - **Pilihan Jenis Font:** Mendukung font **Arial** (sans-serif) dan **Courier New** (monospace untuk kode instruksi mikroprosesor).
  - **Pemformatan Lengkap:** Bold, Italic, Underline, Strikethrough, Heading 2/3, Bullet List, Numbered List, Quote, Code Block.
  - **Perataan Teks (Alignment):** Rata Kiri (*Left*), Tengah (*Center*), Kanan (*Right*), dan Rata Kiri-Kanan (*Justify*).
  - **Dukungan Line Break / Paragraf:** Tombol `Enter` menghasilkan paragraf baru `<p>`, tombol `Shift + Enter` menghasilkan line-break `<br/>`.
  - **Penyimpanan Format HTML:** Soal disimpan dalam format HTML bersih ke MongoDB Atlas agar seluruh gaya teks, warna kode, dan tata letak konsisten saat dirender pada layar mahasiswa.
  - **Fitur Live Preview:** Mode pratinjau langsung untuk melihat persis bagaimana mahasiswa akan melihat soal tersebut.
  - **One-Click Seeding (25 Soal Standar):** Tombol otomatis untuk memuat 25 bank soal otentik seputar Sistem Mikroprosesor (GPIO, Timer/Counter, PWM, ADC/DAC, UART, I2C, SPI, Interrupt, Von Neumann vs Harvard, Assembly 8086, DMA, dll.).

### 4. Sistem Penilaian Cepat & Rekap Nilai (Persistent Log)
- **Input Nilai Langsung di Layar:** Dosen atau Asisten penguji langsung memasukkan skor (0 - 100) dan catatan evaluasi di bawah soal yang tampil.
- **Preset Skor Instan:** Tombol cepat (60, 70, 75, 80, 85, 90, 95, 100) untuk penilaian kilat.
- **Tombol "Simpan & Lanjut ke Mahasiswa Berikutnya":** Menyimpan data secara abadi (*persistent*) ke MongoDB Atlas, memutar audio sukses, lalu mereset layar untuk mahasiswa berikutnya.
- **Tabel Rekap Nilai:**
  - Menampilkan: **No**, **NPM**, **Kelompok**, **Nomor Soal hasil spin**, **Skor/Nilai (badge warna)**, **Penilai**, **Catatan**, dan **Waktu Ujian (WIB)**.
  - **Kartu Metrik & Statistik:** Progres Mahasiswa Dinilai (menuju 160), Rata-rata Nilai, Nilai Tertinggi, dan Nilai Terendah.
  - **Pencarian & Filter:** Cari berdasarkan NPM dan filter per kelompok.
  - **Ekspor Excel / CSV:** Unduh seluruh rekap nilai ke format CSV siap pakai untuk Microsoft Excel / Google Sheets dengan satu klik (mendukung encoding UTF-8 BOM).

---

## 📁 Struktur Direktori

```
FINAL LAB SISMIK/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   └── verify/route.ts       # Verifikasi PIN admin
│   │   │   ├── questions/
│   │   │   │   ├── route.ts              # GET all questions / POST upsert
│   │   │   │   ├── [number]/route.ts     # GET / PUT spesifik nomor soal (1-25)
│   │   │   │   └── seed/route.ts         # Seeding 25 soal standar Lab Sismik
│   │   │   ├── submissions/
│   │   │   │   ├── route.ts              # GET rekap / POST simpan nilai / DELETE
│   │   │   │   └── export/route.ts       # Ekspor rekap nilai ke format CSV/Excel
│   │   │   └── spin/
│   │   │       └── route.ts              # CSPRNG truly random pick (1-25)
│   │   ├── admin/
│   │   │   └── page.tsx                  # Dashboard Admin & Rekap Nilai
│   │   ├── globals.css                   # Tailwind styling & Rich Text CSS
│   │   ├── layout.tsx                    # Root Layout
│   │   └── page.tsx                      # Single-page Ujian Mahasiswa
│   ├── components/
│   │   ├── AdminBankSoal.tsx             # Panel kelola 25 bank soal
│   │   ├── AdminRekapNilai.tsx           # Tabel rekap nilai & analytics
│   │   ├── GradingForm.tsx               # Formulir penilaian cepat dosen
│   │   ├── Header.tsx                    # Header navigasi & live clock WIB
│   │   ├── QuestionCard.tsx              # Komponen render soal HTML + font
│   │   ├── RichTextEditor.tsx            # Editor teks kaya (Arial / Courier New)
│   │   └── SpinWheel.tsx                 # Canvas Spin Wheel 25 irisan + audio
│   ├── lib/
│   │   ├── db.ts                         # Mongoose connection pooling & fallback
│   │   ├── mockData.ts                   # 25 Bank Soal standar Lab Sismik
│   │   └── sound.ts                      # Web Audio API synthesizer
│   └── models/
│       ├── Question.ts                   # Skema MongoDB Soal
│       └── Submission.ts                 # Skema MongoDB Rekap Nilai
├── .env.local                            # Konfigurasi variabel lingkungan
├── .env.local.example                    # Template konfigurasi
├── next.config.mjs                       # Konfigurasi Next.js
├── package.json                          # Daftar dependensi & skrip
├── postcss.config.mjs                    # PostCSS config
├── tailwind.config.ts                    # Konfigurasi Tailwind CSS
└── tsconfig.json                         # Konfigurasi TypeScript
```

---

## 🚀 Panduan Menjalankan Secara Lokal

### 1. Prasyarat
- Node.js versi 18+ atau 20+
- npm atau yarn

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Buka file `.env.local` dan sesuaikan nilainya:
```env
# URI Koneksi Cluster MongoDB Atlas Anda (bisa didapatkan gratis di cloud.mongodb.com)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lab_sismik?retryWrites=true&w=majority

# 6-Digit PIN Akses Halaman Admin / Rekap Nilai
ADMIN_PIN=123456
```
*(Catatan: Jika `MONGODB_URI` belum diisi, aplikasi secara cerdas beralih ke mode penyimpanan lokal sementara sehingga fitur tetap dapat diuji coba tanpa error).*

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000):
- **Halaman Ujian:** `http://localhost:3000/`
- **Dashboard Admin:** `http://localhost:3000/admin` (PIN default: `123456`)

---

## ☁️ Panduan Deploy ke Vercel

1. **Push ke GitHub / GitLab:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete final lab sismik rapid exam application"
   git branch -M main
   git remote add origin <url-repository-anda>
   git push -u origin main
   ```

2. **Import Project di Vercel Dashboard:**
   - Kunjungi [vercel.com](https://vercel.com) dan klik **Add New Project**.
   - Pilih repository GitHub proyek ini.
   - Framework Preset otomatis mendeteksi **Next.js**.

3. **Konfigurasi Environment Variables di Vercel:**
   Pada bagian **Environment Variables**, tambahkan:
   - `MONGODB_URI` : `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lab_sismik?retryWrites=true&w=majority`
   - `ADMIN_PIN` : `123456` (atau PIN pilihan Anda)

4. **Deploy:**
   - Klik **Deploy**. Vercel akan otomatis melakukan proses *build* dan aplikasi langsung aktif secara *serverless*.
