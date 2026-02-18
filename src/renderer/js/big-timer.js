// Big Timer Overlay Module
// Shows fullscreen countdown:
// - Before prayer time: countdown to prayer (e.g. 10 minutes)
// - At prayer time: iqamah countdown (e.g. 12 minutes)
// Includes notification sounds via Web Audio API (works offline)
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
  let iqamahMinutes = 12;
  let currentPhase = null; // null, 'pre-prayer', 'iqamah'
  let currentPrayer = null;
  let iqamahTriggered = new Set(); // track which prayers already triggered iqamah today
  let lastDate = null;
  let audioCtx = null;
  let soundEnabled = true;

  // Initialize Web Audio API context
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Play a beep tone using Web Audio API (no external files needed)
  function playBeep(frequency, duration, volume) {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = volume || 0.3;

      // Fade out to avoid click
      gainNode.gain.setValueAtTime(volume || 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (duration || 0.3));

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + (duration || 0.3));
    } catch (e) {
      console.log('[BigTimer] Audio not available:', e.message);
    }
  }

  // Different sound patterns for different events
  function playPrePrayerAlert() {
    // 3 ascending tones - "attention, prayer is coming"
    playBeep(600, 0.2, 0.4);
    setTimeout(() => playBeep(800, 0.2, 0.4), 250);
    setTimeout(() => playBeep(1000, 0.4, 0.5), 500);
  }

  function playIqamahAlert() {
    // 3 descending tones then high - "prayer time has arrived"
    playBeep(1000, 0.2, 0.5);
    setTimeout(() => playBeep(800, 0.2, 0.5), 300);
    setTimeout(() => playBeep(600, 0.2, 0.5), 600);
    setTimeout(() => playBeep(1200, 0.6, 0.6), 900);
  }

  function playCountdownTick() {
    // Short tick for last 10 seconds
    playBeep(880, 0.1, 0.25);
  }

  function playFinalBeep() {
    // Long beep for the end
    playBeep(1047, 0.8, 0.6);
  }

  function init(settings) {
    overlayEl = document.getElementById('bigTimerOverlay');
    titleEl = document.getElementById('bigTimerTitle');
    countdownEl = document.getElementById('bigTimerCountdown');
    subtitleEl = document.getElementById('bigTimerSubtitle');

    if (settings) {
      warningMinutes = settings.warningMinutes || 10;
      iqamahMinutes = settings.iqamahMinutes || 12;
    }

    // Pre-initialize audio context on first user interaction
    document.addEventListener('click', () => getAudioContext(), { once: true });
    document.addEventListener('keydown', () => getAudioContext(), { once: true });

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

    // Reset iqamah triggers at midnight
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

      // Phase 1: Pre-prayer countdown (warningMinutes before prayer)
      if (nowSeconds >= preStartSeconds && nowSeconds < prayerSeconds) {
        const diff = prayerSeconds - nowSeconds;
        showPrePrayer(prayer, diff);
        showOverlay = true;
        break;
      }

      // Phase 2: Iqamah countdown (at prayer time, for iqamahMinutes)
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
      // Sound: alert when pre-prayer overlay first appears
      if (soundEnabled) playPrePrayerAlert();
    }

    titleEl.textContent = `Waktu ${PRAYER_LABELS[prayer]} Dalam`;
    countdownEl.textContent = formatCountdown(secondsLeft);

    // Warning pulse when under 60 seconds
    if (secondsLeft <= 60) {
      overlayEl.classList.add('warning');
    } else {
      overlayEl.classList.remove('warning');
    }

    // Countdown tick for last 10 seconds
    if (soundEnabled && secondsLeft <= 10 && secondsLeft > 0) {
      playCountdownTick();
    }
    // Final beep at 0
    if (soundEnabled && secondsLeft === 0) {
      playFinalBeep();
    }
  }

  function showIqamah(prayer, secondsLeft) {
    if (currentPhase !== 'iqamah' || currentPrayer !== prayer) {
      overlayEl.classList.add('active', 'iqamah-phase');
      overlayEl.classList.remove('warning');
      currentPhase = 'iqamah';
      currentPrayer = prayer;
      subtitleEl.textContent = 'Solat akan didirikan sebentar lagi';
      // Sound: alert when iqamah phase starts
      if (soundEnabled) playIqamahAlert();
    }

    titleEl.textContent = `Iqamah ${PRAYER_LABELS[prayer]}`;
    countdownEl.textContent = formatCountdown(secondsLeft);

    // Warning pulse when under 60 seconds
    if (secondsLeft <= 60) {
      overlayEl.classList.add('warning');
    } else {
      overlayEl.classList.remove('warning');
    }

    // Countdown tick for last 10 seconds
    if (soundEnabled && secondsLeft <= 10 && secondsLeft > 0) {
      playCountdownTick();
    }
    // Final beep at 0
    if (soundEnabled && secondsLeft === 0) {
      playFinalBeep();
    }
  }

  function hideOverlay() {
    overlayEl.classList.remove('active', 'iqamah-phase', 'warning');
    currentPhase = null;
    currentPrayer = null;
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
    // Pause real checker during test
    if (intervalId) clearInterval(intervalId);

    let testInterval = null;
    let phase = 'pre-prayer';
    let secondsLeft = 15;

    console.log('[BigTimer TEST] Starting demo - 15s pre-prayer then 15s iqamah (with sound)');

    testInterval = setInterval(() => {
      if (phase === 'pre-prayer') {
        showPrePrayer('zohor', secondsLeft);
        secondsLeft--;
        if (secondsLeft < 0) {
          phase = 'iqamah';
          secondsLeft = 15;
        }
      } else if (phase === 'iqamah') {
        showIqamah('zohor', secondsLeft);
        secondsLeft--;
        if (secondsLeft < 0) {
          hideOverlay();
          clearInterval(testInterval);
          // Resume real checker
          intervalId = setInterval(check, 1000);
          console.log('[BigTimer TEST] Demo complete');
        }
      }
    }, 1000);
  }

  function destroy() {
    if (intervalId) clearInterval(intervalId);
    hideOverlay();
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  }

  return { init, updateSettings, destroy, test, toggleSound };
})();
