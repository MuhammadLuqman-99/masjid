// Big Timer Overlay Module
// Shows fullscreen countdown:
// - Before prayer time: countdown to prayer (e.g. 10 minutes)
// - At prayer time: iqamah countdown (e.g. 10 minutes)
// Beep sound plays only in last 15 seconds of each phase
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
  let currentPhase = null; // null, 'pre-prayer', 'iqamah'
  let currentPrayer = null;
  let iqamahTriggered = new Set();
  let lastDate = null;
  let soundEnabled = true;
  let beepAudio = null;
  let isPlaying = false;

  // Initialize MP3 audio element
  function initAudio() {
    if (!beepAudio) {
      beepAudio = new Audio('/audio/beep.mp3');
      beepAudio.loop = true;
      beepAudio.volume = 0.8;
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

  // Increase volume for last 30 seconds
  function setBeepVolume(vol) {
    if (beepAudio) beepAudio.volume = vol;
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

    if (lastDate && lastDate !== todayStr) {
      iqamahTriggered.clear();
    }
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
      const iqamahEndSeconds = prayerSeconds + (iqamahMinutes * 60);

      // Phase 1: Pre-prayer countdown
      if (nowSeconds >= preStartSeconds && nowSeconds < prayerSeconds) {
        const diff = prayerSeconds - nowSeconds;
        showPrePrayer(prayer, diff);
        showOverlay = true;
        break;
      }

      // Phase 2: Iqamah countdown
      if (nowSeconds >= prayerSeconds && nowSeconds < iqamahEndSeconds) {
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

  function showPrePrayer(prayer, secondsLeft) {
    if (currentPhase !== 'pre-prayer' || currentPrayer !== prayer) {
      overlayEl.classList.add('active');
      overlayEl.classList.remove('iqamah-phase');
      currentPhase = 'pre-prayer';
      currentPrayer = prayer;
      subtitleEl.textContent = 'Azan akan berkumandang sebentar lagi';
    }

    titleEl.textContent = `Waktu ${PRAYER_LABELS[prayer]} Dalam`;
    countdownEl.textContent = formatCountdown(secondsLeft);

    // Warning pulse when under 60 seconds
    if (secondsLeft <= 60) {
      overlayEl.classList.add('warning');
    } else {
      overlayEl.classList.remove('warning');
    }

    // Bunyi hanya pada 15 saat terakhir
    if (secondsLeft <= 15 && secondsLeft > 0) {
      setBeepVolume(1.0);
      startBeep();
    } else {
      stopBeep();
    }
  }

  function showIqamah(prayer, secondsLeft) {
    if (currentPhase !== 'iqamah' || currentPrayer !== prayer) {
      overlayEl.classList.add('active', 'iqamah-phase');
      overlayEl.classList.remove('warning');
      currentPhase = 'iqamah';
      currentPrayer = prayer;
      subtitleEl.textContent = 'Solat akan didirikan sebentar lagi';
    }

    titleEl.textContent = `Iqamah ${PRAYER_LABELS[prayer]}`;
    countdownEl.textContent = formatCountdown(secondsLeft);

    if (secondsLeft <= 60) {
      overlayEl.classList.add('warning');
    } else {
      overlayEl.classList.remove('warning');
    }

    // Bunyi hanya pada 15 saat terakhir
    if (secondsLeft <= 15 && secondsLeft > 0) {
      setBeepVolume(1.0);
      startBeep();
    } else {
      stopBeep();
    }
  }

  function hideOverlay() {
    overlayEl.classList.remove('active', 'iqamah-phase', 'warning');
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
    console.log('[BigTimer] Sound:', soundEnabled ? 'ON' : 'OFF');
    return soundEnabled;
  }

  // Test mode: simulate pre-prayer (15s) then iqamah (15s)
  function test() {
    if (intervalId) clearInterval(intervalId);

    let testInterval = null;
    let phase = 'pre-prayer';
    let secondsLeft = 15;

    console.log('[BigTimer TEST] Starting demo - 15s pre-prayer then 15s iqamah (with MP3 beep)');

    testInterval = setInterval(() => {
      if (phase === 'pre-prayer') {
        showPrePrayer('zohor', secondsLeft);
        secondsLeft--;
        if (secondsLeft < 0) {
          stopBeep();
          phase = 'iqamah';
          secondsLeft = 15;
        }
      } else if (phase === 'iqamah') {
        showIqamah('zohor', secondsLeft);
        secondsLeft--;
        if (secondsLeft < 0) {
          hideOverlay();
          clearInterval(testInterval);
          intervalId = setInterval(check, 1000);
          console.log('[BigTimer TEST] Demo complete');
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
