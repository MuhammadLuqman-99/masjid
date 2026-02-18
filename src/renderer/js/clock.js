// Digital Clock Module
const Clock = (() => {
  const MALAY_PERIODS = {
    morning: 'Pagi',
    afternoon: 'Tengahari',
    evening: 'Petang',
    night: 'Malam',
  };

  let clockEl = null;
  let secondsEl = null;
  let periodEl = null;
  let intervalId = null;
  let format24h = true;

  function getPeriod(hours) {
    if (hours >= 5 && hours < 12) return MALAY_PERIODS.morning;
    if (hours >= 12 && hours < 15) return MALAY_PERIODS.afternoon;
    if (hours >= 15 && hours < 19) return MALAY_PERIODS.evening;
    return MALAY_PERIODS.night;
  }

  function update() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    if (format24h) {
      clockEl.textContent = `${String(hours).padStart(2, '0')} ${minutes}`;
      if (periodEl) periodEl.textContent = getPeriod(hours);
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}`;
      if (periodEl) periodEl.textContent = ampm;
    }

    // Update separate seconds element if it exists
    if (secondsEl) secondsEl.textContent = seconds;
  }

  function init(options = {}) {
    clockEl = document.getElementById('clockTime');
    secondsEl = document.getElementById('clockSeconds');
    periodEl = document.getElementById('clockPeriod');
    format24h = options.format24h !== undefined ? options.format24h : true;

    update();
    intervalId = setInterval(update, 1000);
  }

  function setFormat(is24h) {
    format24h = is24h;
  }

  function destroy() {
    if (intervalId) clearInterval(intervalId);
  }

  return { init, setFormat, destroy };
})();
