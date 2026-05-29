/**
 * VideoHandler — Profile showcase modal (YouTube embed + legacy <video> fallback)
 */

class VideoHandler {
  constructor(cardLoader) {
    this.cardLoader = cardLoader;
    this.overlay = null;
    this.modalContent = null;
    this.closeBtn = null;
    this.trigger = null;
    this.profileVideo = null;
    this.localVideo = null;
    this.previouslyFocused = null;
    this.config = null;
    this.isOpen = false;
    this.openPointerType = 'mouse';
    this.boundKeyDown = (e) => this.handleKeyDown(e);
    this.init();
  }

  init() {
    this.cacheElements();
    this.configureFromData();
    this.bindEvents();
  }

  cacheElements() {
    this.overlay = document.getElementById('videoModal') || document.querySelector('.video-modal-overlay');
    this.modalContent = document.querySelector('.video-modal');
    this.closeBtn = document.querySelector('.video-modal__close');
    this.trigger = document.querySelector('[data-action="open-showcase"]');
    this.profileVideo = document.getElementById('profileVideoFrame');
    this.localVideo = document.querySelector('.video-modal__player');
  }

  getVideoConfig() {
    return this.cardLoader?.getData()?.showcaseVideo || null;
  }

  isVideoAvailable(video) {
    if (!video?.enabled) return false;
    if (video.type === 'embed' && (video.embedUrl || this.profileVideo?.dataset?.src)) return true;
    if (video.type === 'file' && video.src) return true;
    return false;
  }

  configureFromData() {
    const video = this.getVideoConfig();
    this.config = video;

    const available = this.isVideoAvailable(video);
    this.setShowcaseVisible(available);

    if (!available || !video) return;

    this.setLabels(video);

    if (video.type === 'embed' && this.profileVideo) {
      const embedSrc = this.resolveEmbedSrc(video);
      if (embedSrc) {
        this.profileVideo.dataset.src = embedSrc;
        this.profileVideo.removeAttribute('src');
      }
    }
  }

  setLabels(video) {
    const rootLabels = this.cardLoader.getData()?.labels || {};
    const merged = { ...rootLabels, ...(video.labels || {}) };

    this.setText('[data-card="video-eyebrow"]', merged.videoEyebrow || merged.eyebrow);
    this.setText('[data-card="video-title"]', merged.videoTitle || merged.title);
    this.setText('[data-card="video-caption"]', merged.videoCaption || merged.caption);

    const ariaLabel = merged.videoAvatarAria || merged.avatarAria;
    if (this.trigger && ariaLabel) {
      this.trigger.setAttribute('aria-label', ariaLabel);
    }

    if (merged.videoClose) {
      document.querySelectorAll('.video-modal__close').forEach((el) => {
        el.setAttribute('aria-label', merged.videoClose);
        el.setAttribute('title', merged.videoClose);
      });
    }

    const modalTitle = merged.videoTitle || merged.title;
    const titleEl = document.getElementById('video-modal-title');
    if (titleEl && modalTitle) {
      titleEl.textContent = modalTitle;
    }
    if (this.profileVideo && modalTitle) {
      this.profileVideo.setAttribute('title', modalTitle);
    }
  }

  resolveEmbedSrc(video) {
    if (video.embedUrl) {
      return this.normalizeEmbedUrl(video.embedUrl);
    }
    if (video.videoId) {
      return `https://www.youtube.com/embed/${video.videoId}?playsinline=1&rel=0&modestbranding=1`;
    }
    return this.profileVideo?.dataset?.src || '';
  }

