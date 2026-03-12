/**
 * State Manager - Manages extension state across components
 * Coordinates state between content script, popup, and background
 */

class StateManager {
  constructor() {
    this.state = {
      // Current site info
      currentSite: null,
      isSupported: false,

      // Trim state
      trimmedCount: 0,
      visibleCount: 0,
      totalCount: 0,

      // Feature states
      autoTrimEnabled: false,
      performanceBoostActive: false,
      lazyLoadEnabled: true,

      // UI state
      overlayVisible: true,
      currentTheme: 'ocean',

      // Session stats
      sessionTrims: 0,
      sessionRestores: 0,
      sessionMemoryFreed: 0
    };

    this.listeners = new Map();
    this.listenerIdCounter = 0;
  }

  /**
   * Get current state
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get specific state value
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Update state
   * @param {Object} updates
   */
  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Notify listeners of changes
    const changedKeys = Object.keys(updates).filter((key) => oldState[key] !== this.state[key]);

    if (changedKeys.length > 0) {
      this.notifyListeners(changedKeys, oldState);
    }
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback
   * @param {Array<string>} keys - Specific keys to watch (optional)
   * @returns {number} Listener ID for unsubscribing
   */
  subscribe(callback, keys = null) {
    const id = ++this.listenerIdCounter;
    this.listeners.set(id, { callback, keys });
    return id;
  }

  /**
   * Unsubscribe from state changes
   * @param {number} id - Listener ID
   */
  unsubscribe(id) {
    this.listeners.delete(id);
  }

  /**
   * Notify listeners of state changes
   * @param {Array<string>} changedKeys
   * @param {Object} oldState
   */
  notifyListeners(changedKeys, oldState) {
    this.listeners.forEach(({ callback, keys }) => {
      // If specific keys are watched, only notify if they changed
      if (keys) {
        const relevantChanges = changedKeys.filter((k) => keys.includes(k));
        if (relevantChanges.length === 0) return;
      }

      try {
        callback(this.state, oldState, changedKeys);
      } catch (error) {
        console.error('[StateManager] Listener error:', error);
      }
    });
  }

  /**
   * Update trim status
   * @param {Object} status
   */
  updateTrimStatus(status) {
    this.setState({
      trimmedCount: status.trimmedMessages || 0,
      visibleCount: status.visibleMessages || 0,
      totalCount: status.totalMessages || 0
    });
  }

  /**
   * Update site info
   * @param {string} siteName
   * @param {boolean} isSupported
   */
  updateSiteInfo(siteName, isSupported) {
    this.setState({
      currentSite: siteName,
      isSupported: isSupported
    });
  }

  /**
   * Record trim action
   * @param {number} count
   */
  recordTrim(count) {
    this.setState({
      sessionTrims: this.state.sessionTrims + 1,
      trimmedCount: this.state.trimmedCount + count
    });
  }

  /**
   * Record restore action
   * @param {number} count
   */
  recordRestore(count) {
    this.setState({
      sessionRestores: this.state.sessionRestores + 1,
      trimmedCount: Math.max(0, this.state.trimmedCount - count)
    });
  }

  /**
   * Toggle feature state
   * @param {string} feature
   * @returns {boolean} New state
   */
  toggleFeature(feature) {
    const key = `${feature}Enabled`;
    if (key in this.state) {
      this.setState({ [key]: !this.state[key] });
      return this.state[key];
    }

    const activeKey = `${feature}Active`;
    if (activeKey in this.state) {
      this.setState({ [activeKey]: !this.state[activeKey] });
      return this.state[activeKey];
    }

    return false;
  }

  /**
   * Reset session stats
   */
  resetSession() {
    this.setState({
      sessionTrims: 0,
      sessionRestores: 0,
      sessionMemoryFreed: 0
    });
  }

  /**
   * Serialize state for storage
   * @returns {string}
   */
  serialize() {
    return JSON.stringify(this.state);
  }

  /**
   * Restore state from storage
   * @param {string} serialized
   */
  deserialize(serialized) {
    try {
      const restored = JSON.parse(serialized);
      this.setState(restored);
    } catch (error) {
      console.error('[StateManager] Deserialize error:', error);
    }
  }

  /**
   * Clear all listeners
   */
  clearListeners() {
    this.listeners.clear();
  }
}

// Create singleton instance
const stateManager = new StateManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.DOMOptimizerState = stateManager;
}
