/**
 * Options Page Script
 * Handles settings management and UI
 */

class OptionsController {
  constructor() {
    this.settings = null;
    this.saveTimeout = null;
  }

  /**
   * Initialize options page
   */
  async init() {
    console.log('[Options] Initializing...');

    try {
      // Load settings
      this.settings = await Storage.getSettings();

      // Apply theme
      this.applyTheme(this.settings.theme);

      // Populate UI
      this.populateSettings();

      // Set up event listeners
      this.setupEventListeners();

      // Update storage info
      this.updateStorageInfo();

      console.log('[Options] Initialized');
    } catch (error) {
      console.error('[Options] Init error:', error);
    }
  }

  /**
   * Populate UI with current settings
   */
  populateSettings() {
    // DOM Trimmer
    this.setSliderValue('max-messages', this.settings.maxMessages || 50);
    this.setSliderValue('max-tokens', this.settings.maxTokens || 3000);
    document.getElementById('auto-trim-enabled').checked = this.settings.autoTrimEnabled || false;
    this.setSliderValue('auto-trim-interval', this.settings.autoTrimInterval || 5000, v => `${v/1000}s`);

    // Lazy Loading
    document.getElementById('lazy-load-enabled').checked = this.settings.lazyLoadEnabled !== false;
    this.setSliderValue('lazy-load-chunk', this.settings.lazyLoadChunkSize || 5);

    // Performance
    document.getElementById('pause-animations').checked = this.settings.pauseAnimations !== false;
    document.getElementById('pause-transitions').checked = this.settings.pauseTransitions !== false;
    document.getElementById('reduce-gpu').checked = this.settings.reduceGPULoad || false;

    // UI
    document.getElementById('show-overlay').checked = this.settings.showOverlay !== false;
    document.getElementById('hotkeys-enabled').checked = this.settings.hotkeysEnabled !== false;

    // Theme
    this.updateThemeSelector(this.settings.theme);
  }

  /**
   * Set slider value and display
   * @param {string} id - Slider ID
   * @param {number} value - Value to set
   * @param {Function} formatter - Optional value formatter
   */
  setSliderValue(id, value, formatter = null) {
    const slider = document.getElementById(id);
    const display = document.getElementById(`${id}-value`);
    
    if (slider) slider.value = value;
    if (display) display.textContent = formatter ? formatter(value) : value;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Sliders
    this.setupSlider('max-messages', 'maxMessages');
    this.setupSlider('max-tokens', 'maxTokens');
    this.setupSlider('auto-trim-interval', 'autoTrimInterval', v => `${v/1000}s`);
    this.setupSlider('lazy-load-chunk', 'lazyLoadChunkSize');

    // Toggles
    this.setupToggle('auto-trim-enabled', 'autoTrimEnabled');
    this.setupToggle('lazy-load-enabled', 'lazyLoadEnabled');
    this.setupToggle('pause-animations', 'pauseAnimations');
    this.setupToggle('pause-transitions', 'pauseTransitions');
    this.setupToggle('reduce-gpu', 'reduceGPULoad');
    this.setupToggle('show-overlay', 'showOverlay');
    this.setupToggle('hotkeys-enabled', 'hotkeysEnabled');

    // Theme selector
    document.getElementById('theme-selector').addEventListener('click', (e) => {
      const option = e.target.closest('.theme-option');
      if (option) {
        this.handleThemeChange(option.dataset.theme);
      }
    });

    // Export/Import
    document.getElementById('export-btn').addEventListener('click', () => this.handleExport());
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', (e) => this.handleImport(e));

    // Storage actions
    document.getElementById('clear-cache-btn').addEventListener('click', () => this.handleClearCache());
    document.getElementById('reset-btn').addEventListener('click', () => this.handleReset());
  }

  /**
   * Set up slider event listener
   * @param {string} id - Slider ID
   * @param {string} settingKey - Settings key
   * @param {Function} formatter - Optional value formatter
   */
  setupSlider(id, settingKey, formatter = null) {
    const slider = document.getElementById(id);
    const display = document.getElementById(`${id}-value`);

    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      display.textContent = formatter ? formatter(value) : value;
    });

    slider.addEventListener('change', (e) => {
      const value = parseInt(e.target.value);
      this.saveSetting(settingKey, value);
    });
  }

  /**
   * Set up toggle event listener
   * @param {string} id - Toggle ID
   * @param {string} settingKey - Settings key
   */
  setupToggle(id, settingKey) {
    document.getElementById(id).addEventListener('change', (e) => {
      this.saveSetting(settingKey, e.target.checked);
    });
  }

  /**
   * Save a setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  async saveSetting(key, value) {
    this.settings[key] = value;
    await Storage.saveSettings({ [key]: value });
    this.showSaveNotification();
  }

  /**
   * Handle theme change
   * @param {string} theme
   */
  async handleThemeChange(theme) {
    this.settings.theme = theme;
    await Storage.saveTheme(theme);
    this.applyTheme(theme);
    this.updateThemeSelector(theme);
    this.showSaveNotification();
  }

  /**
   * Apply theme to page
   * @param {string} theme
   */
  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
  }

  /**
   * Update theme selector UI
   * @param {string} activeTheme
   */
  updateThemeSelector(activeTheme) {
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.toggle('active', option.dataset.theme === activeTheme);
    });
  }

  /**
   * Handle export
   */
  async handleExport() {
    try {
      const data = await Storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `dom-optimizer-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showSaveNotification('Settings exported');
    } catch (error) {
      console.error('[Options] Export error:', error);
      alert('Failed to export settings');
    }
  }

  /**
   * Handle import
   * @param {Event} e
   */
  async handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (confirm('This will replace all current settings. Continue?')) {
        await Storage.importAll(data);
        this.settings = await Storage.getSettings();
        this.populateSettings();
        this.applyTheme(this.settings.theme);
        this.showSaveNotification('Settings imported');
      }
    } catch (error) {
      console.error('[Options] Import error:', error);
      alert('Failed to import settings. Invalid file format.');
    }

    // Reset file input
    e.target.value = '';
  }

  /**
   * Handle clear cache
   */
  async handleClearCache() {
    if (confirm('Clear extension cache?')) {
      await Storage.clearCache();
      this.updateStorageInfo();
      this.showSaveNotification('Cache cleared');
    }
  }

  /**
   * Handle reset
   */
  async handleReset() {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      await Storage.clear();
      
      // Reload settings with defaults
      this.settings = await Storage.getSettings();
      this.populateSettings();
      this.applyTheme(this.settings.theme);
      this.updateStorageInfo();
      this.showSaveNotification('Settings reset to defaults');
    }
  }

  /**
   * Update storage info display
   */
  async updateStorageInfo() {
    const info = await Storage.getStorageInfo();
    if (info) {
      document.getElementById('storage-used').textContent = info.bytesUsedFormatted;
      document.getElementById('storage-bar-fill').style.width = `${info.percentUsed}%`;
    }
  }

  /**
   * Show save notification
   * @param {string} message
   */
  showSaveNotification(message = 'Settings saved') {
    const notification = document.getElementById('save-notification');
    notification.textContent = message;
    notification.classList.add('show');

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Hide after delay
    this.saveTimeout = setTimeout(() => {
      notification.classList.remove('show');
    }, 2000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const options = new OptionsController();
  options.init();
});

