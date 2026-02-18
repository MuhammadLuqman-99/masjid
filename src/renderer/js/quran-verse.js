// Quran Verse Display Module
const QuranVerse = (() => {
  let verses = [];
  let currentIndex = 0;
  let intervalId = null;
  let rotationInterval = 30000; // 30 seconds

  let arabicEl = null;
  let translationEl = null;
  let referenceEl = null;

  let apiRef = null;

  function init(interval, api) {
    arabicEl = document.getElementById('quranArabic');
    translationEl = document.getElementById('quranTranslation');
    referenceEl = document.getElementById('quranReference');
    apiRef = api;

    if (interval) rotationInterval = interval * 1000;

    loadVerses();
  }

  async function loadVerses() {
    try {
      const data = apiRef ? await apiRef.getQuranVerses() : await fetch('/api/quran-verses').then(r => r.json());
      if (data && data.length > 0) {
        verses = data;
        // Start with random verse
        currentIndex = Math.floor(Math.random() * verses.length);
        showVerse(currentIndex);
        startRotation();
      }
    } catch (err) {
      console.log('Failed to load Quran verses:', err);
    }
  }

  function showVerse(index) {
    if (verses.length === 0) return;
    currentIndex = index % verses.length;
    const verse = verses[currentIndex];

    // Fade out
    if (arabicEl) arabicEl.style.opacity = '0';
    if (translationEl) translationEl.style.opacity = '0';
    if (referenceEl) referenceEl.style.opacity = '0';

    setTimeout(() => {
      if (arabicEl) {
        arabicEl.textContent = verse.arabic;
        arabicEl.style.opacity = '1';
      }
      if (translationEl) {
        translationEl.textContent = verse.translation;
        translationEl.style.opacity = '1';
      }
      if (referenceEl) {
        referenceEl.textContent = `${verse.surah} : ${verse.ayah}`;
        referenceEl.style.opacity = '1';
      }
    }, 500);
  }

  function next() {
    showVerse(currentIndex + 1);
  }

  function startRotation() {
    stopRotation();
    intervalId = setInterval(next, rotationInterval);
  }

  function stopRotation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function destroy() {
    stopRotation();
  }

  return { init, destroy };
})();
