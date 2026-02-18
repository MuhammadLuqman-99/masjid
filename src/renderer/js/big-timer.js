// Big Timer Overlay Module
// Fasa 1: Pre-prayer countdown (10 minit) - bunyi 15s terakhir
// Fasa 2: Telah Masuk Waktu (15 saat) - bunyi penuh
// Fasa 3: Iqamah countdown (10 minit) - bunyi 15s terakhir
const BigTimer = (() => {
  const PRAYER_LABELS = {
    subuh: 'Subuh',
    zohor: 'Zohor',
    asar: 'Asar',
    maghrib: 'Maghrib',
    isyak: 'Isyak',
  };

  const AZAN_PRAYERS = ['subuh', 'zohor', 'asar', 'maghrib', 'isyak'];

  let overlayEl = null;
  let titleEl = null;
  let countdownEl = null;
  let subtitleEl = null;
  let intervalId = null;
  let warningMinutes = 10;
  let iqamahMinutes = 10;
  let waktuSeconds = 15; // tempoh popup "Telah Masuk Waktu"
  let currentPhase = null; // null, 'pre-prayer', 'waktu', 'iqamah'
  let currentPrayer = null;
  let lastDate = null;
  let soundEnabled = true;
  let beepAudio = null;
  let isPlaying = false;

  // Initialize MP3 audio element
  function initAudio() {
    if (!beepAudio) {
      beepAudio = new Audio('/audio/beep.mp3');
      beepAudio.loop = true;
      beepAudio.volume = 1.0;
      beepAudio.preload = 'auto';
    }
  }

  // Start playing beep sound
  function startBeep() {
    if (!soundEnabled || isPlaying) return;
    try {
      initAudio();
      beepAudio.currentTime = 0;
      beepAudio.play().catch(e => console.log('[BigTimer] Audio play blocked:', e.message));
      isPlaying = true;
    } catch (e) {
      console.log('[BigTimer] Audio not available:', e.message);
    }
  }

  // Stop playing beep sound
  function stopBeep() {
    if (beepAudio && isPlaying) {
      beepAudio.pause();
      beepAudio.currentTime = 0;
      isPlaying = false;
    }
  }

  function init(settings) {
    overlayEl = document.getElementById('bigTimerOverlay');
    titleEl = document.getElementById('bigTimerTitle');
    countdownEl = document.getElementById('bigTimerCountdown');
    subtitleEl = document.getElementById('bigTimerSubtitle');

    if (settings) {
      warningMinutes = settings.warningMinutes || 10;
      iqamahMinutes = settings.iqamahMinutes || 10;
    }

    // Pre-initialize audio on first user interaction
    document.addEventListener('click', () => initAudio(), { once: true });
    document.addEventListener('keydown', () => initAudio(), { once: true });

    intervalId = setInterval(check, 1000);
  }

  function timeToMinutes(timeStr) {
    if (!timeStr || timeStr === '--:--') return -1;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function check() {
    const times = PrayerTimes.getTimes();
    if (!times) return;

    const now = new Date();
    const todayStr = now.toDateString();

    if (lastDate && lastDate !== todayStr) lastDate = todayStr;
    lastDate = todayStr;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowSeconds = nowMinutes * 60 + now.getSeconds();

    let showOverlay = false;

    for (const prayer of AZAN_PRAYERS) {
      const prayerTime = times[prayer];
      if (!prayerTime) continue;

      const prayerMinutes = timeToMinutes(prayerTime);
      if (prayerMinutes < 0) continue;

      const prayerSeconds = prayerMinutes * 60;
      const preStartSeconds = (prayerMinutes - warningMinutes) * 60;
      const waktuEndSeconds = prayerSeconds + waktuSeconds;
      const iqamahEndSeconds = waktuEndSeconds + (iqamahMinutes * 60);

      // Fasa 1: Pre-prayer countdown (10 minit sebelum waktu)
      if (nowSeconds >= preStartSeconds && nowSeconds < prayerSeconds) {
        const diff = prayerSeconds - nowSeconds;
        showPrePrayer(prayer, diff);
        showOverlay = true;
        break;
      }

      // Fasa 2: Telah Masuk Waktu (15 saat tepat waktu solat)
      if (nowSeconds >= prayerSeconds && nowSeconds < waktuEndSeconds) {
        showWaktu(prayer);
        showOverlay = true;
        break;
      }

      // Fasa 3: Iqamah countdown (10 minit selepas waktu)
      if (nowSeconds >= waktuEndSeconds && nowSeconds < iqamahEndSeconds) {
        const diff = iqamahEndSeconds - nowSeconds;
        showIqamah(prayer, diff);
        showOverlay = true;
        break;
      }
    }

    if (!showOverlay && currentPhase !== null) {
      hideOverlay();
    }
  }

  // Fasa 1: Countdown sebelum waktu solat
  function showPrePrayer(prayer, secondsLeft) {
    if (currentPhase !== 'pre-prayer' || currentPrayer !== prayer) {
      overlayEl.classList.remove('waktu-phase', 'iqamah-phase', 'warning');
      overlayEl.classList.add('active');
      currentPhase = 'pre-prayer';
      currentPrayer = prayer;
      subtitleEl.textContent = 'Azan akan berkumandang sebentar lagi';
    }

    titleEl.textContent = `Waktu ${PRAYER_LABELS[prayer]} Dalam`;
    countdownEl.textContent = formatCountdown(secondsLeft);

    if (secondsLeft <= 60) {
      overlayEl.classList.add('warning');
    } else {
      overlayEl.classList.remove('warning');
    }

    // Tiada bunyi langsung semasa pre-prayer countdown
    stopBeep();
  }

  // Fasa 2: Popup "Telah Masuk Waktu" selama 15 saat dengan bunyi
  function showWaktu(prayer) {
    if (currentPhase !== 'waktu' || currentPrayer !== prayer) {
      overlayEl.classList.remove('iqamah-phase', 'warning');
      overlayEl.classList.add('active', 'waktu-phase');
      currentPhase = 'waktu';
      currentPrayer = prayer;
      titleEl.textContent = 'Telah Masuk Waktu';
      subtitleEl.textContent = 'Sila bersedia untuk mendirikan solat';
      startBeep(); // bunyi penuh 15 saat
    }

    // Tunjuk nama solat besar dalam countdown element
    countdownEl.textContent = PRAYER_LABELS[prayer].toUpperCase();
  }

  // Fasa 3: Iqamah countdown
  function showIqamah(prayer, secondsLeft) {
    if (currentPhase !== 'iqamah' || currentPrayer !== prayer) {
      overlayEl.classList.remove('waktu-phase', 'warning');
      overlayEl.classList.add('active', 'iqamah-phase');
      currentPhase = 'iqamah';
      currentPrayer = prayer;
      subtitleEl.textContent = 'Solat akan didirikan sebentar lagi';
      stopBeep();
    }

    titleEl.textContent = `Iqamah ${PRAYER_LABELS[prayer]}`;
    countdownEl.textContent = formatCountdown(secondsLeft);

    if (secondsLeft <= 60) {
      overlayEl.classList.add('warning');
    } else {
      overlayEl.classList.remove('warning');
    }

    // Tiada bunyi langsung semasa iqamah countdown
    stopBeep();
  }

  function hideOverlay() {
    overlayEl.classList.remove('active', 'waktu-phase', 'iqamah-phase', 'warning');
    currentPhase = null;
    currentPrayer = null;
    stopBeep();
  }

  function formatCountdown(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function updateSettings(settings) {
    if (settings.warningMinutes !== undefined) warningMinutes = settings.warningMinutes;
    if (settings.iqamahMinutes !== undefined) iqamahMinutes = settings.iqamahMinutes;
  }

  function toggleSound(enabled) {
    soundEnabled = enabled !== undefined ? enabled : !soundEnabled;
    return soundEnabled;
  }

  // Test: pre-prayer 5s → waktu 15s → iqamah 5s
  function test() {
    if (intervalId) clearInterval(intervalId);

    let phase = 'pre-prayer';
    let secondsLeft = 5;
    console.log('[BigTimer TEST] pre-prayer(5s) → waktu(15s) → iqamah(5s)');

    const testInterval = setInterval(() => {
      if (phase === 'pre-prayer') {
        showPrePrayer('zohor', secondsLeft);
        secondsLeft--;
        if (secondsLeft < 0) {
          stopBeep();
          phase = 'waktu';
          secondsLeft = 15;
        }
      } else if (phase === 'waktu') {
        showWaktu('zohor');
        secondsLeft--;
        if (secondsLeft < 0) {
          stopBeep();
          phase = 'iqamah';
          secondsLeft = 5;
        }
      } else if (phase === 'iqamah') {
        showIqamah('zohor', secondsLeft);
        secondsLeft--;
        if (secondsLeft < 0) {
          hideOverlay();
          clearInterval(testInterval);
          intervalId = setInterval(check, 1000);
          console.log('[BigTimer TEST] selesai');
        }
      }
    }, 1000);
  }

  function destroy() {
    if (intervalId) clearInterval(intervalId);
    hideOverlay();
    stopBeep();
  }

  return { init, updateSettings, destroy, test, toggleSound };
})();
