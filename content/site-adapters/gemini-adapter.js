/**
 * Gemini Adapter
 * Handles DOM manipulation for gemini.google.com
 */

class GeminiAdapter extends BaseAdapter {
  constructor() {
    super();
    this.name = 'Gemini';
    this.hostname = ['gemini.google.com'];
    this.selectors = {
      container: '[class*="conversation"], [class*="chat-history"]',
      messages: '[class*="message-content"], [class*="query-content"], [class*="response-content"]',
      userMessage: '[class*="query"], [class*="user"]',
      assistantMessage: '[class*="response"], [class*="model"]',
      input: 'textarea, [contenteditable="true"], rich-textarea',
      preserveElements: [
        'textarea',
        '[contenteditable="true"]',
        'rich-textarea',
        'nav',
        'header',
        '[role="dialog"]',
        '[class*="input"]',
        '[class*="prompt"]'
      ]
    };
  }

  /**
   * Check if current site is Gemini
   * @returns {boolean}
   */
  detect() {
    const hostname = window.location.hostname;
    return hostname === 'gemini.google.com';
  }

  /**
   * Get the main conversation container
   * @returns {Element|null}
   */
  getContainer() {
    const selectors = [
      '[class*="conversation"]',
      '[class*="chat-history"]',
      '[class*="response-container"]',
      'main [class*="overflow"]',
      '[class*="scroll-container"]'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) return container;
    }

    // Try to find by data attributes
    const dataContainer = document.querySelector('[data-test-id*="conversation"]');
    if (dataContainer) return dataContainer;

    return null;
  }

  /**
   * Get all message nodes
   * @returns {Array<Element>}
   */
  getMessageNodes() {
    const container = this.getContainer();
    if (!container) return [];

    const selectors = [
      '[class*="message-content"]',
      '[class*="query-content"], [class*="response-content"]',
      '[class*="turn"]',
      '[class*="conversation-turn"]'
    ];

    for (const selector of selectors) {
      const messages = container.querySelectorAll(selector);
      if (messages.length > 0) {
        return Array.from(messages);
      }
    }

    return [];
  }

  /**
   * Get message content
   * @param {Element} messageNode
   * @returns {string}
   */
  getMessageContent(messageNode) {
    // Gemini uses specific content containers
    const contentDiv =
      messageNode.querySelector('[class*="markdown"]') ||
      messageNode.querySelector('[class*="message-text"]') ||
      messageNode.querySelector('[class*="content"]') ||
      messageNode;

    return contentDiv.textContent || '';
  }

  /**
   * Check if message is from user
   * @param {Element} messageNode
   * @returns {boolean}
   */
  isUserMessage(messageNode) {
    const className = messageNode.className || '';
    const dataAttrs = messageNode.getAttribute('data-role') || '';

    return className.includes('query') || className.includes('user') || dataAttrs.includes('user');
  }

  /**
   * Check if message is from assistant
   * @param {Element} messageNode
   * @returns {boolean}
   */
  isAssistantMessage(messageNode) {
    const className = messageNode.className || '';
    const dataAttrs = messageNode.getAttribute('data-role') || '';

    return (
      className.includes('response') ||
      className.includes('model') ||
      className.includes('assistant') ||
      dataAttrs.includes('model')
    );
  }

  /**
   * Get Gemini-specific animation selectors
   * @returns {Array<string>}
   */
  getAnimationSelectors() {
    return [
      '[class*="typing"]',
      '[class*="loading"]',
      '[class*="streaming"]',
      '[class*="animate"]',
      '[class*="thinking"]',
      'mat-progress-spinner'
    ];
  }

  /**
   * Get Gemini-specific heavy elements
   * @returns {Array<string>}
   */
  getHeavyElementSelectors() {
    return [
      ...super.getHeavyElementSelectors(),
      '[class*="code-block"]',
      '[class*="image-container"]',
      'mat-icon',
      'svg'
    ];
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.GeminiAdapter = GeminiAdapter;
}
