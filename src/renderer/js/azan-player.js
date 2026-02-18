// Azan Audio Player Module
// - 10 minutes before azan: beep beep warning
// - At azan time: play full azan audio (or long notification if no MP3)
const AzanPlayer = (() => {
  let azanAudio = null;
  let settings = { enabled: true, volume: 0.8, warningMinutes: 10 };
  let playedToday = new Set();   // tracks 'subuh', 'subuh-warn', etc.
  let lastCheckedDate = null;
  let intervalId = null;
  let audioCtx = null;

  const AZAN_PRAYERS = ['subuh', 'zohor', 'asar', 'maghrib', 'isyak'];

  function init(azanSettings) {
    if (azanSettings) {
      settings = { ...settings, ...azanSettings };
    }

    // Pre-load azan audio file (user can place azan.mp3 in src/audio/)
    azanAudio = new Audio();
    azanAudio.volume = settings.volume;
    azanAudio.src = '/audio/azan.mp3';
    azanAudio.preload = 'auto';

    // Check every second
    intervalId = setInterval(check, 1000);
  }

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function timeToMinutes(timeStr) {
    if (!timeStr || timeStr === '--:--') return -1;
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function check() {
    if (!settings.enabled) return;

    const now = new Date();
    const todayStr = now.toDateString();

    // Reset played flags at midnight
    if (lastCheckedDate && lastCheckedDate !== todayStr) {
      playedToday.clear();
    }
    lastCheckedDate = todayStr;

    const times = PrayerTimes.getTimes();
    if (!times) return;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    // Only check at second 0 to avoid multiple triggers
    if (currentSeconds !== 0) return;

    const warningMin = settings.warningMinutes || 10;

    for (const prayer of AZAN_PRAYERS) {
      const prayerTime = times[prayer];
      if (!prayerTime) continue;

      const prayerMinutes = timeToMinutes(prayerTime);
      if (prayerMinutes < 0) continue;

      // Check: 10 minutes BEFORE azan → beep beep warning
      const warnKey = `${prayer}-warn`;
      if (currentMinutes === prayerMinutes - warningMin && !playedToday.has(warnKey)) {
        playedToday.add(warnKey);
        playBeepBeep();
        console.log(`[Azan] Amaran ${warningMin} minit sebelum ${prayer}`);
        break;
      }

      // Check: exact azan time → play full azan
      if (currentMinutes === prayerMinutes && !playedToday.has(prayer)) {
        playedToday.add(prayer);
        playFullAzan(prayer);
        console.log(`[Azan] Waktu ${prayer} - memainkan azan`);
        break;
      }
    }
  }

  // ===== BEEP BEEP (warning before azan) =====
  function playBeepBeep() {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const vol = settings.volume * 0.4;

      // Beep 1
      playTone(ctx, 880, 0, 0.3, vol);
      // Silence gap
      // Beep 2
      playTone(ctx, 880, 0.5, 0.3, vol);
      // Beep 3
      playTone(ctx, 1100, 1.0, 0.4, vol);

    } catch (e) {
      console.log('Beep warning failed:', e.message);
    }
  }

  function playTone(ctx, freq, startOffset, duration, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime + startOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);

    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration);
  }

  // ===== FULL AZAN SOUND =====
  function playFullAzan(prayer) {
    // Try to play the MP3 file first
    azanAudio.volume = settings.volume;
    azanAudio.currentTime = 0;

    const playPromise = azanAudio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // MP3 not found or can't play → use generated azan melody
        console.log('[Azan] MP3 tidak dijumpai, menggunakan nada azan digital');
        playGeneratedAzan(prayer);
      });
    }
  }

  // Generated azan-like melody using Web Audio API (fallback if no MP3)
  function playGeneratedAzan(prayer) {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const vol = settings.volume * 0.35;
      const isSubuh = prayer === 'subuh';

      // Allahu Akbar melody pattern (simplified)
      const melody = [
        // Allahu Akbar (1st)
        { freq: 440, start: 0, dur: 0.8, vol: vol },
        { freq: 523, start: 0.9, dur: 0.6, vol: vol },
        { freq: 587, start: 1.6, dur: 1.0, vol: vol },
        { freq: 523, start: 2.7, dur: 0.8, vol: vol },
        // Allahu Akbar (2nd)
        { freq: 440, start: 4.0, dur: 0.8, vol: vol },
        { freq: 523, start: 4.9, dur: 0.6, vol: vol },
        { freq: 587, start: 5.6, dur: 1.0, vol: vol },
        { freq: 523, start: 6.7, dur: 0.8, vol: vol },
        // Ashhadu (rising)
        { freq: 392, start: 8.0, dur: 0.6, vol: vol },
        { freq: 440, start: 8.7, dur: 0.6, vol: vol },
        { freq: 523, start: 9.4, dur: 0.8, vol: vol },
        { freq: 587, start: 10.3, dur: 1.2, vol: vol },
        // Hayya (call)
        { freq: 659, start: 12.0, dur: 0.8, vol: vol },
        { freq: 587, start: 12.9, dur: 0.6, vol: vol },
        { freq: 523, start: 13.6, dur: 0.8, vol: vol },
        { freq: 440, start: 14.5, dur: 1.2, vol: vol },
        // Final Allahu Akbar
        { freq: 440, start: 16.0, dur: 0.8, vol: vol },
        { freq: 523, start: 16.9, dur: 0.6, vol: vol },
        { freq: 587, start: 17.6, dur: 1.5, vol: vol },
        // La ilaha illallah (ending)
        { freq: 523, start: 19.5, dur: 0.6, vol: vol },
        { freq: 440, start: 20.2, dur: 0.6, vol: vol },
        { freq: 392, start: 20.9, dur: 2.0, vol: vol },
      ];

      // Subuh has extra "As-solatu khairum minan naum"
      if (isSubuh) {
        melody.push(
          { freq: 587, start: 23.5, dur: 0.8, vol: vol },
          { freq: 523, start: 24.4, dur: 0.6, vol: vol },
          { freq: 440, start: 25.1, dur: 0.8, vol: vol },
          { freq: 392, start: 26.0, dur: 1.5, vol: vol }
        );
      }

      melody.forEach((note) => {
        playTone(ctx, note.freq, note.start, note.dur, note.vol);
      });

    } catch (e) {
      console.log('Generated azan failed:', e.message);
    }
  }

  function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    if (azanAudio) {
      azanAudio.volume = settings.volume;
    }
  }

  function stop() {
    if (azanAudio) {
      azanAudio.pause();
      azanAudio.currentTime = 0;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  }

  function destroy() {
    if (intervalId) clearInterval(intervalId);
    stop();
  }

  return { init, updateSettings, stop, destroy };
})();
