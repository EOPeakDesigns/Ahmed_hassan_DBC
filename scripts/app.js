/**
 * Main Application Initialization
 */

class TourGuideApp {
  constructor() {
    this.modules = {};
    this.cardLoader = new CardLoader();
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeModules());
    } else {
      this.initializeModules();
    }
  }

  async initializeModules() {
    try {
      this.setupToast();
      await this.cardLoader.load();

      this.modules.clipboardManager = new ClipboardManager(this.cardLoader);
      this.modules.modalManager = new ModalManager(this.cardLoader);
      this.modules.videoHandler = new VideoHandler(this.cardLoader);
      this.modules.socialInteractions = new SocialInteractions();
      this.modules.vcardManager = new VCardManager(this.cardLoader);
      this.modules.shareManager = new ShareManager(this.cardLoader);
      this.modules.pwaManager = new PwaManager(this.cardLoader);

      this.isInitialized = true;
      this.dispatchInitializedEvent();
    } catch (error) {
      console.error('Failed to initialize Tour Guide App:', error);
    }
  }

  setupToast() {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'app-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.setAttribute('aria-atomic', 'true');
      document.body.appendChild(toast);
    }

    window.showToast = (message) => {
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    };
  }

  dispatchInitializedEvent() {
    document.dispatchEvent(
      new CustomEvent('tourGuideAppInitialized', {
        detail: {
          modules: Object.keys(this.modules),
          timestamp: new Date().toISOString()
        }
      })
    );
  }

  getModule(moduleName) {
    return this.modules[moduleName] || null;
  }
}

const app = new TourGuideApp();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TourGuideApp;
}
