/**
 * Performance Boost - Optimizes page performance
 * Pauses animations, removes heavy elements, optimizes reflow
 */

class PerformanceBoost {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      pauseAnimations: options.pauseAnimations ?? CONFIG.performance.pauseAnimations,
      pauseTransitions: options.pauseTransitions ?? CONFIG.performance.pauseTransitions,
      removeUnusedListeners: options.removeUnusedListeners ?? CONFIG.performance.removeUnusedListeners,
      optimizeReflow: options.optimizeReflow ?? CONFIG.performance.optimizeReflow,
      reduceGPULoad: options.reduceGPULoad ?? CONFIG.performance.reduceGPULoad,
      throttleScrollEvents: options.throttleScrollEvents ?? CONFIG.performance.throttleScrollEvents,
      ...options
    };

    this.isActive = false;
    this.originalStyles = new Map();
    this.pausedAnimations = new Set();
    this.removedListeners = [];
    this.styleElement = null;
    this.mutationObserver = null;

    // Callbacks
    this.onActivate = null;
    this.onDeactivate = null;
  }

  /**
   * Activate performance boost
   */
  activate() {
    if (this.isActive) return;

    console.log('[PerformanceBoost] Activating...');
    const startTime = performance.now();

    try {
      if (this.options.pauseAnimations) {
        this.pauseAllAnimations();
      }

      if (this.options.pauseTransitions) {
        this.pauseAllTransitions();
      }

      if (this.options.optimizeReflow) {
        this.optimizeReflow();
      }

      if (this.options.reduceGPULoad) {
        this.reduceGPULoad();
      }

      this.injectPerformanceStyles();
      this.isActive = true;

      const duration = performance.now() - startTime;
      console.log(`[PerformanceBoost] Activated in ${duration.toFixed(2)}ms`);

      if (this.onActivate) {
        this.onActivate({ duration });
      }

    } catch (error) {
      console.error('[PerformanceBoost] Activation error:', error);
    }
  }

  /**
   * Deactivate performance boost
   */
  deactivate() {
    if (!this.isActive) return;

    console.log('[PerformanceBoost] Deactivating...');

    try {
      this.restoreAllAnimations();
      this.restoreAllTransitions();
      this.removePerformanceStyles();
      this.restoreOriginalStyles();

      this.isActive = false;
      console.log('[PerformanceBoost] Deactivated');

      if (this.onDeactivate) {
        this.onDeactivate();
      }

    } catch (error) {
      console.error('[PerformanceBoost] Deactivation error:', error);
    }
  }

  /**
   * Toggle performance boost
   * @returns {boolean} New state
   */
  toggle() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
    return this.isActive;
  }

  /**
   * Pause all CSS animations
   */
  pauseAllAnimations() {
    const animationSelectors = this.adapter.getAnimationSelectors();
    
    for (const selector of animationSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.animationName !== 'none') {
          this.originalStyles.set(el, {
            animationPlayState: el.style.animationPlayState
          });
          el.style.animationPlayState = 'paused';
          this.pausedAnimations.add(el);
        }
      });
    }

    console.log(`[PerformanceBoost] Paused ${this.pausedAnimations.size} animations`);
  }

  /**
   * Restore all paused animations
   */
  restoreAllAnimations() {
    this.pausedAnimations.forEach(el => {
      const original = this.originalStyles.get(el);
      if (original) {
        el.style.animationPlayState = original.animationPlayState || '';
      }
    });
    this.pausedAnimations.clear();
  }

  /**
   * Pause all CSS transitions
   */
  pauseAllTransitions() {
    // This is handled by injected styles
  }

  /**
   * Restore all transitions
   */
  restoreAllTransitions() {
    // Handled by removing injected styles
  }

  /**
   * Optimize reflow by reducing layout thrashing
   */
  optimizeReflow() {
    // Add will-change to frequently changing elements
    const container = this.adapter.getContainer();
    if (container) {
      this.originalStyles.set(container, {
        willChange: container.style.willChange,
        contain: container.style.contain
      });
      container.style.willChange = 'scroll-position';
      container.style.contain = 'layout style';
    }
  }

  /**
   * Reduce GPU load
   */
  reduceGPULoad() {
    const heavySelectors = this.adapter.getHeavyElementSelectors();
    
    for (const selector of heavySelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Store original and apply optimizations
        if (!this.originalStyles.has(el)) {
          this.originalStyles.set(el, {
            filter: el.style.filter,
            boxShadow: el.style.boxShadow,
            transform: el.style.transform
          });
        }
        
        // Reduce complex effects
        if (el.style.filter && el.style.filter.includes('blur')) {
          el.style.filter = 'none';
        }
      });
    }
  }

  /**
   * Inject performance-optimizing CSS
   */
  injectPerformanceStyles() {
    if (this.styleElement) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'dom-optimizer-performance-styles';
    this.styleElement.textContent = `
      /* Performance Boost Styles */
      .dom-optimizer-performance-mode * {
        transition: none !important;
        animation-play-state: paused !important;
      }
      
      .dom-optimizer-performance-mode *::before,
      .dom-optimizer-performance-mode *::after {
        transition: none !important;
        animation-play-state: paused !important;
      }
      
      .dom-optimizer-performance-mode video:not([autoplay]),
      .dom-optimizer-performance-mode iframe {
        content-visibility: auto;
      }
      
      .dom-optimizer-performance-mode img {
        content-visibility: auto;
        contain-intrinsic-size: 300px 200px;
      }
      
      .dom-optimizer-performance-mode [class*="skeleton"],
      .dom-optimizer-performance-mode [class*="loading"],
      .dom-optimizer-performance-mode [class*="shimmer"] {
        animation: none !important;
        background: var(--surface, #333) !important;
      }
      
      /* Reduce paint complexity */
      .dom-optimizer-performance-mode {
        text-rendering: optimizeSpeed;
      }
      
      /* Placeholder styles */
      .dom-optimizer-placeholder {
        background: linear-gradient(90deg, 
          var(--surface, rgba(100,100,100,0.1)) 0%, 
          var(--surface-hover, rgba(100,100,100,0.15)) 50%,
          var(--surface, rgba(100,100,100,0.1)) 100%);
        border-radius: 8px;
        margin: 4px 0;
        opacity: 0.5;
      }
    `;

    document.head.appendChild(this.styleElement);
    document.body.classList.add('dom-optimizer-performance-mode');
  }

  /**
   * Remove performance styles
   */
  removePerformanceStyles() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    document.body.classList.remove('dom-optimizer-performance-mode');
  }

  /**
   * Restore original styles
   */
  restoreOriginalStyles() {
    this.originalStyles.forEach((styles, element) => {
      if (element && element.style) {
        Object.entries(styles).forEach(([prop, value]) => {
          element.style[prop] = value || '';
        });
      }
    });
    this.originalStyles.clear();
  }

  /**
   * Free memory by cleaning up unused resources
   */
  freeMemory() {
    console.log('[PerformanceBoost] Freeing memory...');

    // Clear image sources for offscreen images
    const images = document.querySelectorAll('img');
    let freedImages = 0;

    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const isOffscreen = rect.bottom < -500 || rect.top > window.innerHeight + 500;
      
      if (isOffscreen && img.src && !img.dataset.originalSrc) {
        img.dataset.originalSrc = img.src;
        img.src = '';
        freedImages++;
      }
    });

    // Pause offscreen videos
    const videos = document.querySelectorAll('video');
    let pausedVideos = 0;

    videos.forEach(video => {
      const rect = video.getBoundingClientRect();
      const isOffscreen = rect.bottom < -200 || rect.top > window.innerHeight + 200;
      
      if (isOffscreen && !video.paused) {
        video.pause();
        video.dataset.wasPaused = 'true';
        pausedVideos++;
      }
    });

    console.log(`[PerformanceBoost] Freed ${freedImages} images, paused ${pausedVideos} videos`);

    return {
      freedImages,
      pausedVideos
    };
  }

  /**
   * Restore freed resources
   */
  restoreResources() {
    // Restore images
    const images = document.querySelectorAll('img[data-original-src]');
    images.forEach(img => {
      if (img.dataset.originalSrc) {
        img.src = img.dataset.originalSrc;
        delete img.dataset.originalSrc;
      }
    });

    // Resume videos
    const videos = document.querySelectorAll('video[data-was-paused]');
    videos.forEach(video => {
      delete video.dataset.wasPaused;
      // Don't auto-play, let user control
    });
  }

  /**
   * Get current status
   * @returns {Object}
   */
  getStatus() {
    return {
      isActive: this.isActive,
      pausedAnimations: this.pausedAnimations.size,
      optimizations: {
        animations: this.options.pauseAnimations,
        transitions: this.options.pauseTransitions,
        reflow: this.options.optimizeReflow,
        gpu: this.options.reduceGPULoad
      }
    };
  }

  /**
   * Update options
   * @param {Object} newOptions
   */
  updateOptions(newOptions) {
    const wasActive = this.isActive;
    
    if (wasActive) {
      this.deactivate();
    }
    
    this.options = { ...this.options, ...newOptions };
    
    if (wasActive) {
      this.activate();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.deactivate();
    this.originalStyles.clear();
    this.pausedAnimations.clear();
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.PerformanceBoost = PerformanceBoost;
}

