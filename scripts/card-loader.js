/**
 * Card Loader - Hydrates DOM from data/card.json
 */

class CardLoader {
  constructor() {
    this.data = null;
  }

  async load() {
    try {
      const response = await fetch('/data/card.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`card.json ${response.status}`);
      this.data = await response.json();
      this.apply();
      return this.data;
    } catch (error) {
      console.warn('Card config not loaded; using static HTML.', error);
      return null;
    }
  }

  apply() {
    if (!this.data) return;

    const { owner, contact, social, slogan, qr, meta, labels, showcaseVideo } = this.data;

    this.setText('[data-card="owner-name"]', owner?.name);
    this.setText('[data-card="owner-title"]', owner?.title);
    this.setText('[data-card="slogan"]', slogan);

    this.setAttr('[data-card="profile-image"]', 'src', owner?.image);
    this.setAttr('[data-card="profile-image"]', 'alt', owner?.imageAlt);
    this.applyProfileImageFraming(owner);

    this.setAttr('[data-card="phone-link"]', 'href', contact?.phoneE164 ? `tel:${contact.phoneE164}` : null);
    this.setText('[data-card="phone-display"]', contact?.phoneDisplay);
    this.setAttr('[data-card="whatsapp-link"]', 'href', contact?.whatsapp ? `https://wa.me/${contact.whatsapp}` : null);
    if (contact?.email && typeof EmailLinkManager !== 'undefined') {
      const gmail = EmailLinkManager.buildComposeUrls(contact, owner, labels);
      const platform = EmailLinkManager.getPlatform();
      const link = document.querySelector('[data-card="email-link"]');
      if (link) {
        if (platform === 'desktop') {
          link.href = gmail.web;
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        } else {
          link.href = EmailLinkManager.getMobileHref(gmail);
          link.removeAttribute('target');
          link.removeAttribute('rel');
        }
      }
    }
    this.setText('[data-card="email-display"]', contact?.email);
    this.setAttr('[data-card="website-link"]', 'href', contact?.website);
    this.setText('[data-card="website-display"]', contact?.websiteDisplay);

    this.setAttr('[data-card="phone-copy"]', 'data-copy', contact?.phoneDisplay);
    this.setAttr('[data-card="email-copy"]', 'data-copy', contact?.email);

    if (qr?.image) {
      this.setAttr('[data-card="qr-image"]', 'src', qr.image);
      this.setAttr('[data-card="qr-image"]', 'alt', qr.alt);
    }

    if (Array.isArray(social)) {
      social.forEach((item) => {
        const link = document.querySelector(`[data-card-social="${item.platform}"]`);
        if (!link) return;
        link.href = item.url;
        link.setAttribute('aria-label', item.label);
      });
    }

    if (labels?.saveContact) this.setText('[data-card="save-contact-label"]', labels.saveContact);
    if (labels?.shareCard) this.setText('[data-card="share-card-label"]', labels.shareCard);
    if (labels?.qrTitle) this.setText('[data-card="qr-title"]', labels.qrTitle);
    if (labels?.downloadQr) this.setText('[data-card="download-qr-label"]', labels.downloadQr);
    if (labels?.installApp) {
      const installBtn = document.querySelector('[data-action="install-app"]');
      if (installBtn) installBtn.textContent = labels.installApp;
    }
    if (labels?.installDismiss) {
      const dismissBtn = document.querySelector('[data-action="dismiss-install"]');
      if (dismissBtn) dismissBtn.textContent = labels.installDismiss;
    }

    this.applyDeploymentUrls(this.data.deployment, meta, this.data.share);
    if (meta) this.applyMeta(meta);
    this.applyShowcaseVideo(showcaseVideo, labels);
  }

  applyDeploymentUrls(deployment, meta, share) {
    const siteUrl = (deployment?.siteUrl || meta?.canonical || '').trim();
    if (!siteUrl) return;

    try {
      const absolute = new URL(siteUrl, window.location.origin).href.replace(/\/$/, '');
      if (meta) meta.canonical = absolute;
      if (share && !share.url) share.url = `${absolute}/`;
    } catch {
      /* ignore invalid URL */
    }
  }

  applyProfileImageFraming(owner) {
    const img = document.querySelector('[data-card="profile-image"]');
    if (!img || !owner) return;

    if (owner.imagePosition) {
      img.style.objectPosition = owner.imagePosition;
      document.documentElement.style.setProperty('--avatar-face-position', owner.imagePosition);
    }

    if (owner.imageScale != null) {
      const scale = Number(owner.imageScale);
      if (!Number.isNaN(scale) && scale > 0) {
        img.style.transform = `translateZ(0) scale(${scale})`;
        document.documentElement.style.setProperty('--avatar-face-scale', String(scale));
      }
    }
  }

  applyShowcaseVideo(showcaseVideo, rootLabels) {
    const labels = {
      ...rootLabels,
      ...(showcaseVideo?.labels || {})
    };

    if (labels.videoEyebrow || labels.eyebrow) {
      this.setText('[data-card="video-eyebrow"]', labels.videoEyebrow || labels.eyebrow);
    }
    if (labels.videoTitle || labels.title) {
      this.setText('[data-card="video-title"]', labels.videoTitle || labels.title);
    }
    if (labels.videoCaption || labels.caption) {
      this.setText('[data-card="video-caption"]', labels.videoCaption || labels.caption);
    }
    if (labels.videoClose) {
      document.querySelectorAll('[data-card="video-close-label"]').forEach((el) => {
        el.setAttribute('aria-label', labels.videoClose);
        el.setAttribute('title', labels.videoClose);
      });
    }
    if (labels.avatarAria || labels.videoAvatarAria) {
      const aria = labels.avatarAria || labels.videoAvatarAria;
      document.querySelectorAll('[data-action="open-showcase"]').forEach((el) => {
        el.setAttribute('aria-label', aria);
      });
    }

    if (showcaseVideo?.type === 'embed') {
      const frame = document.getElementById('profileVideoFrame');
      if (frame) {
        const embedSrc =
          showcaseVideo.embedUrl ||
          (showcaseVideo.videoId
            ? `https://www.youtube.com/embed/${showcaseVideo.videoId}?playsinline=1&rel=0&modestbranding=1`
            : '');
        if (embedSrc) {
          frame.dataset.src = embedSrc;
          frame.removeAttribute('src');
        }
      }
    }
  }

  applyMeta(meta) {
    if (meta.title) document.title = meta.title;
    this.setMeta('description', meta.description);
    this.setMeta('keywords', meta.keywords);
    this.setMeta('author', meta.author);
    if (meta.themeColor) {
      this.setMeta('theme-color', meta.themeColor);
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute('content', meta.themeColor);
    }

    const canonical =
      meta.canonical ||
      this.data?.deployment?.siteUrl ||
      window.location.href.split('#')[0];
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    this.setMetaProperty('og:title', meta.title);
    this.setMetaProperty('og:description', meta.description);
    this.setMetaProperty('og:image', this.toAbsoluteUrl(meta.ogImage));
    this.setMetaProperty('og:url', canonical);
    this.setMetaProperty('og:type', 'profile');
    this.setMetaProperty('og:site_name', meta.title || 'Ahmed Hassan - Tour Guide');
    this.setMetaProperty('og:locale', 'en_US');

    this.setMetaName('twitter:card', 'summary_large_image');
    this.setMetaName('twitter:title', meta.title);
    this.setMetaName('twitter:description', meta.description);
    this.setMetaName('twitter:image', this.toAbsoluteUrl(meta.ogImage));
  }

  toAbsoluteUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return new URL(path, window.location.href).href;
  }

  setText(selector, value) {
    if (!value) return;
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  setAttr(selector, attr, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach((el) => el.setAttribute(attr, value));
  }

  setMeta(name, content) {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      document.head.appendChild(el);
    }
    el.content = content;
  }

  setMetaProperty(property, content) {
    if (!content) return;
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.content = content;
  }

  setMetaName(name, content) {
    if (!content) return;
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.name = name;
      document.head.appendChild(el);
    }
    el.content = content;
  }

  getData() {
    return this.data;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CardLoader;
}
