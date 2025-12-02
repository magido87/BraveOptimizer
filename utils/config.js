/**
 * Default configuration for DOM Performance Optimizer
 * All settings can be overridden by user preferences
 */

const CONFIG = {
  // DOM Trimmer Settings
  trimmer: {
    defaultMaxMessages: 50,
    minMessages: 5,
    maxMessages: 500,
    defaultMaxTokens: 3000,
    minTokens: 500,
    maxTokens: 10000,
    tokensPerMessage: 60, // Average estimate
    trimDelay: 100, // ms delay before trimming
    restoreChunkSize: 10,
    restoreDelay: 50
  },

  // Lazy Loader Settings
  lazyLoader: {
    enabled: true,
    chunkSize: 5,
    minChunkSize: 2,
    maxChunkSize: 20,
    scrollThreshold: 200, // px from top to trigger load
    scrollDebounce: 150, // ms
    velocityFactor: 0.5, // Adjust chunk size based on scroll speed
    bottomThreshold: 100 // px from bottom to re-enable auto-trim
  },

  // Performance Boost Settings
  performance: {
    pauseAnimations: true,
    pauseTransitions: true,
    removeUnusedListeners: true,
    optimizeReflow: true,
    reduceGPULoad: false,
    throttleScrollEvents: true,
    scrollThrottleMs: 16, // ~60fps
    disableHoverEffects: false,
    reduceShadows: false
  },

  // Auto-Trim Settings
  autoTrim: {
    enabled: false,
    interval: 5000, // ms
    onlyWhenAtBottom: true,
    pauseOnScroll: true,
    pauseDuration: 2000 // ms after scroll stops
  },

  // Memory Management
  memory: {
    maxVirtualStoreSize: 1000, // Max messages in virtual store
    cleanupInterval: 30000, // ms
    enableAutoCleanup: true,
    warningThreshold: 500, // messages
    criticalThreshold: 800 // messages
  },

  // UI Settings
  ui: {
    defaultTheme: 'ocean',
    showOverlay: true,
    overlayPosition: 'bottom-right',
    overlayOpacity: 0.9,
    animationDuration: 300, // ms
    showNotifications: true,
    notificationDuration: 3000 // ms
  },

  // Available Themes
  themes: {
    darkBlue: {
      name: 'Dark Blue',
      primary: '#1a365d',
      secondary: '#2c5282',
      accent: '#4299e1',
      background: 'rgba(26, 54, 93, 0.85)',
      text: '#e2e8f0',
      border: 'rgba(66, 153, 225, 0.3)'
    },
    purple: {
      name: 'Purple Dream',
      primary: '#44337a',
      secondary: '#6b46c1',
      accent: '#9f7aea',
      background: 'rgba(68, 51, 122, 0.85)',
      text: '#e9d8fd',
      border: 'rgba(159, 122, 234, 0.3)'
    },
    green: {
      name: 'Forest',
      primary: '#1c4532',
      secondary: '#276749',
      accent: '#48bb78',
      background: 'rgba(28, 69, 50, 0.85)',
      text: '#c6f6d5',
      border: 'rgba(72, 187, 120, 0.3)'
    },
    sunset: {
      name: 'Sunset',
      primary: '#742a2a',
      secondary: '#c53030',
      accent: '#fc8181',
      background: 'rgba(116, 42, 42, 0.85)',
      text: '#fed7d7',
      border: 'rgba(252, 129, 129, 0.3)'
    },
    ocean: {
      name: 'Ocean',
      primary: '#0d4f4f',
      secondary: '#0d9488',
      accent: '#2dd4bf',
      background: 'rgba(13, 79, 79, 0.85)',
      text: '#ccfbf1',
      border: 'rgba(45, 212, 191, 0.3)'
    }
  },

  // Site Profiles
  profiles: {
    chat: {
      name: 'Chat Interface',
      maxMessages: 50,
      autoTrim: true,
      lazyLoad: true,
      performanceBoost: true
    },
    feed: {
      name: 'Feed/Timeline',
      maxMessages: 30,
      autoTrim: true,
      lazyLoad: true,
      performanceBoost: true
    },
    article: {
      name: 'Article/Blog',
      maxMessages: 100,
      autoTrim: false,
      lazyLoad: true,
      performanceBoost: false
    },
    dashboard: {
      name: 'Dashboard',
      maxMessages: 200,
      autoTrim: false,
      lazyLoad: false,
      performanceBoost: true
    },
    video: {
      name: 'Video Page',
      maxMessages: 50,
      autoTrim: true,
      lazyLoad: true,
      performanceBoost: true
    },
    ecommerce: {
      name: 'E-commerce',
      maxMessages: 40,
      autoTrim: true,
      lazyLoad: true,
      performanceBoost: false
    }
  },

  // Hotkeys
  hotkeys: {
    trim: 'Alt+T',
    restore: 'Alt+R',
    toggleAuto: 'Alt+A',
    toggleOverlay: 'Alt+O',
    performanceBoost: 'Alt+P'
  },

  // Debug Settings
  debug: {
    enabled: false,
    logLevel: 'warn', // 'debug', 'info', 'warn', 'error'
    showMetrics: false
  }
};

// Make config available globally
if (typeof window !== 'undefined') {
  window.DOMOptimizerConfig = CONFIG;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

