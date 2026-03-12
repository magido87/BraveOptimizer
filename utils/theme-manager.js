/**
 * Theme Manager - Handles theme switching and color management
 * Supports 5 predefined themes with smooth transitions
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'ocean';
    this.themes = CONFIG.themes;
    this.transitionDuration = 300;
    this.listeners = [];
  }

  /**
   * Initialize theme manager
   */
  async init() {
    // Load saved theme
    const savedTheme = await Storage.getTheme();
    if (savedTheme && this.themes[savedTheme]) {
      this.currentTheme = savedTheme;
    }

    // Apply theme
    this.applyTheme(this.currentTheme, false);

    console.log(`[ThemeManager] Initialized with theme: ${this.currentTheme}`);
  }

  /**
   * Get all available themes
   * @returns {Object}
   */
  getThemes() {
    return Object.entries(this.themes).map(([key, theme]) => ({
      id: key,
      name: theme.name,
      primary: theme.primary,
      accent: theme.accent
    }));
  }

  /**
   * Get current theme
   * @returns {string}
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get theme colors
   * @param {string} themeId
   * @returns {Object|null}
   */
  getThemeColors(themeId) {
    return this.themes[themeId] || null;
  }

  /**
   * Set and apply theme
   * @param {string} themeId
   * @param {boolean} animate
   */
  async setTheme(themeId, animate = true) {
    if (!this.themes[themeId]) {
      console.warn(`[ThemeManager] Unknown theme: ${themeId}`);
      return false;
    }

    if (themeId === this.currentTheme) {
      return true;
    }

    const previousTheme = this.currentTheme;
    this.currentTheme = themeId;

    // Apply with optional animation
    this.applyTheme(themeId, animate);

    // Save preference
    await Storage.saveTheme(themeId);

    // Notify listeners
    this.notifyListeners(themeId, previousTheme);

    console.log(`[ThemeManager] Theme changed: ${previousTheme} → ${themeId}`);
    return true;
  }

  /**
   * Apply theme to document
   * @param {string} themeId
   * @param {boolean} animate
   */
  applyTheme(themeId, animate = true) {
    const root = document.documentElement;
    const theme = this.themes[themeId];

    if (!theme) return;

    // Add transition class for smooth change
    if (animate) {
      root.classList.add('theme-transitioning');
    }

    // Set data attribute
    root.setAttribute('data-theme', themeId);

    // Also set CSS custom properties directly for immediate use
    Object.entries(theme).forEach(([key, value]) => {
      if (key !== 'name') {
        root.style.setProperty(`--theme-${key}`, value);
      }
    });

    // Remove transition class after animation
    if (animate) {
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, this.transitionDuration);
    }
  }

  /**
   * Cycle to next theme
   * @returns {string} New theme ID
   */
  async nextTheme() {
    const themeKeys = Object.keys(this.themes);
    const currentIndex = themeKeys.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    const nextTheme = themeKeys[nextIndex];

    await this.setTheme(nextTheme);
    return nextTheme;
  }

  /**
   * Cycle to previous theme
   * @returns {string} New theme ID
   */
  async previousTheme() {
    const themeKeys = Object.keys(this.themes);
    const currentIndex = themeKeys.indexOf(this.currentTheme);
    const prevIndex = (currentIndex - 1 + themeKeys.length) % themeKeys.length;
    const prevTheme = themeKeys[prevIndex];

    await this.setTheme(prevTheme);
    return prevTheme;
  }

  /**
   * Subscribe to theme changes
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notify listeners of theme change
   * @param {string} newTheme
   * @param {string} oldTheme
   */
  notifyListeners(newTheme, oldTheme) {
    this.listeners.forEach((callback) => {
      try {
        callback(newTheme, oldTheme, this.themes[newTheme]);
      } catch (error) {
        console.error('[ThemeManager] Listener error:', error);
      }
    });
  }

  /**
   * Generate CSS for current theme
   * @returns {string}
   */
  generateCSS() {
    const theme = this.themes[this.currentTheme];
    if (!theme) return '';

    return `
      :root {
        --primary: ${theme.primary};
        --secondary: ${theme.secondary};
        --accent: ${theme.accent};
        --background: ${theme.background};
        --text: ${theme.text};
        --border: ${theme.border};
      }
    `;
  }

  /**
   * Get contrasting text color for a background
   * @param {string} hexColor
   * @returns {string}
   */
  getContrastColor(hexColor) {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  /**
   * Create preview element for theme
   * @param {string} themeId
   * @returns {HTMLElement}
   */
  createPreview(themeId) {
    const theme = this.themes[themeId];
    if (!theme) return null;

    const preview = document.createElement('div');
    preview.className = 'theme-preview';
    preview.style.cssText = `
      width: 60px;
      height: 40px;
      border-radius: 8px;
      background: ${theme.background};
      border: 2px solid ${theme.border};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    `;

    const accent = document.createElement('div');
    accent.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: ${theme.accent};
    `;

    preview.appendChild(accent);
    preview.setAttribute('data-theme-id', themeId);
    preview.setAttribute('title', theme.name);

    return preview;
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.DOMOptimizerTheme = themeManager;
}