  normalizeEmbedUrl(url) {
    if (!url) return '';

    try {
      const parsed = new URL(url, window.location.href);

      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        let id = parsed.searchParams.get('v');
        if (!id && parsed.hostname.includes('youtu.be')) {
          id = parsed.pathname.replace('/', '');
        }
        if (parsed.pathname.startsWith('/embed/')) {
          id = parsed.pathname.split('/embed/')[1]?.split('/')[0];
        }
        if (id) {
          const params = new URLSearchParams(parsed.search);
          params.set('playsinline', '1');
          params.set('rel', '0');
          params.set('modestbranding', '1');
          params.delete('si');
          params.delete('autoplay');
          const qs = params.toString();
          return `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : '?playsinline=1&rel=0&modestbranding=1'}`;
        }
      }

      if (parsed.hostname.includes('vimeo.com')) {
        const id = parsed.pathname.split('/').filter(Boolean).pop();
        if (id) {
          return `https://player.vimeo.com/video/${id}`;
        }
      }

      return url;
    } catch {
      return url;
    }
  }

  setShowcaseVisible(visible) {
    if (!this.trigger) return;
    this.trigger.hidden = !visible;
    if (visible) {
      this.trigger.removeAttribute('hidden');
    }
  }

  setText(selector, value) {
    if (!value) return;
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  bindEvents() {
    if (this.trigger) {
      this.trigger.addEventListener('click', (event) => {
        this.openPointerType = InteractionUtils.trackPointerType(event);
        this.open();
      });
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }
  }

  open() {
    if (!this.overlay || !this.config || !this.isVideoAvailable(this.config)) return;

    this.previouslyFocused = document.activeElement;
    this.mountMedia();

    this.overlay.classList.add('active');
    this.overlay.setAttribute('aria-hidden', 'false');
    InteractionUtils.lockScroll();
    this.isOpen = true;
    document.addEventListener('keydown', this.boundKeyDown);

    if (this.closeBtn) {
      this.closeBtn.focus();
    }
  }

  close() {
    if (!this.overlay) return;

    this.stopMedia();

    this.overlay.classList.remove('active');
    this.overlay.setAttribute('aria-hidden', 'true');
    InteractionUtils.unlockScroll();
    this.isOpen = false;
    document.removeEventListener('keydown', this.boundKeyDown);

    InteractionUtils.restoreFocusOnClose(
      this.previouslyFocused,
      this.openPointerType || 'mouse'
    );
    this.previouslyFocused = null;
  }

  mountMedia() {
    const video = this.config;
    if (!video) return;

    if (video.type === 'embed' && this.profileVideo) {
      this.loadEmbed();
      if (this.localVideo) {
        this.localVideo.hidden = true;
        this.localVideo.pause();
      }
      return;
    }

    if (video.type === 'file' && this.localVideo) {
      this.unloadEmbed();
      this.localVideo.hidden = false;
      this.localVideo.src = video.src;
      if (video.poster) {
        this.localVideo.poster = video.poster;
      }
      this.localVideo.load();
      const playPromise = this.localVideo.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
    }
  }

  loadEmbed() {
    if (!this.profileVideo) return;
    const dataSrc = this.profileVideo.dataset.src;
    if (!dataSrc) return;
    this.profileVideo.src = dataSrc;
  }

  unloadEmbed() {
    if (!this.profileVideo) return;
    this.profileVideo.removeAttribute('src');
  }

  stopMedia() {
    this.unloadEmbed();

    if (this.localVideo) {
      this.localVideo.pause();
      this.localVideo.removeAttribute('src');
      this.localVideo.load();
      this.localVideo.hidden = true;
    }
  }

  handleKeyDown(event) {
    if (!this.isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  trapFocus(event) {
    const focusable = this.overlay.querySelectorAll(
      'button, [href], video, iframe, [tabindex]:not([tabindex="-1"])'
    );
    const list = Array.from(focusable).filter((el) => !el.hidden && el.offsetParent !== null);
    if (!list.length) return;

    const first = list[0];
    const last = list[list.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  reconfigure() {
    this.configureFromData();
  }
}

/** @deprecated Use VideoHandler — kept for existing app.js reference */
class VideoModalManager extends VideoHandler {}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VideoHandler, VideoModalManager };
}
