/**
 * Modal Manager Module
 * Handles QR code modal functionality with accessibility features
 * 
 * @author EOPeak Development Team
 * @version 1.0.0
 */

class ModalManager {
  constructor(cardLoader) {
    this.cardLoader = cardLoader;
    this.modalOverlay = null;
    this.qrButton = null;
    this.modalClose = null;
    this.downloadBtn = null;
    this.qrImage = null;
    this.previouslyFocused = null;
    this.openPointerType = 'mouse';
    this.init();
  }

  /**
   * Initialize modal functionality
   */
  init() {
    this.cacheElements();
    this.bindEvents();
  }

  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    this.modalOverlay = document.querySelector('.qr-modal-overlay') || document.querySelector('.modal-overlay');
    this.qrButton = document.querySelector('.qr-icon');
    this.modalClose = this.modalOverlay?.querySelector('.modal-close') || null;
    this.downloadBtn = this.modalOverlay?.querySelector('.download-btn') || null;
    this.qrImage = this.modalOverlay?.querySelector('.modal-qr-image') || null;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (this.qrButton) {
      this.qrButton.addEventListener('click', (event) => {
        this.openPointerType = InteractionUtils.trackPointerType(event);
        this.showModal();
      });
    }

    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeModal());
    }

    if (this.downloadBtn) {
      this.downloadBtn.addEventListener('click', () => this.downloadQRCode());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => this.handleOverlayClick(e));
    }

    // Escape key handler
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  /**
   * Show modal with accessibility features
   */
  showModal() {
    if (!this.modalOverlay) return;

    // Store currently focused element
    this.previouslyFocused = document.activeElement;

    // Show modal
    this.modalOverlay.classList.add('active');
    this.modalOverlay.setAttribute('aria-hidden', 'false');

    // Focus the close button for accessibility
    if (this.modalClose) {
      this.modalClose.focus();
    }

    InteractionUtils.lockScroll();
  }

  /**
   * Close modal and restore focus
   */
  closeModal() {
    if (!this.modalOverlay) return;

    this.modalOverlay.classList.remove('active');
    this.modalOverlay.setAttribute('aria-hidden', 'true');

    InteractionUtils.unlockScroll();

    InteractionUtils.restoreFocusOnClose(this.previouslyFocused, this.openPointerType);
    if (this.qrButton) {
      InteractionUtils.releaseControl(this.qrButton);
    }
    this.previouslyFocused = null;
  }

  /**
   * Handle overlay click (close when clicking outside modal)
   * @param {Event} event - Click event
   */
  handleOverlayClick(event) {
    if (event.target === this.modalOverlay) {
      this.closeModal();
    }
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    if (!this.modalOverlay) return;

    if (event.key === 'Escape' && this.modalOverlay.classList.contains('active')) {
      this.closeModal();
      return;
    }

    if (event.key === 'Tab' && this.modalOverlay.classList.contains('active')) {
      this.trapFocus(event);
    }
  }

  /**
   * Trap focus within modal for accessibility
   * @param {KeyboardEvent} event - Tab key event
   */
  trapFocus(event) {
    const focusableElements = this.modalOverlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * Download QR code image with 1-second disable feedback
   */
  downloadQRCode() {
    if (!this.qrImage || !this.downloadBtn) return;

    // Store original text
    const originalText = this.downloadBtn.textContent;
    const downloadingLabel = this.cardLoader?.getData()?.labels?.downloading || 'Downloading...';
    
    this.downloadBtn.disabled = true;
    this.downloadBtn.textContent = downloadingLabel;
    
    // Create download link
    const link = document.createElement('a');
    link.href = this.qrImage.src;
    link.download = this.cardLoader?.getData()?.qr?.downloadName || 'ahmed-hassan-qr-code.png';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Re-enable button after 1 second
    setTimeout(() => {
      this.downloadBtn.disabled = false;
      this.downloadBtn.textContent = originalText;
    }, 1000);
  }

  /**
   * Destroy modal manager (cleanup)
   */
  destroy() {
    InteractionUtils.unlockScroll();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalManager;
}
