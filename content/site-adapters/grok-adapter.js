/**
 * Grok Adapter
 * Handles DOM manipulation for grok.x.ai and x.com/i/grok
 */

class GrokAdapter extends BaseAdapter {
  constructor() {
    super();
    this.name = 'Grok';
    this.hostname = ['grok.x.ai', 'x.com'];
    this.selectors = {
      container: '[class*="conversation"], [class*="chat-container"]',
      messages: '[class*="message"], [class*="turn"]',
      userMessage: '[class*="user"], [class*="human"]',
      assistantMessage: '[class*="grok"], [class*="assistant"], [class*="ai"]',
      input: 'textarea, [contenteditable="true"]',
      preserveElements: [
        'textarea',
        '[contenteditable="true"]',
        'nav',
        'header',
        '[role="dialog"]',
        '[class*="input"]',
        '[class*="composer"]'
      ]
    };
  }

  /**
   * Check if current site is Grok
   * @returns {boolean}
   */
  detect() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    return hostname === 'grok.x.ai' || (hostname === 'x.com' && pathname.includes('/i/grok'));
  }

  /**
   * Get the main conversation container
   * @returns {Element|null}
   */
  getContainer() {
    const selectors = [
      '[class*="conversation"]',
      '[class*="chat-container"]',
      '[class*="messages-container"]',
      '[role="main"] [class*="overflow"]',
      'main [class*="scroll"]'
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
      '[class*="message"]',
      '[class*="turn"]',
      '[class*="response"]',
      '[data-testid*="message"]'
    ];

    for (const selector of selectors) {
      const messages = container.querySelectorAll(selector);
      if (messages.length > 0) {
        // Filter out non-message elements
        return Array.from(messages).filter((el) => {
          const text = el.textContent || '';
          return text.length > 10;
        });
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
    const contentDiv =
      messageNode.querySelector('[class*="content"]') ||
      messageNode.querySelector('[class*="text"]') ||
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
    const dataAttrs =
      messageNode.getAttribute('data-role') || messageNode.getAttribute('data-author') || '';

    return className.includes('user') || className.includes('human') || dataAttrs.includes('user');
  }

  /**
   * Check if message is from assistant
   * @param {Element} messageNode
   * @returns {boolean}
   */
  isAssistantMessage(messageNode) {
    const className = messageNode.className || '';
    const dataAttrs =
      messageNode.getAttribute('data-role') || messageNode.getAttribute('data-author') || '';

    return (
      className.includes('grok') ||
      className.includes('assistant') ||
      className.includes('ai') ||
      dataAttrs.includes('grok') ||
      dataAttrs.includes('assistant')
    );
  }

  /**
   * Get Grok-specific animation selectors
   * @returns {Array<string>}
   */
  getAnimationSelectors() {
    return [
      '[class*="typing"]',
      '[class*="streaming"]',
      '[class*="animate"]',
      '[class*="loading"]'
    ];
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.GrokAdapter = GrokAdapter;
}
