/**
 * Storage wrapper for chrome.storage.local
 * Handles all persistence with error handling and defaults
 */

const Storage = {
  // Storage keys
  KEYS: {
    SETTINGS: 'domOptimizer_settings',
    THEME: 'domOptimizer_theme',
    SITE_RULES: 'domOptimizer_siteRules',
    PRESETS: 'domOptimizer_presets',
    STATS: 'domOptimizer_stats',
    CACHE: 'domOptimizer_cache'
  },

  /**
   * Get value from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error('[Storage] Get error:', error);
      return defaultValue;
    }
  },

  /**
   * Set value in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {Promise<boolean>}
   */
  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error('[Storage] Set error:', error);
      return false;
    }
  },

  /**
   * Remove value from storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>}
   */
  async remove(key) {
    try {
      await chrome.storage.local.remove(key);
      return true;
    } catch (error) {
      console.error('[Storage] Remove error:', error);
      return false;
    }
  },

  /**
   * Clear all extension storage
   * @returns {Promise<boolean>}
   */
  async clear() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('[Storage] Clear error:', error);
      return false;
    }
  },

  /**
   * Get all settings with defaults
   * @returns {Promise<Object>}
   */
  async getSettings() {
    const defaults = {
      maxMessages: CONFIG.trimmer.defaultMaxMessages,
      maxTokens: CONFIG.trimmer.defaultMaxTokens,
      autoTrimEnabled: CONFIG.autoTrim.enabled,
      autoTrimInterval: CONFIG.autoTrim.interval,
      lazyLoadEnabled: CONFIG.lazyLoader.enabled,
      lazyLoadChunkSize: CONFIG.lazyLoader.chunkSize,
      performanceBoostEnabled: CONFIG.performance.pauseAnimations,
      pauseAnimations: CONFIG.performance.pauseAnimations,
      pauseTransitions: CONFIG.performance.pauseTransitions,
      showOverlay: CONFIG.ui.showOverlay,
      overlayPosition: CONFIG.ui.overlayPosition,
      theme: CONFIG.ui.defaultTheme,
      hotkeysEnabled: true,
      debugMode: CONFIG.debug.enabled
    };

    const stored = await this.get(this.KEYS.SETTINGS, {});
    const legacyTheme = await this.get(this.KEYS.THEME, null);

    if (!stored.theme && legacyTheme) {
      stored.theme = legacyTheme;
    }

    return { ...defaults, ...stored };
  },

  /**
   * Save settings
   * @param {Object} settings - Settings to save
   * @returns {Promise<boolean>}
   */
  async saveSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    return this.set(this.KEYS.SETTINGS, updated);
  },

  /**
   * Get current theme
   * @returns {Promise<string>}
   */
  async getTheme() {
    const settings = await this.getSettings();
    return settings.theme || CONFIG.ui.defaultTheme;
  },

  /**
   * Save theme
   * @param {string} theme - Theme name
   * @returns {Promise<boolean>}
   */
  async saveTheme(theme) {
    await this.set(this.KEYS.THEME, theme);
    return this.saveSettings({ theme });
  },

  /**
   * Get site-specific rules
   * @param {string} hostname - Site hostname
   * @returns {Promise<Object|null>}
   */
  async getSiteRules(hostname) {
    const rules = await this.get(this.KEYS.SITE_RULES, {});
    return rules[hostname] || null;
  },

  /**
   * Save site-specific rules
   * @param {string} hostname - Site hostname
   * @param {Object} rules - Rules for the site
   * @returns {Promise<boolean>}
   */
  async saveSiteRules(hostname, rules) {
    const allRules = await this.get(this.KEYS.SITE_RULES, {});
    allRules[hostname] = rules;
    return this.set(this.KEYS.SITE_RULES, allRules);
  },

  /**
   * Get all presets
   * @returns {Promise<Array>}
   */
  async getPresets() {
    return this.get(this.KEYS.PRESETS, []);
  },

  /**
   * Save preset
   * @param {Object} preset - Preset to save
   * @returns {Promise<boolean>}
   */
  async savePreset(preset) {
    const presets = await this.getPresets();
    preset.id = preset.id || Date.now().toString();
    preset.createdAt = preset.createdAt || new Date().toISOString();

    const existingIndex = presets.findIndex((p) => p.id === preset.id);
    if (existingIndex >= 0) {
      presets[existingIndex] = preset;
    } else {
      presets.push(preset);
    }

    return this.set(this.KEYS.PRESETS, presets);
  },

  /**
   * Delete preset
   * @param {string} presetId - Preset ID
   * @returns {Promise<boolean>}
   */
  async deletePreset(presetId) {
    const presets = await this.getPresets();
    const filtered = presets.filter((p) => p.id !== presetId);
    return this.set(this.KEYS.PRESETS, filtered);
  },

  /**
   * Get usage statistics
   * @returns {Promise<Object>}
   */
  async getStats() {
    return this.get(this.KEYS.STATS, {
      totalTrims: 0,
      totalRestores: 0,
      totalMessagesTrimmed: 0,
      totalMemoryFreed: 0,
      sessionsCount: 0,
      lastUsed: null
    });
  },

  /**
   * Update statistics
   * @param {Object} updates - Stats to update
   * @returns {Promise<boolean>}
   */
  async updateStats(updates) {
    const stats = await this.getStats();
    const updated = {
      ...stats,
      ...updates,
      lastUsed: new Date().toISOString()
    };
    return this.set(this.KEYS.STATS, updated);
  },

  /**
   * Increment a stat counter
   * @param {string} statName - Name of the stat
   * @param {number} amount - Amount to increment
   * @returns {Promise<boolean>}
   */
  async incrementStat(statName, amount = 1) {
    const stats = await this.getStats();
    stats[statName] = (stats[statName] || 0) + amount;
    return this.set(this.KEYS.STATS, stats);
  },

  /**
   * Clear extension cache
   * @returns {Promise<boolean>}
   */
  async clearCache() {
    return this.remove(this.KEYS.CACHE);
  },

  /**
   * Get storage usage info
   * @returns {Promise<Object>}
   */
  async getStorageInfo() {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse();
      return {
        bytesUsed: bytesInUse,
        bytesUsedFormatted: this.formatBytes(bytesInUse),
        quotaBytes: chrome.storage.local.QUOTA_BYTES || 5242880,
        percentUsed: ((bytesInUse / (chrome.storage.local.QUOTA_BYTES || 5242880)) * 100).toFixed(2)
      };
    } catch (error) {
      console.error('[Storage] Get info error:', error);
      return null;
    }
  },

  /**
   * Format bytes to human readable
   * @param {number} bytes - Bytes to format
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Export all data
   * @returns {Promise<Object>}
   */
  async exportAll() {
    try {
      const data = await chrome.storage.local.get(null);
      return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        data
      };
    } catch (error) {
      console.error('[Storage] Export error:', error);
      return null;
    }
  },

  /**
   * Import data
   * @param {Object} importData - Data to import
   * @returns {Promise<boolean>}
   */
  async importAll(importData) {
    try {
      if (!importData || !importData.data) {
        throw new Error('Invalid import data');
      }
      await chrome.storage.local.set(importData.data);
      return true;
    } catch (error) {
      console.error('[Storage] Import error:', error);
      return false;
    }
  }
};

// Make Storage available globally
if (typeof window !== 'undefined') {
  window.DOMOptimizerStorage = Storage;
}
