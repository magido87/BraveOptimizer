/**
 * Content Script - Main orchestrator
 * Coordinates all DOM optimization features
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.DOMOptimizerInitialized) {
    console.log('[DOMOptimizer] Already initialized');
    return;
  }
  window.DOMOptimizerInitialized = true;

  // Main controller
  class DOMOptimizerController {
    constructor() {
      this.siteDetector = null;
      this.adapter = null;
      this.trimmer = null;
      this.lazyLoader = null;
      this.performanceBoost = null;
      this.overlay = null;
      this.settings = null;
      this.autoTrimInterval = null;
      this.isInitialized = false;
    }

    /**
     * Initialize the optimizer
     */
    async init() {
      console.log('[DOMOptimizer] Initializing...');

      try {
        // Load settings
        this.settings = await Storage.getSettings();
        console.log('[DOMOptimizer] Settings loaded:', this.settings);

        // Detect site and get adapter
        this.siteDetector = new SiteDetector();
        this.adapter = this.siteDetector.detect();

        if (!this.adapter) {
          console.warn('[DOMOptimizer] No adapter found for this site');
          return;
        }

        // Initialize adapter
        await this.adapter.init();

        // Initialize components
        this.trimmer = new DOMTrimmer(this.adapter, {
          maxMessages: this.settings.maxMessages,
          maxTokens: this.settings.maxTokens
        });

        this.lazyLoader = new LazyLoader(this.trimmer, this.adapter, {
          enabled: this.settings.lazyLoadEnabled,
          chunkSize: this.settings.lazyLoadChunkSize
        });

        this.performanceBoost = new PerformanceBoost(this.adapter, {
          pauseAnimations: this.settings.pauseAnimations,
          pauseTransitions: this.settings.pauseTransitions
        });

        // Set up callbacks
        this.setupCallbacks();

        // Initialize lazy loader
        this.lazyLoader.init();

        // Initialize overlay if enabled
        if (this.settings.showOverlay && typeof DOMOptimizerOverlay !== 'undefined') {
          this.overlay = new DOMOptimizerOverlay(this);
          this.overlay.init();
        }

        // Start auto-trim if enabled
        if (this.settings.autoTrimEnabled) {
          this.startAutoTrim();
        }

        // Set up message listener for popup communication
        this.setupMessageListener();

        // Set up hotkeys
        this.setupHotkeys();

        this.isInitialized = true;
        console.log(`[DOMOptimizer] Initialized for ${this.siteDetector.getSiteName()}`);

        // Notify background script
        this.notifyBackground('initialized', {
          site: this.siteDetector.getSiteName(),
          supported: this.siteDetector.isSupported()
        });
      } catch (error) {
        console.error('[DOMOptimizer] Initialization error:', error);
      }
    }

    /**
     * Set up component callbacks
     */
    setupCallbacks() {
      // Trimmer callbacks
      this.trimmer.onTrim = (data) => {
        this.notifyBackground('trimmed', data);
        Storage.incrementStat('totalTrims');
        Storage.incrementStat('totalMessagesTrimmed', data.trimmed);
        if (this.overlay) this.overlay.update();
      };

      this.trimmer.onRestore = (data) => {
        this.notifyBackground('restored', data);
        Storage.incrementStat('totalRestores');
        if (this.overlay) this.overlay.update();
      };

      // Lazy loader callbacks
      this.lazyLoader.onLoad = (_data) => {
        if (this.overlay) this.overlay.update();
      };

      this.lazyLoader.onScrollStateChange = (data) => {
        if (data.atBottom && this.settings.autoTrimEnabled) {
          // Re-enable auto-trim when at bottom
          this.trimmer.trim();
        }
      };

      // Performance boost callbacks
      this.performanceBoost.onActivate = () => {
        this.notifyBackground('performanceBoostActivated');
        if (this.overlay) this.overlay.update();
      };

      this.performanceBoost.onDeactivate = () => {
        this.notifyBackground('performanceBoostDeactivated');
        if (this.overlay) this.overlay.update();
      };
    }

    /**
     * Set up message listener for popup/background communication
     */
    setupMessageListener() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleMessage(message, sendResponse);
        return true; // Keep channel open for async response
      });
    }

    /**
     * Handle incoming messages
     * @param {Object} message
     * @param {Function} sendResponse
     */
    async handleMessage(message, sendResponse) {
      console.log('[DOMOptimizer] Received message:', message.action);

      try {
        switch (message.action) {
          case 'getStatus':
            sendResponse(this.getStatus());
            break;

          case 'trim': {
            const trimResult = await this.trimmer.trim(message.options);
            sendResponse(trimResult);
            break;
          }

          case 'restore': {
            const restoreResult = await this.trimmer.restoreAll();
            sendResponse(restoreResult);
            break;
          }

          case 'toggleAutoTrim':
            this.toggleAutoTrim();
            sendResponse({ autoTrimEnabled: this.settings.autoTrimEnabled });
            break;

          case 'togglePerformanceBoost': {
            const isActive = this.performanceBoost.toggle();
            sendResponse({ isActive });
            break;
          }

          case 'freeMemory': {
            const memResult = this.performanceBoost.freeMemory();
            sendResponse(memResult);
            break;
          }

          case 'updateSettings':
            await this.updateSettings(message.settings);
            sendResponse({ success: true });
            break;

          case 'setTheme':
            this.setTheme(message.theme);
            sendResponse({ success: true });
            break;

          default:
            sendResponse({ error: 'Unknown action' });
        }
      } catch (error) {
        console.error('[DOMOptimizer] Message handler error:', error);
        sendResponse({ error: error.message });
      }
    }

    /**
     * Get current status
     * @returns {Object}
     */
    getStatus() {
      return {
        initialized: this.isInitialized,
        site: this.siteDetector?.getSiteName() || 'Unknown',
        supported: this.siteDetector?.isSupported() || false,
        trimmer: this.trimmer?.getStatus() || null,
        lazyLoader: this.lazyLoader?.getStatus() || null,
        performanceBoost: this.performanceBoost?.getStatus() || null,
        settings: this.settings
      };
    }

    /**
     * Trim DOM
     * @param {Object} options
     */
    async trim(options = {}) {
      if (!this.trimmer) return { success: false };
      return this.trimmer.trim(options);
    }

    /**
     * Restore all trimmed messages
     */
    async restore() {
      if (!this.trimmer) return { success: false };
      return this.trimmer.restoreAll();
    }

    /**
     * Toggle auto-trim mode
     */
    toggleAutoTrim() {
      this.settings.autoTrimEnabled = !this.settings.autoTrimEnabled;
      Storage.saveSettings({ autoTrimEnabled: this.settings.autoTrimEnabled });

      if (this.settings.autoTrimEnabled) {
        this.startAutoTrim();
      } else {
        this.stopAutoTrim();
      }

      if (this.overlay) this.overlay.update();
    }

    /**
     * Start auto-trim interval
     */
    startAutoTrim() {
      if (this.autoTrimInterval) return;

      this.autoTrimInterval = setInterval(() => {
        if (this.adapter.isAtBottom()) {
          this.trimmer.trim();
        }
      }, this.settings.autoTrimInterval || DOMOptimizerConfig.autoTrim.interval);

      console.log('[DOMOptimizer] Auto-trim started');
    }

    /**
     * Stop auto-trim interval
     */
    stopAutoTrim() {
      if (this.autoTrimInterval) {
        clearInterval(this.autoTrimInterval);
        this.autoTrimInterval = null;
      }
      console.log('[DOMOptimizer] Auto-trim stopped');
    }

    /**
     * Update settings
     * @param {Object} newSettings
     */
    async updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      await Storage.saveSettings(newSettings);

      // Update components
      if (this.trimmer) {
        this.trimmer.updateOptions({
          maxMessages: this.settings.maxMessages,
          maxTokens: this.settings.maxTokens
        });
      }

      if (this.lazyLoader) {
        this.lazyLoader.updateOptions({
          enabled: this.settings.lazyLoadEnabled,
          chunkSize: this.settings.lazyLoadChunkSize
        });
      }

      if (this.performanceBoost) {
        this.performanceBoost.updateOptions({
          pauseAnimations: this.settings.pauseAnimations,
          pauseTransitions: this.settings.pauseTransitions
        });
      }

      // Handle auto-trim changes
      if (newSettings.autoTrimEnabled !== undefined) {
        if (newSettings.autoTrimEnabled) {
          this.startAutoTrim();
        } else {
          this.stopAutoTrim();
        }
      }

      console.log('[DOMOptimizer] Settings updated');
    }

    /**
     * Set theme
     * @param {string} theme
     */
    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      Storage.saveTheme(theme);
      if (this.overlay) this.overlay.updateTheme(theme);
    }

    /**
     * Set up hotkeys
     */
    setupHotkeys() {
      if (!this.settings.hotkeysEnabled) return;

      document.addEventListener('keydown', (e) => {
        // Alt+T - Trim
        if (e.altKey && e.key === 't') {
          e.preventDefault();
          this.trim();
        }
        // Alt+R - Restore
        if (e.altKey && e.key === 'r') {
          e.preventDefault();
          this.restore();
        }
        // Alt+A - Toggle Auto
        if (e.altKey && e.key === 'a') {
          e.preventDefault();
          this.toggleAutoTrim();
        }
        // Alt+P - Performance Boost
        if (e.altKey && e.key === 'p') {
          e.preventDefault();
          this.performanceBoost.toggle();
        }
        // Alt+O - Toggle Overlay
        if (e.altKey && e.key === 'o') {
          e.preventDefault();
          if (this.overlay) this.overlay.toggle();
        }
      });
    }

    /**
     * Notify background script
     * @param {string} event
     * @param {Object} data
     */
    notifyBackground(event, data = {}) {
      try {
        chrome.runtime.sendMessage({
          type: 'contentEvent',
          event,
          data,
          tabId: null // Will be filled by background
        });
      } catch (error) {
        // Extension context may be invalidated
        console.warn('[DOMOptimizer] Could not notify background:', error);
      }
    }

    /**
     * Cleanup
     */
    destroy() {
      this.stopAutoTrim();
      if (this.trimmer) this.trimmer.destroy();
      if (this.lazyLoader) this.lazyLoader.destroy();
      if (this.performanceBoost) this.performanceBoost.destroy();
      if (this.overlay) this.overlay.destroy();
      window.DOMOptimizerInitialized = false;
    }
  }

  // Create and expose controller
  window.DOMOptimizer = new DOMOptimizerController();

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.DOMOptimizer.init();
    });
  } else {
    // DOM already loaded
    window.DOMOptimizer.init();
  }
})();
