/**
 * Clipboard Manager Module
 * Handles copy-to-clipboard functionality with visual feedback
 * 
 * @author EOPeak Development Team
 * @version 1.0.0
 */

class ClipboardManager {
  constructor(cardLoader) {
    this.cardLoader = cardLoader;
    this.copyElements = null;
    this.init();
  }

  /**
   * Initialize clipboard functionality
   */
  init() {
    this.copyElements = document.querySelectorAll('[data-copy]');
    this.bindEvents();
  }

  /**
   * Bind click events to copy elements
   */
  bindEvents() {
    this.copyElements.forEach(element => {
      element.addEventListener('click', (e) => this.handleCopy(e));
    });
  }

  /**
   * Handle copy to clipboard action with enhanced feedback
   * @param {Event} event - Click event
   */
  async handleCopy(event) {
    const element = event.target;
    
    // Handle icon clicks - find the parent copy button
    let copyButton = element;
    let textToCopy = element.getAttribute('data-copy');
    
    // If clicked element is an icon, find the parent copy button
    if (element.tagName === 'I' && element.closest('.copy-btn')) {
      copyButton = element.closest('.copy-btn');
      textToCopy = copyButton.getAttribute('data-copy');
    }
    
    const tooltip = copyButton.nextElementSibling;

    // Check if it's a copy button with enhanced feedback
    if (copyButton.classList.contains('copy-btn')) {
      await this.handleCopyButtonFeedback(copyButton, textToCopy);
    } else {
      // Original tooltip functionality for other elements
      try {
        // Use modern Clipboard API
        await navigator.clipboard.writeText(textToCopy);
        this.showTooltip(tooltip);
      } catch (error) {
        console.error('Could not copy text: ', error);
        // Fallback for older browsers
        this.fallbackCopy(textToCopy, tooltip);
      }
    }
  }

  /**
   * Handle copy button feedback with checkmark and 1-second disable
   * @param {HTMLElement} button - Copy button element
   * @param {string} textToCopy - Text to copy
   */
  async handleCopyButtonFeedback(button, textToCopy) {
    const originalText = button.innerHTML;
    const copyIcon = button.querySelector('.fa-copy');
    
    try {
      // Disable button and show feedback
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
      
      // Use modern Clipboard API
      await navigator.clipboard.writeText(textToCopy);
      this.announceCopied();
      
      // Re-enable button after 1 second
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = originalText;
      }, 1000);
      
    } catch (error) {
      console.error('Could not copy text: ', error);
      
      // Fallback for older browsers
      const success = this.fallbackCopyToClipboard(textToCopy);
      
      if (success) {
        this.announceCopied();
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
        
        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = originalText;
        }, 1000);
      } else {
        this.announceCopyFailed();
        button.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
        
        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = originalText;
        }, 1000);
      }
    }
  }

  /**
   * Show tooltip feedback
   * @param {HTMLElement} tooltip - Tooltip element
   */
  showTooltip(tooltip) {
    if (!tooltip) return;
    
    tooltip.classList.add('show');
    
    // Auto-hide tooltip after 2 seconds
    setTimeout(() => {
      tooltip.classList.remove('show');
    }, 2000);
  }

  /**
   * Fallback copy method for older browsers
   * @param {string} text - Text to copy
   * @param {HTMLElement} tooltip - Tooltip element
   */
  fallbackCopy(text, tooltip) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showTooltip(tooltip);
    } catch (error) {
      console.error('Fallback copy failed: ', error);
    }

    document.body.removeChild(textArea);
  }

  /**
   * Fallback copy method for copy buttons (returns success boolean)
   * @param {string} text - Text to copy
   * @returns {boolean} - Success status
   */
  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (error) {
      console.error('Fallback copy failed: ', error);
      document.body.removeChild(textArea);
      return false;
    }
  }

  /**
   * Reinitialize clipboard manager (useful for dynamic content)
   */
  reinitialize() {
    this.copyElements = document.querySelectorAll('[data-copy]');
    this.bindEvents();
  }

  announceCopied() {
    const message = this.cardLoader?.getData()?.labels?.copied || 'Copied to clipboard';
    if (window.showToast) window.showToast(message);
  }

  announceCopyFailed() {
    const message = this.cardLoader?.getData()?.labels?.copyFailed || 'Could not copy';
    if (window.showToast) window.showToast(message);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ClipboardManager;
}
