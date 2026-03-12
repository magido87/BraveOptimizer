/**
 * DOM Trimmer - Core DOM manipulation engine
 * Virtualizes old messages to improve performance
 */

class DOMTrimmer {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.options = {
      maxMessages: options.maxMessages || CONFIG.trimmer.defaultMaxMessages,
      maxTokens: options.maxTokens || CONFIG.trimmer.defaultMaxTokens,
      trimDelay: options.trimDelay || CONFIG.trimmer.trimDelay,
      restoreChunkSize: options.restoreChunkSize || CONFIG.trimmer.restoreChunkSize,
      restoreDelay: options.restoreDelay || CONFIG.trimmer.restoreDelay,
      ...options
    };

    // Virtual store for trimmed messages
    this.virtualStore = new Map();
    this.trimmedCount = 0;
    this.totalTokensTrimmed = 0;
    this.isRestoring = false;
    this.isTrimming = false;

    // Callbacks
    this.onTrim = null;
    this.onRestore = null;
    this.onError = null;
  }

  /**
   * Initialize the trimmer
   */
  async init() {
    console.log('[DOMTrimmer] Initializing...');
    await this.adapter.init();
  }

  /**
   * Trim DOM to keep only recent messages
   * @param {Object} options - Override options
   * @returns {Object} Trim result
   */
  async trim(options = {}) {
    if (this.isTrimming || this.isRestoring) {
      console.log('[DOMTrimmer] Operation in progress, skipping');
      return { success: false, reason: 'busy' };
    }

    this.isTrimming = true;
    const startTime = performance.now();

    try {
      const maxMessages = options.maxMessages || this.options.maxMessages;
      const messages = this.adapter.getMessageNodes();

      if (messages.length <= maxMessages) {
        console.log('[DOMTrimmer] Nothing to trim');
        this.isTrimming = false;
        return { success: true, trimmed: 0 };
      }

      const toTrim = messages.length - maxMessages;
      const messagesToTrim = messages.slice(0, toTrim);

      let trimmedCount = 0;
      let tokensTrimmed = 0;

      // Batch DOM operations
      const placeholders = [];

      for (let i = 0; i < messagesToTrim.length; i++) {
        const message = messagesToTrim[i];

        // Skip if should be preserved
        if (this.adapter.shouldPreserve(message)) {
          continue;
        }

        const messageId = this.adapter.getMessageId(message, i);
        const tokens = this.adapter.estimateTokens(message);

        // Store in virtual store
        this.virtualStore.set(messageId, {
          node: message.cloneNode(true),
          tokens: tokens,
          index: i,
          timestamp: Date.now()
        });

        // Create placeholder
        const placeholder = this.adapter.createPlaceholder(message);
        placeholder.setAttribute('data-trimmed-id', messageId);
        placeholders.push({ message, placeholder });

        trimmedCount++;
        tokensTrimmed += tokens;
      }

      // Apply DOM changes in batch
      requestAnimationFrame(() => {
        for (const { message, placeholder } of placeholders) {
          if (message.parentNode) {
            message.parentNode.replaceChild(placeholder, message);
          }
        }
      });

      // Wait for next frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      this.trimmedCount += trimmedCount;
      this.totalTokensTrimmed += tokensTrimmed;

      const duration = performance.now() - startTime;
      console.log(
        `[DOMTrimmer] Trimmed ${trimmedCount} messages (${tokensTrimmed} tokens) in ${duration.toFixed(2)}ms`
      );

      // Trigger callback
      if (this.onTrim) {
        this.onTrim({
          trimmed: trimmedCount,
          tokens: tokensTrimmed,
          total: this.trimmedCount,
          duration
        });
      }

      this.isTrimming = false;
      return {
        success: true,
        trimmed: trimmedCount,
        tokens: tokensTrimmed,
        duration
      };
    } catch (error) {
      console.error('[DOMTrimmer] Trim error:', error);
      if (this.onError) this.onError(error);
      this.isTrimming = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore all trimmed messages
   * @returns {Object} Restore result
   */
  async restoreAll() {
    if (this.isRestoring || this.isTrimming) {
      console.log('[DOMTrimmer] Operation in progress, skipping');
      return { success: false, reason: 'busy' };
    }

    if (this.virtualStore.size === 0) {
      console.log('[DOMTrimmer] Nothing to restore');
      return { success: true, restored: 0 };
    }

    this.isRestoring = true;
    const startTime = performance.now();

    try {
      const placeholders = document.querySelectorAll('.dom-optimizer-placeholder[data-trimmed-id]');
      let restoredCount = 0;

      // Restore in chunks to prevent UI freeze
      const chunks = this.chunkArray(Array.from(placeholders), this.options.restoreChunkSize);

      for (const chunk of chunks) {
        await this.restoreChunk(chunk);
        restoredCount += chunk.length;

        // Small delay between chunks
        await new Promise((resolve) => setTimeout(resolve, this.options.restoreDelay));
      }

      // Clear virtual store
      this.virtualStore.clear();
      this.trimmedCount = 0;
      this.totalTokensTrimmed = 0;

      const duration = performance.now() - startTime;
      console.log(`[DOMTrimmer] Restored ${restoredCount} messages in ${duration.toFixed(2)}ms`);

      // Trigger callback
      if (this.onRestore) {
        this.onRestore({
          restored: restoredCount,
          duration
        });
      }

      this.isRestoring = false;
      return {
        success: true,
        restored: restoredCount,
        duration
      };
    } catch (error) {
      console.error('[DOMTrimmer] Restore error:', error);
      if (this.onError) this.onError(error);
      this.isRestoring = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore a chunk of messages
   * @param {Array} placeholders - Placeholder elements
   */
  async restoreChunk(placeholders) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        for (const placeholder of placeholders) {
          const messageId = placeholder.getAttribute('data-trimmed-id');
          const stored = this.virtualStore.get(messageId);

          if (stored) {
            const restored = stored.node?.cloneNode(true);

            if (restored && placeholder.parentNode) {
              placeholder.parentNode.replaceChild(restored, placeholder);
            }

            this.virtualStore.delete(messageId);
          }
        }
        resolve();
      });
    });
  }

  /**
   * Restore specific number of messages (for lazy loading)
   * @param {number} count - Number of messages to restore
   * @returns {Object} Restore result
   */
  async restorePartial(count) {
    if (this.isRestoring || this.virtualStore.size === 0) {
      return { success: false, restored: 0 };
    }

    this.isRestoring = true;

    try {
      const placeholders = document.querySelectorAll('.dom-optimizer-placeholder[data-trimmed-id]');
      const toRestore = Array.from(placeholders).slice(-count);

      await this.restoreChunk(toRestore);

      return {
        success: true,
        restored: toRestore.length,
        remaining: this.virtualStore.size
      };
    } catch (error) {
      console.error('[DOMTrimmer] Partial restore error:', error);
      return { success: false, error: error.message };
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * Get current trim status
   * @returns {Object}
   */
  getStatus() {
    const messages = this.adapter.getMessageNodes();
    return {
      visibleMessages: messages.length,
      trimmedMessages: this.virtualStore.size,
      totalMessages: messages.length + this.virtualStore.size,
      trimmedTokens: this.totalTokensTrimmed,
      isTrimming: this.isTrimming,
      isRestoring: this.isRestoring,
      maxMessages: this.options.maxMessages
    };
  }

  /**
   * Update options
   * @param {Object} newOptions
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Helper to chunk array
   * @param {Array} array
   * @param {number} size
   * @returns {Array}
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.virtualStore.clear();
    this.trimmedCount = 0;
    this.totalTokensTrimmed = 0;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DOMTrimmer = DOMTrimmer;
}
