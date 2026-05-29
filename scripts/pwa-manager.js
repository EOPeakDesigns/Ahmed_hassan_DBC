/**
 * PWA Manager - Service worker registration and install prompt UX
 */

class PwaManager {
  constructor(cardLoader) {
    this.cardLoader = cardLoader;
    this.deferredPrompt = null;
    this.banner = null;
    this.installBtn = null;
    this.dismissBtn = null;
    this.storageKey = 'tour-guide-install-dismissed';
    this.init();
  }

  init() {
    this.banner = document.querySelector('.install-banner');
    this.installBtn = document.querySelector('[data-action="install-app"]');
    this.dismissBtn = document.querySelector('[data-action="dismiss-install"]');

    if (this.isStandalone()) return;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.maybeShowBanner();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.hideBanner();
    });

    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => this.promptInstall());
    }

    if (this.dismissBtn) {
      this.dismissBtn.addEventListener('click', () => this.dismissBanner());
    }

    this.registerServiceWorker();
  }

  isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  maybeShowBanner() {
    if (!this.banner || !this.deferredPrompt) return;
    if (localStorage.getItem(this.storageKey) === '1') return;
    this.banner.hidden = false;
    this.banner.setAttribute('aria-hidden', 'false');
  }

  async promptInstall() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.hideBanner();
  }

  dismissBanner() {
    localStorage.setItem(this.storageKey, '1');
    this.hideBanner();
  }

  hideBanner() {
    if (!this.banner) return;
    this.banner.hidden = true;
    this.banner.setAttribute('aria-hidden', 'true');
  }

  registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PwaManager;
}
