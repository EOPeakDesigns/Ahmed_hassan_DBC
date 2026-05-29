/**
 * Share Manager - Web Share API with clipboard fallback
 */

class ShareManager {
  constructor(cardLoader) {
    this.cardLoader = cardLoader;
    this.shareButton = null;
    this.init();
  }

  init() {
    this.shareButton = document.querySelector('[data-action="share-card"]');
    if (this.shareButton) {
      this.shareButton.addEventListener('click', (event) => this.shareCard(event));
    }
  }

  buildSharePayload(data) {
    const owner = data?.owner || {};
    const contact = data?.contact || {};
    const share = data?.share || {};
    const labels = data?.labels || {};

    const url = this.resolveShareUrl(share, data?.meta);
    const title =
      share.title ||
      labels.shareTitle ||
      data?.meta?.title ||
      document.title;

    const text =
      share.text ||
      labels.shareText ||
      [
        `${owner.name || ''} — ${owner.title || ''}`.trim(),
        contact.phoneDisplay ? `Phone: ${contact.phoneDisplay}` : '',
        contact.email ? `Email: ${contact.email}` : '',
        contact.websiteDisplay || contact.website || '',
        labels.sharePrompt || 'View my digital business card:'
      ]
        .filter(Boolean)
        .join('\n');

    return { title, text, url };
  }

  resolveShareUrl(share, meta) {
    const configured = share?.url || meta?.canonical;
    if (configured) {
      try {
        return new URL(configured, window.location.href).href.split('#')[0];
      } catch {
        /* fall through */
      }
    }
    return window.location.href.split('#')[0];
  }

  async shareCard(event) {
    const data = this.cardLoader?.getData();
    if (!data) return;

    const payload = this.buildSharePayload(data);
    const labels = data.labels || {};
    const clipText = [payload.title, '', payload.text, payload.url].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        const shareData = { title: payload.title, text: payload.text, url: payload.url };
        if (!navigator.canShare || navigator.canShare(shareData)) {
          await navigator.share(shareData);
          const message = labels.shareSuccess || 'Thanks for sharing!';
          if (window.showToast) window.showToast(message);
          InteractionUtils.releaseControl(this.shareButton);
          return;
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          InteractionUtils.releaseControl(this.shareButton);
          return;
        }
      }
    }

    const copied = await this.copyToClipboard(clipText);
    if (copied) {
      const message = labels.shareCopied || labels.copied || 'Card link copied — paste to share';
      if (window.showToast) window.showToast(message);
    } else {
      const message = labels.shareFailed || 'Sharing is not available on this device';
      if (window.showToast) window.showToast(message);
    }

    InteractionUtils.releaseControl(this.shareButton);
  }

  async copyToClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* fallback */
    }

    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.left = '-9999px';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShareManager;
}
