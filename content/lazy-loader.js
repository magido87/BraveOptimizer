/**
 * Lazy Loader - Handles scroll-based message loading
 * Loads older messages when scrolling up
 */

class LazyLoader {
  constructor(trimmer, adapter, options = {}) {
    this.trimmer = trimmer;
    this.adapter = adapter;
    this.options = {
      enabled: options.enabled ?? CONFIG.lazyLoader.enabled,
      chunkSize: options.chunkSize || CONFIG.lazyLoader.chunkSize,
      scrollThreshold: options.scrollThreshold || CONFIG.lazyLoader.scrollThreshold,
      scrollDebounce: options.scrollDebounce || CONFIG.lazyLoader.scrollDebounce,
      velocityFactor: options.velocityFactor || CONFIG.lazyLoader.velocityFactor,
      bottomThreshold: options.bottomThreshold || CONFIG.lazyLoader.bottomThreshold,
      ...options
    };

    this.isLoading = false;
    this.isPaused = false;
    this.lastScrollTop = 0;
    this.lastScrollTime = Date.now();
    this.scrollVelocity = 0;
    this.scrollHandler = null;
    this.debounceTimer = null;
    this.scrollContainer = null;

    // Callbacks
    this.onLoad = null;
    this.onScrollStateChange = null;
  }

  /**
   * Initialize the lazy loader
   */
  init() {
    if (!this.options.enabled) return;

    this.scrollContainer = this.adapter.getScrollContainer();
    if (!this.scrollContainer) {
      console.warn('[LazyLoader] No scroll container found');
      return;
    }

    this.attachScrollListener();
    console.log('[LazyLoader] Initialized');
  }

  /**
   * Attach scroll event listener
   */
  attachScrollListener() {
    this.scrollHandler = this.handleScroll.bind(this);
    this.scrollContainer.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  /**
   * Handle scroll event
   * @param {Event} event
   */
  handleScroll(_event) {
    if (!this.options.enabled || this.isPaused) return;

    // Clear existing debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Calculate scroll velocity
    const currentScrollTop = this.scrollContainer.scrollTop;
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastScrollTime;

    if (timeDelta > 0) {
      this.scrollVelocity = Math.abs(currentScrollTop - this.lastScrollTop) / timeDelta;
    }

    const isScrollingUp = currentScrollTop < this.lastScrollTop;
    const isNearTop = currentScrollTop < this.options.scrollThreshold;
    const isAtBottom = this.adapter.isAtBottom();

    // Update last values
    this.lastScrollTop = currentScrollTop;
    this.lastScrollTime = currentTime;

    // Debounced scroll handling
    this.debounceTimer = setTimeout(() => {
      this.processScroll(isScrollingUp, isNearTop, isAtBottom);
    }, this.options.scrollDebounce);
  }

  /**
   * Process scroll after debounce
   * @param {boolean} isScrollingUp
   * @param {boolean} isNearTop
   * @param {boolean} isAtBottom
   */
  async processScroll(isScrollingUp, isNearTop, isAtBottom) {
    // If scrolling up and near top, load more messages
    if (isScrollingUp && isNearTop && !this.isLoading) {
      await this.loadMore();
    }

    // If at bottom, notify for potential auto-trim
    if (isAtBottom && this.onScrollStateChange) {
      this.onScrollStateChange({ atBottom: true });
    }
  }

  /**
   * Load more messages
   */
  async loadMore() {
    if (this.isLoading) return;

    const status = this.trimmer.getStatus();
    if (status.trimmedMessages === 0) {
      console.log('[LazyLoader] No more messages to load');
      return;
    }

    this.isLoading = true;

    try {
      // Calculate chunk size based on scroll velocity
      let chunkSize = this.options.chunkSize;
      if (this.scrollVelocity > 1) {
        chunkSize = Math.min(this.options.chunkSize * 2, CONFIG.lazyLoader.maxChunkSize);
      }

      // Preserve scroll position
      const scrollHeight = this.scrollContainer.scrollHeight;
      const scrollTop = this.scrollContainer.scrollTop;

      // Restore messages
      const result = await this.trimmer.restorePartial(chunkSize);

      if (result.success && result.restored > 0) {
        // Adjust scroll position to maintain view
        requestAnimationFrame(() => {
          const newScrollHeight = this.scrollContainer.scrollHeight;
          const heightDiff = newScrollHeight - scrollHeight;
          this.scrollContainer.scrollTop = scrollTop + heightDiff;
        });

        console.log(
          `[LazyLoader] Loaded ${result.restored} messages, ${result.remaining} remaining`
        );

        if (this.onLoad) {
          this.onLoad({
            loaded: result.restored,
            remaining: result.remaining
          });
        }
      }
    } catch (error) {
      console.error('[LazyLoader] Load error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Pause lazy loading
   */
  pause() {
    this.isPaused = true;
    console.log('[LazyLoader] Paused');
  }

  /**
   * Resume lazy loading
   */
  resume() {
    this.isPaused = false;
    console.log('[LazyLoader] Resumed');
  }

  /**
   * Enable/disable lazy loading
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.options.enabled = enabled;
    if (enabled && !this.scrollHandler) {
      this.init();
    }
    console.log(`[LazyLoader] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Update options
   * @param {Object} newOptions
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current status
   * @returns {Object}
   */
  getStatus() {
    return {
      enabled: this.options.enabled,
      isLoading: this.isLoading,
      isPaused: this.isPaused,
      chunkSize: this.options.chunkSize
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.scrollHandler && this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.scrollHandler = null;
    this.scrollContainer = null;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.LazyLoader = LazyLoader;
}
