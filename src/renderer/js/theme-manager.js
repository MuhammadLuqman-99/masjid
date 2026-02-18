// Theme Manager Module
const ThemeManager = (() => {
  function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;

    if (theme.bgPrimary) {
      root.style.setProperty('--color-bg-primary', theme.bgPrimary);
      root.style.setProperty('--color-header-bg', hexToRgba(theme.bgPrimary, 0.95));
      root.style.setProperty('--color-footer-bg', hexToRgba(darkenHex(theme.bgPrimary, 20), 0.95));
      root.style.setProperty('--color-overlay', hexToRgba(theme.bgPrimary, 0.85));
    }

    if (theme.bgSecondary) {
      root.style.setProperty('--color-bg-secondary', theme.bgSecondary);
    }

    if (theme.accent) {
      root.style.setProperty('--color-accent', theme.accent);
      root.style.setProperty('--color-accent-glow', hexToRgba(theme.accent, 0.4));
      root.style.setProperty('--color-prayer-active', theme.accent);
    }

    if (theme.textPrimary) {
      root.style.setProperty('--color-text-primary', theme.textPrimary);
    }

    // Background image
    if (theme.backgroundImage) {
      document.body.style.backgroundImage = `url("${theme.backgroundImage.replace(/\\/g, '/')}")`;
      document.body.classList.add('has-bg-image');
    } else {
      document.body.style.backgroundImage = '';
      document.body.classList.remove('has-bg-image');
    }
  }

  function applyFontSize(size) {
    document.body.classList.remove('font-small', 'font-large', 'font-xlarge');
    if (size && size !== 'medium') {
      document.body.classList.add(`font-${size}`);
    }
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function darkenHex(hex, percent) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  return { applyTheme, applyFontSize };
})();
