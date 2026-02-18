// Digital Clock Module
const Clock = (() => {
  const MALAY_PERIODS = {
    morning: 'Pagi',
    afternoon: 'Tengahari',
    evening: 'Petang',
    night: 'Malam',
  };

  let clockEl = null;
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
      clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    }

    periodEl.textContent = getPeriod(now.getHours());
  }

  function init(options = {}) {
    clockEl = document.getElementById('clockTime');
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
