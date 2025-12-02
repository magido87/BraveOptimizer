/**
 * Base Adapter - Abstract base class for all site adapters
 * Provides common interface and utility methods
 */

class BaseAdapter {
  constructor() {
    this.name = 'base';
    this.hostname = '';
    this.selectors = {
      container: null,
      messages: null,
      userMessage: null,
      assistantMessage: null,
      input: null,
      preserveElements: []
    };
    this.isInitialized = false;
  }

  /**
   * Check if this adapter matches the current site
   * @returns {boolean}
   */
  detect() {
    return false;
  }

  /**
   * Initialize the adapter
   * @returns {Promise<boolean>}
   */
  async init() {
    if (this.isInitialized) return true;
    
    try {
      await this.waitForContainer();
      this.isInitialized = true;
      console.log(`[${this.name}Adapter] Initialized`);
      return true;
    } catch (error) {
      console.error(`[${this.name}Adapter] Init failed:`, error);
      return false;
    }
  }

  /**
   * Wait for the main container to be available
   * @param {number} timeout - Max wait time in ms
   * @returns {Promise<Element>}
   */
  waitForContainer(timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        const container = this.getContainer();
        if (container) {
          resolve(container);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error('Container not found'));
          return;
        }
        
        requestAnimationFrame(check);
      };
      
      check();
    });
  }

  /**
   * Get the main conversation container
   * @returns {Element|null}
   */
  getContainer() {
    if (!this.selectors.container) return null;
    return document.querySelector(this.selectors.container);
  }

  /**
   * Get all message nodes
   * @returns {NodeList|Array}
   */
  getMessageNodes() {
    if (!this.selectors.messages) return [];
    const container = this.getContainer();
    if (!container) return [];
    return container.querySelectorAll(this.selectors.messages);
  }

  /**
   * Get message content/text
   * @param {Element} messageNode
   * @returns {string}
   */
  getMessageContent(messageNode) {
    return messageNode.textContent || '';
  }

  /**
   * Estimate token count for a message
   * @param {Element} messageNode
   * @returns {number}
   */
  estimateTokens(messageNode) {
    const content = this.getMessageContent(messageNode);
    // Rough estimate: ~4 chars per token
    return Math.ceil(content.length / 4);
  }

  /**
   * Check if message is from user
   * @param {Element} messageNode
   * @returns {boolean}
   */
  isUserMessage(messageNode) {
    if (!this.selectors.userMessage) return false;
    return messageNode.matches(this.selectors.userMessage) || 
           messageNode.querySelector(this.selectors.userMessage) !== null;
  }

  /**
   * Check if message is from assistant
   * @param {Element} messageNode
   * @returns {boolean}
   */
  isAssistantMessage(messageNode) {
    if (!this.selectors.assistantMessage) return false;
    return messageNode.matches(this.selectors.assistantMessage) || 
           messageNode.querySelector(this.selectors.assistantMessage) !== null;
  }

  /**
   * Get elements that should never be trimmed
   * @returns {Array<Element>}
   */
  getPreserveElements() {
    const elements = [];
    for (const selector of this.selectors.preserveElements) {
      const found = document.querySelectorAll(selector);
      elements.push(...found);
    }
    return elements;
  }

  /**
   * Check if element should be preserved
   * @param {Element} element
   * @returns {boolean}
   */
  shouldPreserve(element) {
    const preserveElements = this.getPreserveElements();
    return preserveElements.some(pe => pe === element || pe.contains(element) || element.contains(pe));
  }

  /**
   * Get scroll container
   * @returns {Element}
   */
  getScrollContainer() {
    return this.getContainer() || document.documentElement;
  }

  /**
   * Check if scrolled to bottom
   * @returns {boolean}
   */
  isAtBottom() {
    const container = this.getScrollContainer();
    if (!container) return true;
    
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom() {
    const container = this.getScrollContainer();
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  /**
   * Get message unique identifier
   * @param {Element} messageNode
   * @param {number} index
   * @returns {string}
   */
  getMessageId(messageNode, index) {
    return messageNode.getAttribute('data-message-id') || 
           messageNode.id || 
           `msg-${index}-${Date.now()}`;
  }

  /**
   * Create placeholder for trimmed message
   * @param {Element} messageNode
   * @returns {Element}
   */
  createPlaceholder(messageNode) {
    const placeholder = document.createElement('div');
    placeholder.className = 'dom-optimizer-placeholder';
    placeholder.setAttribute('data-original-height', messageNode.offsetHeight);
    placeholder.style.height = `${messageNode.offsetHeight}px`;
    placeholder.style.minHeight = '20px';
    return placeholder;
  }

  /**
   * Get site-specific CSS animations to pause
   * @returns {Array<string>}
   */
  getAnimationSelectors() {
    return ['*'];
  }

  /**
   * Get site-specific heavy elements
   * @returns {Array<string>}
   */
  getHeavyElementSelectors() {
    return [
      'video',
      'iframe',
      'canvas',
      'img[src*="gif"]',
      '[style*="animation"]'
    ];
  }

  /**
   * Cleanup when adapter is destroyed
   */
  destroy() {
    this.isInitialized = false;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.BaseAdapter = BaseAdapter;
}

