/**
 * InteractionUtils — release sticky press/hover/focus on touch and pointer actions
 */

const InteractionUtils = {
  _scrollY: 0,
  _lockCount: 0,

  prefersLightweightScrollLock() {
    return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  },

  lockScroll() {
    this._scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    this._lockCount += 1;

    document.documentElement.classList.add('scroll-locked');
    document.body.classList.add('modal-open');

    if (!this.prefersLightweightScrollLock()) {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this._scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }
  },

  unlockScroll() {
    if (this._lockCount > 0) {
      this._lockCount -= 1;
    }
    if (this._lockCount > 0) return;

    document.documentElement.classList.remove('scroll-locked');
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';

    window.scrollTo(0, this._scrollY);
  },

  forceUnlock() {
    this._lockCount = 0;
    this.unlockScroll();
  },

  trackPointerType(event) {
    if (event?.pointerType) return event.pointerType;
    if (event?.type === 'keydown') return 'keyboard';
    return event?.detail === 0 ? 'keyboard' : 'mouse';
  },

  releaseControl(element) {
    if (!element || !(element instanceof HTMLElement)) return;
    element.classList.remove('is-pressed');
    if (document.activeElement === element) {
      element.blur();
    }
  },

  restoreFocusOnClose(trigger, openPointerType) {
    if (!trigger) return;
    if (openPointerType === 'keyboard') {
      trigger.focus({ preventScroll: true });
      return;
    }
    this.releaseControl(trigger);
  },

  bindPressFeedback(elements) {
    if (!elements) return;
    const list = elements instanceof NodeList ? Array.from(elements) : [].concat(elements);

    list.forEach((el) => {
      if (!el || el.dataset.pressBound === 'true') return;
      el.dataset.pressBound = 'true';

      const press = () => el.classList.add('is-pressed');
      const release = () => el.classList.remove('is-pressed');

      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointerleave', release);
      el.addEventListener('pointercancel', release);
    });
  }
};

if (typeof window !== 'undefined') {
  window.InteractionUtils = InteractionUtils;

  window.addEventListener('pageshow', () => {
    if (
      document.documentElement.classList.contains('scroll-locked') &&
      !document.querySelector('.video-modal-overlay.active, .qr-modal-overlay.active')
    ) {
      InteractionUtils.forceUnlock();
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InteractionUtils;
}
