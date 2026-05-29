/**
 * EmailLinkManager — opens Gmail compose (app on mobile, web on desktop)
 */

class EmailLinkManager {
  constructor(cardLoader) {
    this.cardLoader = cardLoader;
    this.emailLink = null;
    this.boundClick = (event) => this.handleClick(event);
    this.init();
  }

  init() {
    this.emailLink = document.querySelector('[data-card="email-link"]');
    if (!this.emailLink) return;

    this.emailLink.addEventListener('click', this.boundClick);
    this.applyLinkFromData();
  }

  applyLinkFromData() {
    const data = this.cardLoader?.getData();
    if (!data?.contact?.email || !this.emailLink) return;

    const urls = this.buildComposeUrls(data);
    this.emailLink.href = urls.web;
    this.emailLink.setAttribute('data-gmail-web', urls.web);
    this.emailLink.setAttribute('data-gmail-app', urls.app);

    const label =
      data.labels?.emailAria ||
      `Email ${data.owner?.name || 'Ahmed Hassan'} in Gmail`;
    this.emailLink.setAttribute('aria-label', label);
    this.emailLink.setAttribute('title', label);
  }

  static buildComposeUrls(contact, owner, labels) {
    const to = (contact?.email || '').trim();
    const subject = (contact?.emailSubject || labels?.emailSubject || '').trim();
    const body = (contact?.emailBody || labels?.emailBody || '').trim();

    const webParams = new URLSearchParams({ view: 'cm', fs: '1', to });
    if (subject) webParams.set('su', subject);
    if (body) webParams.set('body', body);

    const appParams = new URLSearchParams({ to });
    if (subject) appParams.set('subject', subject);
    if (body) appParams.set('body', body);

    return {
      web: `https://mail.google.com/mail/?${webParams.toString()}`,
      app: `googlegmail://co?${appParams.toString()}`,
      mailto: EmailLinkManager.buildMailtoUrl(to, subject, body)
    };
  }

  buildComposeUrls(data) {
    return EmailLinkManager.buildComposeUrls(
      data.contact,
      data.owner,
      data.labels
    );
  }

  static buildMailtoUrl(to, subject, body) {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const qs = params.toString();
    return `mailto:${encodeURIComponent(to)}${qs ? `?${qs}` : ''}`;
  }

  static prefersGmailApp() {
    const ua = navigator.userAgent || '';
    const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const isNarrow = window.matchMedia('(max-width: 768px)').matches;
    return isMobileUa || (isCoarsePointer && isNarrow);
  }

  handleClick(event) {
    const data = this.cardLoader?.getData();
    const email = data?.contact?.email?.trim();
    if (!email) return;

    event.preventDefault();

    const urls = this.buildComposeUrls(data);

    if (EmailLinkManager.prefersGmailApp()) {
      this.openGmailApp(urls.app, urls.web);
      return;
    }

    window.open(urls.web, '_blank', 'noopener,noreferrer');
  }

  openGmailApp(appUrl, webUrl) {
    let didLeave = false;

    const clearFallback = () => {
      didLeave = true;
    };

    const fallbackTimer = window.setTimeout(() => {
      if (!didLeave) {
        window.location.assign(webUrl);
      }
    }, 1400);

    window.addEventListener('pagehide', clearFallback, { once: true });
    window.addEventListener('blur', clearFallback, { once: true });

    window.location.href = appUrl;

    window.setTimeout(() => {
      window.removeEventListener('pagehide', clearFallback);
      window.removeEventListener('blur', clearFallback);
      window.clearTimeout(fallbackTimer);
    }, 2000);
  }

  reconfigure() {
    this.applyLinkFromData();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailLinkManager;
}
