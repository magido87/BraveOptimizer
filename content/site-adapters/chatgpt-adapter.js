/**
 * ChatGPT Adapter
 * Handles DOM manipulation for chat.openai.com and chatgpt.com
 */

class ChatGPTAdapter extends BaseAdapter {
  constructor() {
    super();
    this.name = 'ChatGPT';
    this.hostname = ['chat.openai.com', 'chatgpt.com'];
    this.selectors = {
      container: 'main [class*="react-scroll-to-bottom"]',
      messages: '[data-message-author-role]',
      userMessage: '[data-message-author-role="user"]',
      assistantMessage: '[data-message-author-role="assistant"]',
      input: '#prompt-textarea',
      preserveElements: [
        '#prompt-textarea',
        'form',
        'nav',
        'header',
        '[role="dialog"]',
        '[class*="sticky"]'
      ]
    };
  }

  /**
   * Check if current site is ChatGPT
   * @returns {boolean}
   */
  detect() {
    const hostname = window.location.hostname;
    return hostname === 'chat.openai.com' || hostname === 'chatgpt.com';
  }

  /**
   * Get the main conversation container
   * @returns {Element|null}
   */
  getContainer() {
    // Try multiple selectors for different ChatGPT versions
    const selectors = [
      'main [class*="react-scroll-to-bottom"]',
      '[class*="react-scroll-to-bottom--css"]',
      'main .overflow-y-auto',
      'main [class*="overflow"]'
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

    // Try multiple selectors
    const selectors = [
      '[data-message-author-role]',
      '[class*="group/conversation-turn"]',
      '[class*="text-base"]'
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
    // Find the actual content div
    const contentDiv = messageNode.querySelector('[class*="markdown"]') ||
                       messageNode.querySelector('[class*="prose"]') ||
                       messageNode.querySelector('.whitespace-pre-wrap');
    
    return contentDiv ? contentDiv.textContent : messageNode.textContent || '';
  }

  /**
   * Check if message is from user
   * @param {Element} messageNode
   * @returns {boolean}
   */
  isUserMessage(messageNode) {
    return messageNode.getAttribute('data-message-author-role') === 'user' ||
           messageNode.querySelector('[data-message-author-role="user"]') !== null;
  }

  /**
   * Check if message is from assistant
   * @param {Element} messageNode
   * @returns {boolean}
   */
  isAssistantMessage(messageNode) {
    return messageNode.getAttribute('data-message-author-role') === 'assistant' ||
           messageNode.querySelector('[data-message-author-role="assistant"]') !== null;
  }

  /**
   * Get scroll container for ChatGPT
   * @returns {Element}
   */
  getScrollContainer() {
    const container = this.getContainer();
    if (container) {
      // Find the actual scrollable element
      const scrollable = container.querySelector('[class*="overflow-y-auto"]') ||
                        container.closest('[class*="overflow-y-auto"]') ||
                        container;
      return scrollable;
    }
    return document.documentElement;
  }

  /**
   * Get ChatGPT-specific animation selectors
   * @returns {Array<string>}
   */
  getAnimationSelectors() {
    return [
      '[class*="result-streaming"]',
      '[class*="animate"]',
      '.cursor-blink',
      '[class*="typing"]'
    ];
  }

  /**
   * Get ChatGPT-specific heavy elements
   * @returns {Array<string>}
   */
  getHeavyElementSelectors() {
    return [
      ...super.getHeavyElementSelectors(),
      '[class*="code-block"]',
      'pre code',
      '[class*="katex"]',
      'svg'
    ];
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ChatGPTAdapter = ChatGPTAdapter;
}

