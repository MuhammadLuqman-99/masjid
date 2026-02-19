# Paparan Waktu Solat - Surau Desa Murni Batik Gong Kapas

Sistem paparan waktu solat digital untuk TV/skrin besar. Dibangunkan khusus untuk **Surau Desa Murni Batik Gong Kapas**, Kuala Terengganu.

---

## Ciri-ciri

- **Waktu Solat Tepat** — Data dari JAKIM e-Solat API (zon TRG01)
- **3 Peringkat Backup** — API → Cache → Kira offline (adhan.js) — boleh guna tanpa internet
- **Jam Masa Nyata** — Jam besar dengan tarikh Masihi & Hijri
- **Paparan TV** — Rekabentuk horizontal, mudah dibaca dari jauh
- **Slide Hadith** — 18 hadith masyhur bergilir-gilir
- **Ayat Al-Quran** — Bergilir dengan terjemahan Melayu
- **Pemasa Besar (Big Timer)** — 3 fasa automatik:
  - 10 minit sebelum solat — countdown
  - Tepat waktu solat — popup **"Telah Masuk Waktu"** + bunyi (15 saat)
  - Iqamah — countdown 10 minit
- **Ticker Berjalan** — Teks peringatan di bawah skrin
- **Auto-start** — Sistem mula automatik bila PC dihidupkan

---

## Keperluan Sistem

- **PC / Mini PC / Laptop** dengan Windows
- **Node.js** v16 ke atas — [nodejs.org](https://nodejs.org)
- **Google Chrome** browser
- **Sambungan Internet** (untuk data JAKIM) — boleh guna offline jika tiada

> TV sahaja (tanpa PC) **tidak boleh** menjalankan sistem ini.

---

## Pemasangan

### Cara Mudah (PC Surau)

1. Klon atau download repo ini:
   ```
   git clone https://github.com/MuhammadLuqman-99/masjid.git
   ```

2. Masuk ke folder projek:
   ```
   cd masjid
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Jalankan sistem:
   ```
   start-masjid.bat
   ```

### Auto-start bila PC dihidupkan

Jalankan fail ini sekali sahaja:
```
setup-autostart.vbs
```

Sistem akan mula automatik setiap kali Windows dihidupkan.

---

## Cara Guna

### Mulakan sistem
Klik dua kali `start-masjid.bat` atau shortcut di Desktop.

Chrome akan buka dalam mod kiosk (skrin penuh automatik).

### Tetapan
Tekan `F12` atau klik ikon gear (⚙) untuk buka panel tetapan:
- Tukar nama surau
- Tukar zon waktu solat (JAKIM)
- Tukar warna tema
- Saiz fon
- Masa amaran & iqamah

### Test Big Timer
Buka browser console (`F12` → Console) dan taip:
```javascript
BigTimer.test()
```

---

## Urutan Big Timer

```
T - 10 minit   →  Popup countdown "Waktu Asar Dalam 10:00"
                    (tiada bunyi)
                    ↓
T - 0 saat     →  Popup "Telah Masuk Waktu ASAR"
                    Bunyi beep selama 15 saat  ✓
                    ↓
T + 15 saat    →  Popup countdown "Iqamah Asar 10:00"
                    (tiada bunyi)
                    ↓
T + 10 minit   →  Paparan biasa kembali
```

---

## Struktur Fail

```
masjid/
├── server.js                  # Server Express.js (port 3000)
├── start-masjid.bat           # Launcher utama
├── setup-autostart.vbs        # Setup auto-start Windows
├── setup-shortcut.vbs         # Buat shortcut Desktop
├── PASANG-DI-PC-SURAU.bat     # Installer satu-klik untuk PC baru
├── package.json
├── src/
│   ├── renderer/
│   │   ├── index.html         # Paparan utama
│   │   ├── css/
│   │   │   ├── theme.css      # Warna & saiz fon
│   │   │   ├── main.css       # Layout & komponen
│   │   │   └── animations.css # Animasi
│   │   ├── js/
│   │   │   ├── app.js         # Modul utama
│   │   │   ├── clock.js       # Jam & tarikh
│   │   │   ├── prayer-times.js # Waktu solat
│   │   │   ├── big-timer.js   # Pemasa besar & popup
│   │   │   ├── announcements.js # Slide hadith/teks
│   │   │   ├── quran-verse.js # Ayat Al-Quran
│   │   │   ├── hijri-date.js  # Tarikh Hijri
│   │   │   └── theme-manager.js # Pengurusan tema
│   │   └── images/
│   │       └── desa-murni-batik.jpg
│   ├── audio/
│   │   └── beep.mp3           # Bunyi pemasa
│   └── data/
│       ├── zones.json         # Zon JAKIM Malaysia
│       ├── quran-verses.json  # Ayat Al-Quran
│       └── default-announcements.json
└── README.md
```

---

## Zon Waktu Solat

Sistem menggunakan zon JAKIM. Default: **TRG01** (Kuala Terengganu).

Boleh tukar zon dalam tetapan (⚙) — semua zon Malaysia disokong.

---

## Sumber Data

| Data | Sumber |
|------|--------|
| Waktu Solat | [JAKIM e-Solat API](https://www.e-solat.gov.my) |
| Pengiraan Offline | [adhan.js](https://github.com/batoulapps/adhan-js) (CalculationMethod.Singapore) |
| Tarikh Hijri | Dikira dalam browser |

---

## Lesen

Projek ini dibangunkan untuk kegunaan Surau Desa Murni Batik Gong Kapas, Kuala Terengganu.
Bebas digunakan dan diubahsuai untuk keperluan masjid/surau lain.
