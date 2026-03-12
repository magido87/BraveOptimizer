/**
 * Popup Script
 * Handles popup UI interactions and communication with content script
 */

class PopupController {
  constructor() {
    this.currentTab = null;
    this.status = null;
    this.settings = null;
    this.isConnected = false;
  }

  /**
   * Initialize popup
   */
  async init() {
    console.log('[Popup] Initializing...');

    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;

      // Load settings
      this.settings = await Storage.getSettings();

      // Apply saved theme
      this.applyTheme(this.settings.theme);

      // Set up UI
      this.setupEventListeners();
      this.renderThemes();

      // Get status from content script
      await this.refreshStatus();

      // Update UI with settings
      this.updateUIFromSettings();

      console.log('[Popup] Initialized');
    } catch (error) {
      console.error('[Popup] Init error:', error);
      this.showDisabledState();
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Action buttons
    document.getElementById('trim-btn').addEventListener('click', () => this.handleTrim());
    document.getElementById('restore-btn').addEventListener('click', () => this.handleRestore());
    document.getElementById('memory-btn').addEventListener('click', () => this.handleFreeMemory());
    document.getElementById('purge-btn').addEventListener('click', () => this.handlePurgeCache());

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Slider
    const slider = document.getElementById('max-messages-slider');
    const sliderValue = document.getElementById('max-messages-value');
    slider.addEventListener('input', (e) => {
      sliderValue.textContent = e.target.value;
    });
    slider.addEventListener('change', (e) => {
      this.handleSettingChange('maxMessages', parseInt(e.target.value));
    });

    // Toggles
    document.getElementById('auto-trim-toggle').addEventListener('change', (e) => {
      this.handleSettingChange('autoTrimEnabled', e.target.checked);
    });

    document.getElementById('perf-boost-toggle').addEventListener('change', (e) => {
      this.handleTogglePerformanceBoost(e.target.checked);
    });

    document.getElementById('lazy-load-toggle').addEventListener('change', (e) => {
      this.handleSettingChange('lazyLoadEnabled', e.target.checked);
    });

    // Theme buttons (delegated)
    document.getElementById('theme-grid').addEventListener('click', (e) => {
      const themeBtn = e.target.closest('.theme-btn');
      if (themeBtn) {
        this.handleThemeChange(themeBtn.dataset.theme);
      }
    });
  }

  /**
   * Refresh status from content script
   */
  async refreshStatus() {
    try {
      this.status = await this.sendMessage({ action: 'getStatus' });
      this.updateUIFromStatus();
      this.isConnected = true;
    } catch (error) {
      console.warn('[Popup] Could not get status:', error);
      this.isConnected = false;
      this.showDisabledState();
    }
  }

  /**
   * Update UI from status
   */
  updateUIFromStatus() {
    if (!this.status) return;

    // Update site badge
    const siteBadge = document.getElementById('site-badge');
    if (this.status.supported) {
      siteBadge.textContent = this.status.site;
      siteBadge.classList.remove('glass-badge-warning');
      siteBadge.classList.add('glass-badge-success');
    } else {
      siteBadge.textContent = this.status.site || 'Unsupported';
      siteBadge.classList.add('glass-badge-warning');
    }

    // Update stats
    if (this.status.trimmer) {
      document.getElementById('visible-count').textContent =
        this.status.trimmer.visibleMessages || 0;
      document.getElementById('trimmed-count').textContent =
        this.status.trimmer.trimmedMessages || 0;
      document.getElementById('total-count').textContent = this.status.trimmer.totalMessages || 0;
    }

    // Update toggles
    if (this.status.performanceBoost) {
      document.getElementById('perf-boost-toggle').checked = this.status.performanceBoost.isActive;
    }
  }

  /**
   * Update UI from settings
   */
  updateUIFromSettings() {
    if (!this.settings) return;

    // Slider
    const slider = document.getElementById('max-messages-slider');
    const sliderValue = document.getElementById('max-messages-value');
    slider.value = this.settings.maxMessages || 50;
    sliderValue.textContent = slider.value;

    // Toggles
    document.getElementById('auto-trim-toggle').checked = this.settings.autoTrimEnabled || false;
    document.getElementById('lazy-load-toggle').checked = this.settings.lazyLoadEnabled !== false;
  }

  /**
   * Render theme buttons
   */
  renderThemes() {
    const themeGrid = document.getElementById('theme-grid');
    const themes = ['ocean', 'darkBlue', 'purple', 'green', 'sunset'];

    themeGrid.innerHTML = themes
      .map(
        (theme) => `
      <button class="theme-btn ${theme === this.settings.theme ? 'active' : ''}" 
              data-theme="${theme}" 
              title="${CONFIG.themes[theme]?.name || theme}">
      </button>
    `
      )
      .join('');
  }

