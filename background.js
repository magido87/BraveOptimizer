/**
 * Background Service Worker
 * Handles extension lifecycle and cross-tab communication
 */

// Extension state
const extensionState = {
  activeTabs: new Map(),
  settings: null,
  listenersRegistered: false
};

/**
 * Initialize extension
 */
async function initExtension() {
  console.log('[Background] Initializing...');

  // Load settings
  const { domOptimizer_settings: settings = null } =
    await chrome.storage.local.get('domOptimizer_settings');
  extensionState.settings = settings;

  // Set up listeners
  setupListeners();

  console.log('[Background] Initialized');
}

/**
 * Set up event listeners
 */
function setupListeners() {
  if (extensionState.listenersRegistered) {
    return;
  }

  // Listen for messages from content scripts and popup
  chrome.runtime.onMessage.addListener(handleMessage);

  // Listen for tab updates
  chrome.tabs.onUpdated.addListener(handleTabUpdate);

  // Listen for tab removal
  chrome.tabs.onRemoved.addListener(handleTabRemove);

  // Listen for tab activation
  chrome.tabs.onActivated.addListener(handleTabActivate);

  // Listen for storage changes
  chrome.storage.onChanged.addListener(handleStorageChange);

  extensionState.listenersRegistered = true;
}

/**
 * Handle incoming messages
 * @param {Object} message
 * @param {Object} sender
 * @param {Function} sendResponse
 */
function handleMessage(message, sender, sendResponse) {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'contentEvent': {
      handleContentEvent(message, tabId);
      sendResponse({ received: true });
      break;
    }

    case 'getTabStatus': {
      const status = extensionState.activeTabs.get(message.tabId || tabId);
      sendResponse(status || { initialized: false });
      break;
    }

    case 'getAllTabsStatus': {
      const allStatus = {};
      extensionState.activeTabs.forEach((value, key) => {
        allStatus[key] = value;
      });
      sendResponse(allStatus);
      break;
    }

    case 'executeInTab':
      executeInTab(message.tabId, message.action, message.options)
        .then(sendResponse)
        .catch((error) => sendResponse({ error: error.message }));
      return true; // Keep channel open for async

    case 'updateBadge':
      updateBadge(tabId, message.data);
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true;
}

/**
 * Handle content script events
 * @param {Object} message
 * @param {number} tabId
 */
function handleContentEvent(message, tabId) {
  const { event, data } = message;

  switch (event) {
    case 'initialized': {
      extensionState.activeTabs.set(tabId, {
        initialized: true,
        site: data.site,
        supported: data.supported,
        timestamp: Date.now()
      });
      updateBadge(tabId, { status: 'ready' });
      break;
    }

    case 'trimmed': {
      const tabState = extensionState.activeTabs.get(tabId) || {};
      tabState.lastTrim = Date.now();
      tabState.trimmedCount = (tabState.trimmedCount || 0) + data.trimmed;
      extensionState.activeTabs.set(tabId, tabState);
      updateBadge(tabId, { trimmed: data.trimmed });
      break;
    }

    case 'restored':
      updateBadge(tabId, { status: 'restored' });
      break;

    case 'performanceBoostActivated':
      updateBadge(tabId, { status: 'boost' });
      break;

    case 'performanceBoostDeactivated':
      updateBadge(tabId, { status: 'ready' });
      break;
  }
}

/**
 * Handle tab updates
 * @param {number} tabId
 * @param {Object} changeInfo
 * @param {Object} tab
 */
function handleTabUpdate(tabId, changeInfo, _tab) {
  if (changeInfo.status === 'loading') {
    // Reset tab state on navigation
    extensionState.activeTabs.delete(tabId);
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

/**
 * Handle tab removal
 * @param {number} tabId
 */
function handleTabRemove(tabId) {
  extensionState.activeTabs.delete(tabId);
}

/**
 * Handle tab activation
 * @param {Object} activeInfo
 */
function handleTabActivate(activeInfo) {
  const { tabId } = activeInfo;
  const tabState = extensionState.activeTabs.get(tabId);

  // Update badge for active tab
  if (tabState?.initialized) {
    updateBadge(tabId, { status: 'ready' });
  }
}

/**
 * Handle storage changes
 * @param {Object} changes
 * @param {string} areaName
 */
function handleStorageChange(changes, areaName) {
  if (areaName === 'local' && changes.domOptimizer_settings) {
    extensionState.settings = changes.domOptimizer_settings.newValue;

    // Notify all active tabs of settings change
    extensionState.activeTabs.forEach((state, tabId) => {
      if (state.initialized) {
        chrome.tabs
          .sendMessage(tabId, {
            action: 'settingsUpdated',
            settings: extensionState.settings
          })
          .catch(() => {
            // Tab may have been closed
            extensionState.activeTabs.delete(tabId);
          });
      }
    });
  }
}

/**
 * Execute action in specific tab
 * @param {number} tabId
 * @param {string} action
 * @param {Object} options
 */
async function executeInTab(tabId, action, options = {}) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action,
      options
    });
    return response;
  } catch (error) {
    console.error(`[Background] Execute in tab ${tabId} failed:`, error);
    throw error;
  }
}

/**
 * Update extension badge
 * @param {number} tabId
 * @param {Object} data
 */
function updateBadge(tabId, data) {
  if (!tabId) return;

  let text = '';
  let color = '#2dd4bf'; // Default teal

  if (data.trimmed) {
    text = data.trimmed.toString();
    color = '#48bb78'; // Green
  } else if (data.status) {
    switch (data.status) {
      case 'ready':
        text = '✓';
        color = '#2dd4bf';
        break;
      case 'boost':
        text = '⚡';
        color = '#f6e05e';
        break;
      case 'restored':
        text = '↺';
        color = '#63b3ed';
        break;
    }
  }

  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

// Initialize on install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed/updated:', details.reason);
  initExtension();

  // Set default settings on first install
  if (details.reason === 'install') {
    chrome.storage.local.set({
      domOptimizer_settings: {
        maxMessages: 50,
        maxTokens: 3000,
        autoTrimEnabled: false,
        lazyLoadEnabled: true,
        showOverlay: true,
        theme: 'ocean',
        hotkeysEnabled: true
      }
    });
  }
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[Background] Extension started');
  initExtension();
});

// Initialize immediately
initExtension();
