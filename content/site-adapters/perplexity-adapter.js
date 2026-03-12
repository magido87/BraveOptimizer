/**
 * Perplexity Adapter
 * Handles DOM manipulation for perplexity.ai
 */

class PerplexityAdapter extends BaseAdapter {
  constructor() {
    super();
    this.name = 'Perplexity';
    this.hostname = 'www.perplexity.ai';
    this.selectors = {
      container: '[class*="conversation"], main [class*="overflow"]',
      messages: '[class*="message"], [class*="answer"], [class*="query"]',
      userMessage: '[class*="query"], [class*="user"], [class*="question"]',
      assistantMessage: '[class*="answer"], [class*="response"], [class*="assistant"]',
      input: 'textarea, [contenteditable="true"]',
      preserveElements: [
        'textarea',
        '[contenteditable="true"]',
        'nav',
        'header',
        '[role="dialog"]',
        '[class*="search"]',
        '[class*="input"]'
      ]
    };
  }

  /**
   * Check if current site is Perplexity
   * @returns {boolean}
   */
  detect() {
    return (
      window.location.hostname === 'www.perplexity.ai' ||
      window.location.hostname === 'perplexity.ai'
    );
  }

  /**
   * Get the main conversation container
   * @returns {Element|null}
   */
  getContainer() {
    const selectors = [
      '[class*="conversation"]',
      '[class*="thread"]',
      '[class*="answers"]',
      'main [class*="overflow-y"]',
      '[class*="results"]'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) return container;
    }

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
      '[class*="answer-block"]',
      '[class*="query-block"]',
      '[class*="message"]',
      '[class*="turn"]'
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
    // Perplexity has sources and main content
    const contentDiv =
      messageNode.querySelector('[class*="prose"]') ||
      messageNode.querySelector('[class*="markdown"]') ||
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
    return (
      className.includes('query') || className.includes('question') || className.includes('user')
    );
  }

  /**
   * Check if message is from assistant
   * @param {Element} messageNode
   * @returns {boolean}
   */
  isAssistantMessage(messageNode) {
    const className = messageNode.className || '';
    return (
      className.includes('answer') ||
      className.includes('response') ||
      className.includes('assistant')
    );
  }

  /**
   * Get Perplexity-specific animation selectors
   * @returns {Array<string>}
   */
  getAnimationSelectors() {
    return [
      '[class*="typing"]',
      '[class*="loading"]',
      '[class*="streaming"]',
      '[class*="animate"]',
      '[class*="skeleton"]'
    ];
  }

  /**
   * Get Perplexity-specific heavy elements
   * @returns {Array<string>}
   */
  getHeavyElementSelectors() {
    return [
      ...super.getHeavyElementSelectors(),
      '[class*="source"]',
      '[class*="citation"]',
      '[class*="image"]',
      'iframe'
    ];
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.PerplexityAdapter = PerplexityAdapter;
}
