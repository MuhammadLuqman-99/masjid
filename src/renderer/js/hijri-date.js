// Hijri & Gregorian Date Module
const HijriDate = (() => {
  const HIJRI_MONTHS = [
    'Muharram', 'Safar', 'Rabiulawal', 'Rabiulakhir',
    'Jamadilawal', 'Jamadilakhir', 'Rejab', 'Syaaban',
    'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'
  ];

  const MALAY_MONTHS = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const MALAY_DAYS = [
    'Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'
  ];

  let hijriEl = null;
  let gregorianEl = null;
  let intervalId = null;

  // Simple Hijri date approximation (Umm al-Qura like)
  function gregorianToHijri(gDate) {
    const gYear = gDate.getFullYear();
    const gMonth = gDate.getMonth() + 1;
    const gDay = gDate.getDate();

    // Julian Day Number
    let jd;
    if (gMonth <= 2) {
      const y = gYear - 1;
      const m = gMonth + 12;
      jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + gDay - 1524.5;
    } else {
      jd = Math.floor(365.25 * (gYear + 4716)) + Math.floor(30.6001 * (gMonth + 1)) + gDay - 1524.5;
    }

    // Gregorian correction
    const a = Math.floor((gYear - (gMonth <= 2 ? 1 : 0)) / 100);
    jd = jd + 2 - a + Math.floor(a / 4);

    // Convert JD to Hijri
    const l = Math.floor(jd) - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const remaining = l - 10631 * n + 354;
    const j = Math.floor((10985 - remaining) / 5316) * Math.floor((50 * remaining) / 17719)
      + Math.floor(remaining / 5670) * Math.floor((43 * remaining) / 15238);
    const finalL = remaining - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
      - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;

    const hMonth = Math.floor((24 * finalL) / 709);
    const hDay = finalL - Math.floor((709 * hMonth) / 24);
    const hYear = 30 * n + j - 30;

    return { year: hYear, month: hMonth, day: hDay };
  }

  function update() {
    const now = new Date();

    // Gregorian date in Malay
    const dayName = MALAY_DAYS[now.getDay()];
    const day = now.getDate();
    const month = MALAY_MONTHS[now.getMonth()];
    const year = now.getFullYear();
    gregorianEl.textContent = `${dayName}, ${day} ${month} ${year}`;

    // Hijri date
    const hijri = gregorianToHijri(now);
    if (hijri.month >= 1 && hijri.month <= 12) {
      const hijriMonthName = HIJRI_MONTHS[hijri.month - 1];
      hijriEl.textContent = `${hijri.day} ${hijriMonthName} ${hijri.year}H`;
    }
  }

  function init() {
    hijriEl = document.getElementById('hijriDate');
    gregorianEl = document.getElementById('gregorianDate');
    update();
    // Update every minute
    intervalId = setInterval(update, 60000);
  }

  function setFromApi(hijriStr) {
    // If JAKIM API provides hijri date string, use it directly
    if (hijriStr && hijriEl) {
      hijriEl.textContent = hijriStr;
    }
  }

  function destroy() {
    if (intervalId) clearInterval(intervalId);
  }

  return { init, setFromApi, destroy };
})();
