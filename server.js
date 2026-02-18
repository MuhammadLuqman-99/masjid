const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// Settings file path
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const CACHE_FILE = path.join(__dirname, 'prayer-cache.json');

// Default settings
const DEFAULT_SETTINGS = {
  zone: 'TRG01',
  mosqueName: 'Surau Desa Murni Batik Gong Kapas',
  mosqueAddress: 'Gong Kapas, Kuala Terengganu',
  theme: {
    bgPrimary: '#0D1B2A',
    bgSecondary: '#1B2838',
    accent: '#FF8C00',
    textPrimary: '#ffffff',
    backgroundImage: '',
  },
  fontSize: 'medium',
  clock: { format24h: false },
  azan: { enabled: false, volume: 0.8, warningMinutes: 10 },
  bigTimer: { warningMinutes: 10, iqamahMinutes: 10 },
  announcements: [
    { type: 'text', content: 'Selamat datang ke Surau Desa Murni Batik Gong Kapas. Semoga solat anda diterima Allah SWT.', enabled: true },
    { type: 'hadith', content: '"Sesungguhnya setiap amalan itu bergantung kepada niat, dan sesungguhnya setiap orang akan mendapat apa yang diniatkannya." — Hadis Riwayat Bukhari & Muslim', enabled: true },
    { type: 'hadith', content: '"Sesiapa yang beriman kepada Allah dan Hari Akhirat, hendaklah berkata baik atau diam." — Hadis Riwayat Bukhari & Muslim', enabled: true },
    { type: 'hadith', content: '"Tidak beriman seseorang kamu sehingga dia mengasihi saudaranya seperti dia mengasihi dirinya sendiri." — Hadis Riwayat Bukhari & Muslim', enabled: true },
    { type: 'hadith', content: '"Kebersihan itu sebahagian daripada iman." — Hadis Riwayat Muslim', enabled: true },
    { type: 'hadith', content: '"Senyumanmu di hadapan saudaramu adalah sedekah." — Hadis Riwayat Tirmizi', enabled: true },
    { type: 'hadith', content: '"Sebaik-baik manusia ialah yang paling bermanfaat bagi orang lain." — Hadis Riwayat Ahmad', enabled: true },
    { type: 'hadith', content: '"Barangsiapa yang menempuh jalan untuk menuntut ilmu, Allah akan memudahkan baginya jalan ke syurga." — Hadis Riwayat Muslim', enabled: true },
    { type: 'hadith', content: '"Mukmin yang kuat lebih baik dan lebih dicintai Allah daripada mukmin yang lemah, dan pada kedua-duanya ada kebaikan." — Hadis Riwayat Muslim', enabled: true },
    { type: 'hadith', content: '"Agama itu nasihat. Kami bertanya: Untuk siapa? Baginda menjawab: Untuk Allah, Kitab-Nya, Rasul-Nya, pemimpin umat Islam dan orang ramai." — Hadis Riwayat Muslim', enabled: true },
    { type: 'hadith', content: '"Malu itu sebahagian daripada iman." — Hadis Riwayat Bukhari & Muslim', enabled: true },
    { type: 'hadith', content: '"Tidaklah seseorang itu memakan makanan yang lebih baik daripada hasil usaha tangannya sendiri." — Hadis Riwayat Bukhari', enabled: true },
    { type: 'hadith', content: '"Sampaikan dariku walau satu ayat." — Hadis Riwayat Bukhari', enabled: true },
    { type: 'hadith', content: '"Bertakwalah kepada Allah di mana sahaja kamu berada. Iringilah kejahatan dengan kebaikan, nescaya ia akan menghapuskannya." — Hadis Riwayat Tirmizi', enabled: true },
    { type: 'hadith', content: '"Janganlah kamu saling hasad-menghasad, jangan saling membenci, dan jangan saling membelakangkan. Jadilah kamu hamba-hamba Allah yang bersaudara." — Hadis Riwayat Muslim', enabled: true },
    { type: 'hadith', content: '"Barangsiapa yang menutup aib saudaranya di dunia, nescaya Allah akan menutup aibnya di hari kiamat." — Hadis Riwayat Muslim', enabled: true },
    { type: 'hadith', content: '"Setiap kebaikan itu adalah sedekah." — Hadis Riwayat Bukhari & Muslim', enabled: true },
    { type: 'hadith', content: '"Jagalah solat lima waktu kamu, nescaya Allah akan menjaga kamu." — Hadis Riwayat Ahmad', enabled: true },
    { type: 'hadith', content: '"Doa itu adalah senjata orang mukmin, tiang agama, dan cahaya langit dan bumi." — Hadis Riwayat Hakim', enabled: true },
    { type: 'text', content: 'Jemaah diingatkan supaya mematikan telefon bimbit semasa solat.', enabled: true },
    { type: 'text', content: 'Sumbangan dan derma boleh disalurkan ke tabung surau. Semoga Allah membalas kebaikan anda.', enabled: true },
    { type: 'text', content: 'Jaga kebersihan surau. Kebersihan sebahagian daripada iman.', enabled: true },
  ],
  quranRotationInterval: 30,
  announcementRotationInterval: 10,
};

// Load settings
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load settings:', err.message);
  }
  return { ...DEFAULT_SETTINGS };
}

