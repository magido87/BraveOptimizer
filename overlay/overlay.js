/**
 * Overlay Widget - In-page floating control panel
 * Provides quick access to common actions
 */

class DOMOptimizerOverlay {
  constructor(controller) {
    this.controller = controller;
    this.element = null;
    this.isVisible = true;
    this.isMinimized = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.position = { x: null, y: null };
  }

  /**
   * Initialize overlay
   */
  init() {
    this.createOverlay();
    this.attachEventListeners();
    this.loadPosition();
    console.log('[Overlay] Initialized');
  }

  /**
   * Create overlay DOM structure
   */
  createOverlay() {
    // Create container
    this.element = document.createElement('div');
    this.element.id = 'dom-optimizer-overlay';
    this.element.className = 'dom-optimizer-overlay glass-panel';
    this.element.setAttribute('data-theme', 'ocean');

    this.element.innerHTML = `
      <div class="overlay-header">
        <div class="overlay-drag-handle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="5" r="2"/>
            <circle cx="12" cy="5" r="2"/>
            <circle cx="19" cy="5" r="2"/>
            <circle cx="5" cy="12" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="19" cy="12" r="2"/>
          </svg>
        </div>
        <span class="overlay-title">Optimizer</span>
        <button class="overlay-minimize glass-btn-icon" title="Minimize">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      
      <div class="overlay-content">
        <div class="overlay-stats">
          <div class="stat-item">
            <span class="stat-value" id="overlay-visible">0</span>
            <span class="stat-label">Visible</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value" id="overlay-trimmed">0</span>
            <span class="stat-label">Trimmed</span>
          </div>
        </div>
        
        <div class="overlay-actions">
          <button class="overlay-btn glass-btn" id="overlay-trim" title="Trim DOM (Alt+T)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
            Trim
          </button>
          
          <button class="overlay-btn glass-btn" id="overlay-restore" title="Restore All (Alt+R)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
            Restore
          </button>
        </div>
        
        <div class="overlay-toggles">
          <label class="overlay-toggle glass-tooltip" data-tooltip="Auto-trim when at bottom (Alt+A)">
            <input type="checkbox" id="overlay-auto-toggle">
            <span class="toggle-label">Auto</span>
            <span class="toggle-indicator"></span>
          </label>
          
          <label class="overlay-toggle glass-tooltip" data-tooltip="Performance boost (Alt+P)">
            <input type="checkbox" id="overlay-perf-toggle">
            <span class="toggle-label">Boost</span>
            <span class="toggle-indicator"></span>
          </label>
        </div>
      </div>
      
      <div class="overlay-minimized">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Minimize button
    const minimizeBtn = this.element.querySelector('.overlay-minimize');
    minimizeBtn.addEventListener('click', () => this.toggleMinimize());

    // Minimized state click
    const minimizedEl = this.element.querySelector('.overlay-minimized');
    minimizedEl.addEventListener('click', () => this.toggleMinimize());

    // Trim button
    const trimBtn = this.element.querySelector('#overlay-trim');
    trimBtn.addEventListener('click', () => this.handleTrim());

    // Restore button
    const restoreBtn = this.element.querySelector('#overlay-restore');
    restoreBtn.addEventListener('click', () => this.handleRestore());

    // Auto toggle
    const autoToggle = this.element.querySelector('#overlay-auto-toggle');
    autoToggle.addEventListener('change', (e) => this.handleAutoToggle(e.target.checked));

    // Performance toggle
    const perfToggle = this.element.querySelector('#overlay-perf-toggle');
    perfToggle.addEventListener('change', (e) => this.handlePerfToggle(e.target.checked));

    // Drag handling
    const dragHandle = this.element.querySelector('.overlay-drag-handle');
    dragHandle.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    // Prevent text selection during drag
    this.element.addEventListener('selectstart', (e) => {
      if (this.isDragging) e.preventDefault();
    });
  }

  /**
   * Handle trim button click
   */
  async handleTrim() {
    const trimBtn = this.element.querySelector('#overlay-trim');
    trimBtn.classList.add('loading');
    
    await this.controller.trim();
    
    trimBtn.classList.remove('loading');
    this.update();
  }

  /**
   * Handle restore button click
   */
  async handleRestore() {
    const restoreBtn = this.element.querySelector('#overlay-restore');
    restoreBtn.classList.add('loading');
    
    await this.controller.restore();
    
    restoreBtn.classList.remove('loading');
    this.update();
  }

  /**
   * Handle auto-trim toggle
   * @param {boolean} enabled
   */
  handleAutoToggle(enabled) {
    this.controller.toggleAutoTrim();
    this.showNotification(enabled ? 'Auto-trim enabled' : 'Auto-trim disabled');
  }

  /**
   * Handle performance boost toggle
   * @param {boolean} enabled
   */
  handlePerfToggle(enabled) {
    this.controller.performanceBoost.toggle();
    this.showNotification(enabled ? 'Performance boost ON' : 'Performance boost OFF');
  }

  /**
   * Update overlay stats and state
   */
  update() {
    if (!this.controller.trimmer) return;

    const status = this.controller.trimmer.getStatus();
    
    // Update stats
    const visibleEl = this.element.querySelector('#overlay-visible');
    const trimmedEl = this.element.querySelector('#overlay-trimmed');
    
    if (visibleEl) visibleEl.textContent = status.visibleMessages;
    if (trimmedEl) trimmedEl.textContent = status.trimmedMessages;

    // Update toggles
    const autoToggle = this.element.querySelector('#overlay-auto-toggle');
    const perfToggle = this.element.querySelector('#overlay-perf-toggle');
    
    if (autoToggle) {
      autoToggle.checked = this.controller.settings.autoTrimEnabled;
    }
    if (perfToggle && this.controller.performanceBoost) {
      perfToggle.checked = this.controller.performanceBoost.isActive;
    }
  }

  /**
   * Toggle minimize state
   */
  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.element.classList.toggle('minimized', this.isMinimized);
  }

  /**
   * Toggle visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    this.element.style.display = this.isVisible ? 'block' : 'none';
  }

  /**
   * Show overlay
   */
  show() {
    this.isVisible = true;
    this.element.style.display = 'block';
  }

  /**
   * Hide overlay
   */
  hide() {
    this.isVisible = false;
    this.element.style.display = 'none';
  }

  /**
   * Start dragging
   * @param {MouseEvent} e
   */
  startDrag(e) {
    this.isDragging = true;
    this.element.classList.add('dragging');
    
    const rect = this.element.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  /**
   * Handle drag movement
   * @param {MouseEvent} e
   */
  onDrag(e) {
    if (!this.isDragging) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    // Constrain to viewport
    const maxX = window.innerWidth - this.element.offsetWidth;
    const maxY = window.innerHeight - this.element.offsetHeight;

    this.position.x = Math.max(0, Math.min(x, maxX));
    this.position.y = Math.max(0, Math.min(y, maxY));

    this.element.style.left = `${this.position.x}px`;
    this.element.style.top = `${this.position.y}px`;
    this.element.style.right = 'auto';
    this.element.style.bottom = 'auto';
  }

  /**
   * End dragging
   */
  endDrag() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.element.classList.remove('dragging');
    this.savePosition();
  }

  /**
   * Save position to storage
   */
  async savePosition() {
    if (this.position.x !== null && this.position.y !== null) {
      await Storage.set('overlayPosition', this.position);
    }
  }

  /**
   * Load position from storage
   */
  async loadPosition() {
    const savedPosition = await Storage.get('overlayPosition');
    if (savedPosition) {
      this.position = savedPosition;
      this.element.style.left = `${this.position.x}px`;
      this.element.style.top = `${this.position.y}px`;
      this.element.style.right = 'auto';
      this.element.style.bottom = 'auto';
    }
  }

  /**
   * Update theme
   * @param {string} theme
   */
  updateTheme(theme) {
    this.element.setAttribute('data-theme', theme);
  }

  /**
   * Show notification
   * @param {string} message
   */
  showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'overlay-notification glass-notification';
    notification.textContent = message;

    this.element.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DOMOptimizerOverlay = DOMOptimizerOverlay;
}

