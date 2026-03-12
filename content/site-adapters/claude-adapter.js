/**
 * Claude Adapter
 * Handles DOM manipulation for claude.ai
 */

class ClaudeAdapter extends BaseAdapter {
  constructor() {
    super();
    this.name = 'Claude';
    this.hostname = 'claude.ai';
    this.selectors = {
      container: '[class*="conversation-content"]',
      messages:
        '[class*="message-content"], [class*="human-message"], [class*="assistant-message"]',
      userMessage: '[class*="human"], [class*="user"]',
      assistantMessage: '[class*="assistant"], [class*="claude"]',
      input: '[contenteditable="true"], textarea',
      preserveElements: [
        '[contenteditable="true"]',
        'textarea',
        'nav',
        'header',
        '[role="dialog"]',
        '[class*="input"]',
        '[class*="composer"]'
      ]
    };
  }

  /**
   * Check if current site is Claude
   * @returns {boolean}
   */
  detect() {
    return window.location.hostname === 'claude.ai';
  }

  /**
   * Get the main conversation container
   * @returns {Element|null}
   */
  getContainer() {
    const selectors = [
      '[class*="conversation-content"]',
      '[class*="messages-container"]',
      '[class*="chat-messages"]',
      'main [class*="overflow"]',
      '[class*="prose"]'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) return container;
    }

    // Fallback: find main content area
    const main = document.querySelector('main');
    if (main) {
      const scrollable = main.querySelector('[class*="overflow-y"]');
      if (scrollable) return scrollable;
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
      '[class*="message-content"]',
      '[class*="human-message"], [class*="assistant-message"]',
      '[class*="font-claude-message"]',
      '[data-testid*="message"]'
    ];

    for (const selector of selectors) {
      const messages = container.querySelectorAll(selector);
      if (messages.length > 0) {
        return Array.from(messages);
      }
    }

    // Fallback: find divs that look like messages
    const possibleMessages = container.querySelectorAll('div[class*="py-"], div[class*="px-"]');
    return Array.from(possibleMessages).filter((el) => {
      const text = el.textContent || '';
      return text.length > 20 && el.children.length > 0;
    });
  }

  /**
   * Get message content
   * @param {Element} messageNode
   * @returns {string}
   */
  getMessageContent(messageNode) {
    const contentDiv =
      messageNode.querySelector('[class*="prose"]') ||
      messageNode.querySelector('[class*="markdown"]') ||
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
      className.includes('human') ||
      className.includes('user') ||
      messageNode.querySelector('[class*="human"]') !== null
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
      className.includes('assistant') ||
      className.includes('claude') ||
      messageNode.querySelector('[class*="assistant"]') !== null
    );
  }

  /**
   * Get Claude-specific animation selectors
   * @returns {Array<string>}
   */
  getAnimationSelectors() {
    return ['[class*="typing"]', '[class*="streaming"]', '[class*="animate"]', '[class*="pulse"]'];
  }

  /**
   * Get Claude-specific heavy elements
   * @returns {Array<string>}
   */
  getHeavyElementSelectors() {
    return [
      ...super.getHeavyElementSelectors(),
      '[class*="code-block"]',
      'pre code',
      '[class*="artifact"]',
      'svg'
    ];
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ClaudeAdapter = ClaudeAdapter;
}
