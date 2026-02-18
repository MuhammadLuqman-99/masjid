// Prayer Times Display & Countdown Module
const PrayerTimes = (() => {
  const PRAYER_ORDER = ['subuh', 'syuruk', 'zohor', 'asar', 'maghrib', 'isyak'];
  const PRAYER_LABELS = {
    imsak: 'Imsak',
    subuh: 'Subuh',
    syuruk: 'Syuruk',
    zohor: 'Zohor',
    asar: 'Asar',
    maghrib: 'Maghrib',
    isyak: 'Isyak',
  };

  let currentTimes = null;
  let countdownIntervalId = null;
  let use12h = true;

  // Convert "HH:MM" (24h) to "h:MM AM/PM" (12h)
  function to12Hour(timeStr) {
    if (!timeStr || timeStr === '--:--') return timeStr;
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  function formatTime(timeStr) {
    return use12h ? to12Hour(timeStr) : timeStr;
  }

  function timeToMinutes(timeStr) {
    if (!timeStr || timeStr === '--:--') return -1;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function getCurrentMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function getNextPrayer() {
    if (!currentTimes) return null;
    const nowMinutes = getCurrentMinutes();

    for (const prayer of PRAYER_ORDER) {
      const prayerMinutes = timeToMinutes(currentTimes[prayer]);
      if (prayerMinutes > nowMinutes) {
        return { name: prayer, label: PRAYER_LABELS[prayer], minutes: prayerMinutes };
      }
    }

    // After Isyak, next is Subuh (tomorrow)
    return {
      name: 'subuh',
      label: PRAYER_LABELS.subuh,
      minutes: timeToMinutes(currentTimes.subuh) + 1440, // +24h
      tomorrow: true,
    };
  }

  function updateDisplay(times) {
    currentTimes = times;

    // Update each prayer time display
    const prayers = ['imsak', 'subuh', 'syuruk', 'zohor', 'asar', 'maghrib', 'isyak'];
    prayers.forEach((prayer) => {
      const el = document.getElementById(`time-${prayer}`);
      if (el && times[prayer]) {
        el.textContent = formatTime(times[prayer]);
      }
    });

    highlightNextPrayer();
  }

  function setFormat(is24h) {
    use12h = !is24h;
    // Re-render if we have times
    if (currentTimes) updateDisplay(currentTimes);
  }

  function highlightNextPrayer() {
    const next = getNextPrayer();
    if (!next) return;

    // Remove all highlights
    document.querySelectorAll('.prayer-row').forEach((row) => {
      row.classList.remove('next-prayer', 'prayer-active');
    });

    // Add highlight to next prayer
    const nextRow = document.querySelector(`.prayer-row[data-prayer="${next.name}"]`);
    if (nextRow) {
      nextRow.classList.add('next-prayer', 'prayer-active');
    }

    // Update countdown prayer name
    const nameEl = document.getElementById('countdownPrayerName');
    if (nameEl) {
      nameEl.textContent = `${next.label}${next.tomorrow ? ' (esok)' : ''}`;
    }
  }

  function updateCountdown() {
    const next = getNextPrayer();
    if (!next) return;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowSeconds = nowMinutes * 60 + now.getSeconds();

    let targetMinutes = next.minutes;
    let targetSeconds = targetMinutes * 60;

    let diff = targetSeconds - nowSeconds;
    if (diff < 0) diff += 86400; // wrap to next day

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    const timerEl = document.getElementById('countdownTimer');
    if (timerEl) {
      timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    highlightNextPrayer();
  }

  function init() {
    countdownIntervalId = setInterval(updateCountdown, 1000);
  }

  function getTimes() {
    return currentTimes;
  }

  function getNextPrayerInfo() {
    return getNextPrayer();
  }

  function destroy() {
    if (countdownIntervalId) clearInterval(countdownIntervalId);
  }

  return { init, updateDisplay, setFormat, getTimes, getNextPrayerInfo, destroy, timeToMinutes, getCurrentMinutes, PRAYER_ORDER };
})();
