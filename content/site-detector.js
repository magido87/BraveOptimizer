/**
 * Site Detector - Detects and selects appropriate adapter
 * Handles multi-site support and fallback logic
 */

class SiteDetector {
  constructor() {
    this.adapters = [];
    this.currentAdapter = null;
    this.detectedSite = null;
    
    // Register all adapters
    this.registerAdapters();
  }

  /**
   * Register all available adapters
   */
  registerAdapters() {
    // Order matters - more specific adapters first
    if (typeof ChatGPTAdapter !== 'undefined') {
      this.adapters.push(new ChatGPTAdapter());
    }
    if (typeof ClaudeAdapter !== 'undefined') {
      this.adapters.push(new ClaudeAdapter());
    }
    if (typeof GrokAdapter !== 'undefined') {
      this.adapters.push(new GrokAdapter());
    }
    if (typeof PerplexityAdapter !== 'undefined') {
      this.adapters.push(new PerplexityAdapter());
    }
    if (typeof GeminiAdapter !== 'undefined') {
      this.adapters.push(new GeminiAdapter());
    }
    
    // Generic adapter as fallback
    if (typeof BaseAdapter !== 'undefined') {
      const genericAdapter = new BaseAdapter();
      genericAdapter.name = 'Generic';
      genericAdapter.selectors = {
        container: 'main, [role="main"], #main, .main',
        messages: '[class*="message"], [class*="chat"], [class*="conversation"] > div',
        userMessage: '[class*="user"], [class*="human"], [class*="self"]',
        assistantMessage: '[class*="assistant"], [class*="bot"], [class*="ai"]',
        input: 'textarea, [contenteditable="true"], input[type="text"]',
        preserveElements: ['textarea', '[contenteditable="true"]', 'nav', 'header', 'footer']
      };
      genericAdapter.detect = () => true; // Always matches as fallback
      this.adapters.push(genericAdapter);
    }

    console.log(`[SiteDetector] Registered ${this.adapters.length} adapters`);
  }

  /**
   * Detect current site and select adapter
   * @returns {BaseAdapter|null}
   */
  detect() {
    const hostname = window.location.hostname;
    console.log(`[SiteDetector] Detecting site: ${hostname}`);

    for (const adapter of this.adapters) {
      if (adapter.detect()) {
        this.currentAdapter = adapter;
        this.detectedSite = adapter.name;
        console.log(`[SiteDetector] Detected: ${adapter.name}`);
        return adapter;
      }
    }

    console.warn('[SiteDetector] No adapter matched');
    return null;
  }

  /**
   * Get current adapter
   * @returns {BaseAdapter|null}
   */
  getAdapter() {
    if (!this.currentAdapter) {
      this.detect();
    }
    return this.currentAdapter;
  }

  /**
   * Get detected site name
   * @returns {string|null}
   */
  getSiteName() {
    return this.detectedSite;
  }

  /**
   * Check if current site is supported
   * @returns {boolean}
   */
  isSupported() {
    const adapter = this.getAdapter();
    return adapter !== null && adapter.name !== 'Generic';
  }

  /**
   * Get site profile based on detected site
   * @returns {Object}
   */
  getSiteProfile() {
    const siteName = this.getSiteName();
    
    // Map site names to profiles
    const profileMap = {
      'ChatGPT': CONFIG.profiles.chat,
      'Claude': CONFIG.profiles.chat,
      'Grok': CONFIG.profiles.chat,
      'Perplexity': CONFIG.profiles.chat,
      'Gemini': CONFIG.profiles.chat,
      'Generic': CONFIG.profiles.article
    };

    return profileMap[siteName] || CONFIG.profiles.chat;
  }

  /**
   * Get all registered adapters
   * @returns {Array}
   */
  getAllAdapters() {
    return this.adapters;
  }

  /**
   * Register a custom adapter
   * @param {BaseAdapter} adapter
   */
  registerAdapter(adapter) {
    // Insert before generic adapter
    const genericIndex = this.adapters.findIndex(a => a.name === 'Generic');
    if (genericIndex >= 0) {
      this.adapters.splice(genericIndex, 0, adapter);
    } else {
      this.adapters.push(adapter);
    }
    console.log(`[SiteDetector] Registered custom adapter: ${adapter.name}`);
  }

  /**
   * Force use specific adapter
   * @param {string} adapterName
   * @returns {boolean}
   */
  forceAdapter(adapterName) {
    const adapter = this.adapters.find(a => a.name === adapterName);
    if (adapter) {
      this.currentAdapter = adapter;
      this.detectedSite = adapter.name;
      console.log(`[SiteDetector] Forced adapter: ${adapterName}`);
      return true;
    }
    return false;
  }

  /**
   * Reset detection
   */
  reset() {
    this.currentAdapter = null;
    this.detectedSite = null;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SiteDetector = SiteDetector;
}

