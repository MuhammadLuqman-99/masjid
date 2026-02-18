// Announcements Slider Module
const Announcements = (() => {
  let slides = [];
  let currentIndex = 0;
  let intervalId = null;
  let rotationInterval = 10000; // 10 seconds

  let slideEl = null;
  let textEl = null;
  let dotsEl = null;

  function init(announcements, interval) {
    slideEl = document.getElementById('announcementSlide');
    textEl = document.getElementById('announcementText');
    dotsEl = document.getElementById('announcementDots');

    if (interval) rotationInterval = interval * 1000;

    setSlides(announcements || []);
    startRotation();
  }

  function setSlides(announcements) {
    slides = announcements.filter((a) => a.enabled !== false);
    currentIndex = 0;
    renderDots();
    showSlide(0);
  }

  function renderDots() {
    if (!dotsEl) return;
    dotsEl.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `announcement-dot${i === 0 ? ' active' : ''}`;
      dotsEl.appendChild(dot);
    });
  }

  function showSlide(index) {
    if (slides.length === 0) {
      if (textEl) textEl.textContent = 'Selamat datang ke masjid kami';
      return;
    }

    currentIndex = index % slides.length;
    const slide = slides[currentIndex];

    // Animate out
    if (slideEl) {
      slideEl.classList.remove('slide-enter');
      slideEl.classList.add('slide-exit');
    }

    setTimeout(() => {
      if (slide.type === 'image' && slide.path) {
        if (textEl) textEl.innerHTML = `<img class="announcement-image" src="${slide.path}" alt="Announcement">`;
      } else if (slide.type === 'hadith') {
        if (textEl) textEl.innerHTML = `<div class="hadith-label">Hadis</div><div class="hadith-text">${slide.content || ''}</div>`;
      } else {
        if (textEl) textEl.textContent = slide.content || '';
      }

      // Animate in
      if (slideEl) {
        slideEl.classList.remove('slide-exit');
        slideEl.classList.add('slide-enter');
      }

      // Update dots
      if (dotsEl) {
        dotsEl.querySelectorAll('.announcement-dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === currentIndex);
        });
      }
    }, 300);
  }

  function next() {
    showSlide(currentIndex + 1);
  }

  function startRotation() {
    stopRotation();
    if (slides.length > 1) {
      intervalId = setInterval(next, rotationInterval);
    }
  }

  function stopRotation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function updateTicker(announcements) {
    const tickerEl = document.getElementById('tickerText');
    if (!tickerEl) return;

    const enabled = (announcements || []).filter((a) => a.enabled !== false && a.type === 'text');
    if (enabled.length > 0) {
      tickerEl.textContent = enabled.map((a) => a.content).join('  |  ');
    }
  }

  function destroy() {
    stopRotation();
  }

  return { init, setSlides, updateTicker, destroy };
})();