// Save settings
function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// Prayer time cache
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

function writeCache(zone, days) {
  const now = new Date();
  fs.writeFileSync(CACHE_FILE, JSON.stringify({
    zone,
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    fetchedAt: now.toISOString(),
    days,
  }, null, 2), 'utf-8');
}

// Normalize JAKIM API time
function normalizeTime(timeStr) {
  if (!timeStr) return '00:00';
  return timeStr.trim().substring(0, 5);
}

// Normalize JAKIM date
function normalizeDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Fetch from JAKIM API
async function fetchJakimPrayerTimes(zone) {
  const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/TakwimSolat&period=month&zone=${zone}`;
  const response = await fetch(url, { timeout: 15000 });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();

  if (data.status !== 'OK!' && data.status !== 'OK') {
    throw new Error(`JAKIM API: ${data.status}`);
  }

  if (!data.prayerTime || !Array.isArray(data.prayerTime)) {
    throw new Error('Invalid JAKIM response');
  }

  return data.prayerTime.map((day) => ({
    date: normalizeDate(day.date),
    hijri: day.hijri || '',
    imsak: normalizeTime(day.imsak),
    subuh: normalizeTime(day.fajr),
    syuruk: normalizeTime(day.syuruk),
    zohor: normalizeTime(day.dhuhr),
    asar: normalizeTime(day.asr),
    maghrib: normalizeTime(day.maghrib),
    isyak: normalizeTime(day.isha),
  }));
}

// Calculate with adhan.js (offline fallback)
function calculatePrayerTimes(zoneCode) {
  const adhan = require('adhan');
  const zones = require('./src/data/zones.json');
  const zone = zones.find((z) => z.code === zoneCode);
  if (!zone) throw new Error(`Unknown zone: ${zoneCode}`);

  const coordinates = new adhan.Coordinates(zone.lat, zone.lng);
  const params = adhan.CalculationMethod.Singapore();
  params.madhab = adhan.Madhab.Shafi;

  const d = new Date();
  const pt = new adhan.PrayerTimes(coordinates, d, params);

  const fmt = (date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  return {
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    hijri: '',
    imsak: fmt(new Date(pt.fajr.getTime() - 10 * 60000)),
    subuh: fmt(pt.fajr),
    syuruk: fmt(pt.sunrise),
    zohor: fmt(pt.dhuhr),
    asar: fmt(pt.asr),
    maghrib: fmt(pt.maghrib),
    isyak: fmt(pt.isha),
  };
}

// Get today's prayer times (3-tier: API -> cache -> calculate)
async function getPrayerTimesToday(zone) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Try JAKIM API
  try {
    const monthly = await fetchJakimPrayerTimes(zone);
    writeCache(zone, monthly);
    const today = monthly.find((d) => d.date === todayStr);
    if (today) return { ...today, source: 'jakim' };
  } catch (err) {
    console.log('JAKIM API unavailable:', err.message);
  }

  // Try cache
  const cache = readCache();
  if (cache && cache.zone === zone) {
    const today = cache.days.find((d) => d.date === todayStr);
    if (today) return { ...today, source: 'cache' };
  }

  // Calculate offline
  try {
    return { ...calculatePrayerTimes(zone), source: 'calculated' };
  } catch (err) {
    throw new Error(`All sources failed: ${err.message}`);
  }
}

// ==================== EXPRESS ROUTES ====================

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'src', 'renderer')));

// Serve audio files (user places azan.mp3 in src/audio/)
app.use('/audio', express.static(path.join(__dirname, 'src', 'audio')));

// API: Get prayer times
app.get('/api/prayer-times', async (req, res) => {
  const settings = loadSettings();
  const zone = req.query.zone || settings.zone;
  try {
    const times = await getPrayerTimesToday(zone);
    res.json({ success: true, data: times });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Get settings
app.get('/api/settings', (req, res) => {
  res.json(loadSettings());
});

// API: Save settings
app.post('/api/settings', (req, res) => {
  try {
    const current = loadSettings();
    const updated = { ...current, ...req.body };
    saveSettings(updated);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Get Quran verses
app.get('/api/quran-verses', (req, res) => {
  try {
    const verses = require('./src/data/quran-verses.json');
    res.json(verses);
  } catch {
    res.json([]);
  }
});

// API: Get zones
app.get('/api/zones', (req, res) => {
  try {
    const zones = require('./src/data/zones.json');
    res.json(zones);
  } catch {
    res.json([]);
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log('');
  console.log('  ==========================================');
  console.log('  Masjid Prayer Display - Server Running');
  console.log('  ==========================================');
  console.log(`  URL: http://localhost:${PORT}`);
  console.log('');
  console.log('  Buka URL di atas dalam pelayar web anda.');
  console.log('  (Open the URL above in your web browser.)');
  console.log('');
  console.log('  Untuk mod TV/Kiosk, tekan F11 dalam pelayar.');
  console.log('  (For TV/Kiosk mode, press F11 in the browser.)');
  console.log('  ==========================================');
  console.log('');

  // Auto-open in browser
  const url = `http://localhost:${PORT}`;
  if (process.platform === 'win32') {
    exec(`start "" "${url}"`);
  } else if (process.platform === 'darwin') {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
});
