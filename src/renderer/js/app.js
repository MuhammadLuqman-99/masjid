// Main App Orchestrator - Web Server Version
(async function () {
  'use strict';

  let settings = null;
  let refreshIntervalId = null;

  // ==================== API HELPER ====================
  const api = {
    async getSettings() {
      const res = await fetch('/api/settings');
      return res.json();
    },
    async saveSettings(data) {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    async getPrayerTimes(zone) {
      const params = zone ? `?zone=${zone}` : '';
      const res = await fetch(`/api/prayer-times${params}`);
      return res.json();
    },
    async getQuranVerses() {
      const res = await fetch('/api/quran-verses');
      return res.json();
    },
    toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    },
  };

  // ==================== INITIALIZATION ====================
  async function init() {
    try {
      // Load settings
      settings = await api.getSettings();

      // Apply theme
      ThemeManager.applyTheme(settings.theme);
      ThemeManager.applyFontSize(settings.fontSize);

      // Set mosque name
      const nameEl = document.getElementById('mosqueName');
      if (nameEl) nameEl.textContent = settings.mosqueName || 'Masjid Al-Hidayah';

      // Initialize modules
      const is24h = settings.clock?.format24h ?? false;
      Clock.init({ format24h: is24h });
      HijriDate.init();
      PrayerTimes.init();
      PrayerTimes.setFormat(is24h);
      BigTimer.init({
        warningMinutes: settings.bigTimer?.warningMinutes ?? 10,
        iqamahMinutes: settings.bigTimer?.iqamahMinutes ?? 12,
      });
      Announcements.init(settings.announcements, settings.announcementRotationInterval);
      Announcements.updateTicker(settings.announcements);
      QuranVerse.init(settings.quranRotationInterval, api);

      // Load prayer times
      await loadPrayerTimes();

      // Refresh prayer times every 5 minutes
      refreshIntervalId = setInterval(loadPrayerTimes, 5 * 60 * 1000);

      // Setup settings panel
      setupSettings();

      // Keyboard shortcuts
      setupKeyboardShortcuts();

    } catch (err) {
      console.error('App initialization error:', err);
    }
  }

  // ==================== PRAYER TIMES ====================
  async function loadPrayerTimes() {
    try {
      const result = await api.getPrayerTimes(settings?.zone);
      if (result.success && result.data) {
        PrayerTimes.updateDisplay(result.data);

        // Update source indicator
        const sourceEl = document.getElementById('sourceIndicator');
        if (sourceEl) {
          const sourceMap = { jakim: 'JAKIM e-Solat', cache: 'Cache', calculated: 'Kiraan (Offline)' };
          sourceEl.textContent = sourceMap[result.data.source] || '';
        }

        // Update Hijri date from API if available
        if (result.data.hijri) {
          HijriDate.setFromApi(result.data.hijri);
        }
      }
    } catch (err) {
      console.error('Failed to load prayer times:', err);
    }
  }

  // ==================== SETTINGS PANEL ====================
  function setupSettings() {
    const overlay = document.getElementById('settingsOverlay');
    const settingsBtn = document.getElementById('settingsBtn');

    settingsBtn.addEventListener('click', openSettings);
    document.getElementById('settClose').addEventListener('click', closeSettings);
    document.getElementById('settSave').addEventListener('click', saveSettings);

    // Fullscreen toggle
    document.getElementById('settFullscreen').addEventListener('click', () => {
      api.toggleFullscreen();
    });

    // Background image - use file input
    document.getElementById('settBgImage').addEventListener('click', () => {
      document.getElementById('bgImageInput').click();
    });

    // Handle file input change
    const bgInput = document.getElementById('bgImageInput');
    if (bgInput) {
      bgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            settings.theme.backgroundImage = evt.target.result;
            ThemeManager.applyTheme(settings.theme);
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Clear background
    document.getElementById('settBgImageClear').addEventListener('click', async () => {
      settings.theme.backgroundImage = null;
      ThemeManager.applyTheme(settings.theme);
      await api.saveSettings({ theme: settings.theme });
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSettings();
    });

    // Populate zone dropdown
    populateZoneDropdown();
  }

  async function populateZoneDropdown() {
    const select = document.getElementById('settZone');
    if (!select) return;

    try {
      const zones = await fetch('/api/zones').then((r) => r.json());
      select.innerHTML = '';

      // Group by state
      const grouped = {};
      zones.forEach((z) => {
        if (!grouped[z.state]) grouped[z.state] = [];
        grouped[z.state].push(z);
      });

      Object.keys(grouped).sort().forEach((state) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = state;
        grouped[state].forEach((z) => {
          const option = document.createElement('option');
          option.value = z.code;
          option.textContent = `${z.code} - ${z.label}`;
          if (z.code === settings?.zone) option.selected = true;
          optgroup.appendChild(option);
        });
        select.appendChild(optgroup);
      });
    } catch (err) {
      console.error('Failed to populate zones:', err);
    }
  }

  function openSettings() {
    const overlay = document.getElementById('settingsOverlay');
    overlay.classList.add('active');

    if (settings) {
      const el = (id) => document.getElementById(id);
      el('settMosqueName').value = settings.mosqueName || '';
      el('settZone').value = settings.zone || 'WLY01';
      el('settColorPrimary').value = settings.theme?.bgPrimary || '#3D0C11';
      el('settColorAccent').value = settings.theme?.accent || '#D4A843';
      el('settFontSize').value = settings.fontSize || 'medium';
      el('settWarningMinutes').value = String(settings.bigTimer?.warningMinutes ?? 10);
      el('settIqamahMinutes').value = String(settings.bigTimer?.iqamahMinutes ?? 12);
    }
  }

  function closeSettings() {
    document.getElementById('settingsOverlay').classList.remove('active');
  }

  async function saveSettings() {
    const el = (id) => document.getElementById(id);

    const newSettings = {
      mosqueName: el('settMosqueName').value || 'Masjid Al-Hidayah',
      zone: el('settZone').value,
      theme: {
        ...settings.theme,
        bgPrimary: el('settColorPrimary').value,
        bgSecondary: darkenColor(el('settColorPrimary').value, 15),
        accent: el('settColorAccent').value,
      },
      fontSize: el('settFontSize').value,
      bigTimer: {
        warningMinutes: parseInt(el('settWarningMinutes').value, 10) || 10,
        iqamahMinutes: parseInt(el('settIqamahMinutes').value, 10) || 12,
      },
    };

    try {
      await api.saveSettings(newSettings);
      settings = { ...settings, ...newSettings };

      ThemeManager.applyTheme(settings.theme);
      ThemeManager.applyFontSize(settings.fontSize);
      document.getElementById('mosqueName').textContent = settings.mosqueName;
      BigTimer.updateSettings(settings.bigTimer);

      await loadPrayerTimes();
      closeSettings();
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  function darkenColor(hex, percent) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, Math.max(0, Math.floor(r * (1 + percent / 100))));
    g = Math.min(255, Math.max(0, Math.floor(g * (1 + percent / 100))));
    b = Math.min(255, Math.max(0, Math.floor(b * (1 + percent / 100))));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // ==================== KEYBOARD SHORTCUTS ====================
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // F12 - Toggle settings
      if (e.key === 'F12') {
        e.preventDefault();
        const overlay = document.getElementById('settingsOverlay');
        if (overlay.classList.contains('active')) {
          closeSettings();
        } else {
          openSettings();
        }
      }

      // F11 - Toggle fullscreen (browser handles this natively)

      // Escape - Close settings
      if (e.key === 'Escape') {
        const overlay = document.getElementById('settingsOverlay');
        if (overlay.classList.contains('active')) {
          closeSettings();
        }
      }
    });
  }

  // ==================== START ====================
  document.addEventListener('DOMContentLoaded', init);
})();