  /**
   * Apply theme to popup
   * @param {string} theme
   */
  applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);

    // Update active state
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  /**
   * Handle trim action
   */
  async handleTrim() {
    const btn = document.getElementById('trim-btn');
    btn.classList.add('loading');

    try {
      const result = await this.sendMessage({ action: 'trim' });

      if (result.success) {
        this.showNotification(`Trimmed ${result.trimmed} messages`, 'success');
        await this.refreshStatus();
      } else {
        this.showNotification(result.reason || 'Trim failed', 'error');
      }
    } catch (_error) {
      this.showNotification('Could not trim', 'error');
    }

    btn.classList.remove('loading');
  }

  /**
   * Handle restore action
   */
  async handleRestore() {
    const btn = document.getElementById('restore-btn');
    btn.classList.add('loading');

    try {
      const result = await this.sendMessage({ action: 'restore' });

      if (result.success) {
        this.showNotification(`Restored ${result.restored} messages`, 'success');
        await this.refreshStatus();
      } else {
        this.showNotification(result.reason || 'Restore failed', 'error');
      }
    } catch (_error) {
      this.showNotification('Could not restore', 'error');
    }

    btn.classList.remove('loading');
  }

  /**
   * Handle free memory action
   */
  async handleFreeMemory() {
    const btn = document.getElementById('memory-btn');
    btn.classList.add('loading');

    try {
      const result = await this.sendMessage({ action: 'freeMemory' });

      this.showNotification(
        `Freed ${result.freedImages || 0} images, paused ${result.pausedVideos || 0} videos`,
        'success'
      );
    } catch (_error) {
      this.showNotification('Could not free memory', 'error');
    }

    btn.classList.remove('loading');
  }

  /**
   * Handle purge cache action
   */
  async handlePurgeCache() {
    const btn = document.getElementById('purge-btn');
    btn.classList.add('loading');

    try {
      await Storage.clearCache();
      this.showNotification('Cache purged', 'success');
    } catch (_error) {
      this.showNotification('Could not purge cache', 'error');
    }

    btn.classList.remove('loading');
  }

  /**
   * Handle setting change
   * @param {string} key
   * @param {*} value
   */
  async handleSettingChange(key, value) {
    this.settings[key] = value;
    await Storage.saveSettings({ [key]: value });

    // Notify content script
    try {
      await this.sendMessage({
        action: 'updateSettings',
        settings: { [key]: value }
      });
    } catch (error) {
      console.warn('[Popup] Could not update content script:', error);
    }
  }

  /**
   * Handle performance boost toggle
   * @param {boolean} enabled
   */
  async handleTogglePerformanceBoost(enabled) {
    try {
      const result = await this.sendMessage({ action: 'togglePerformanceBoost' });
      this.showNotification(
        result.isActive ? 'Performance boost ON' : 'Performance boost OFF',
        'success'
      );
    } catch (_error) {
      this.showNotification('Could not toggle performance boost', 'error');
      // Revert checkbox
      document.getElementById('perf-boost-toggle').checked = !enabled;
    }
  }

  /**
   * Handle theme change
   * @param {string} theme
   */
  async handleThemeChange(theme) {
    this.settings.theme = theme;
    await Storage.saveTheme(theme);
    this.applyTheme(theme);

    // Notify content script
    try {
      await this.sendMessage({ action: 'setTheme', theme });
    } catch (error) {
      console.warn('[Popup] Could not update content script theme:', error);
    }

    // Update active state
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  /**
   * Send message to content script
   * @param {Object} message
   * @returns {Promise<Object>}
   */
  async sendMessage(message) {
    if (!this.currentTab?.id) {
      throw new Error('No active tab');
    }

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Show notification
   * @param {string} message
   * @param {string} type - 'success' or 'error'
   */
  showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.popup-notification').forEach((n) => n.remove());

    const notification = document.createElement('div');
    notification.className = `popup-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }

  /**
   * Show disabled state
   */
  showDisabledState() {
    const siteBadge = document.getElementById('site-badge');
    siteBadge.textContent = 'Not available';
    siteBadge.classList.add('glass-badge-warning');

    // Disable action buttons but keep settings accessible
    document.getElementById('trim-btn').disabled = true;
    document.getElementById('restore-btn').disabled = true;
    document.getElementById('memory-btn').disabled = true;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupController();
  popup.init();
});
