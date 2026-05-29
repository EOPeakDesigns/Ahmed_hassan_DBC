/**
 * EmailLinkManager — opens Gmail compose (native app on mobile, web on desktop)
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

  static getPlatform() {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    return 'desktop';
  }

  static isMobilePlatform() {
    return EmailLinkManager.getPlatform() !== 'desktop';
  }

  applyLinkFromData() {
    const data = this.cardLoader?.getData();
    if (!data?.contact?.email || !this.emailLink) return;

    const urls = this.buildComposeUrls(data);
    const platform = EmailLinkManager.getPlatform();

    this.emailLink.setAttribute('data-gmail-web', urls.web);
    this.emailLink.setAttribute('data-gmail-ios', urls.ios);
    this.emailLink.setAttribute('data-gmail-android', urls.android);
    this.emailLink.setAttribute('data-mailto', urls.mailto);

    if (platform === 'android') {
      this.emailLink.href = urls.android;
      this.emailLink.removeAttribute('target');
    } else if (platform === 'ios') {
      this.emailLink.href = urls.mailto;
      this.emailLink.removeAttribute('target');
    } else {
      this.emailLink.href = urls.web;
      this.emailLink.setAttribute('target', '_blank');
      this.emailLink.setAttribute('rel', 'noopener noreferrer');
    }

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
    const web = `https://mail.google.com/mail/?${webParams.toString()}`;

    const appParams = new URLSearchParams({ to });
    if (subject) appParams.set('subject', subject);
    if (body) appParams.set('body', body);
    const appQuery = appParams.toString();
    const mailto = EmailLinkManager.buildMailtoUrl(to, subject, body);

    const ios = `googlegmail:///co?${appQuery}`;
    const iosAlt = `googlegmail://co?${appQuery}`;
    const android = EmailLinkManager.buildAndroidIntentUrl(mailto);

    return { web, ios, iosAlt, android, mailto, app: iosAlt };
  }

  static buildAndroidIntentUrl(mailtoUrl) {
    const payload = mailtoUrl.replace(/^mailto:/i, '');
    const fallback = encodeURIComponent(mailtoUrl);
    return `intent:mailto:${payload}#Intent;action=android.intent.action.SENDTO;package=com.google.android.gm;S.browser_fallback_url=${fallback};end`;
  }

  static buildMailtoUrl(to, subject, body) {
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (body) params.set('body', body);
    const qs = params.toString();
    return `mailto:${encodeURIComponent(to)}${qs ? `?${qs}` : ''}`;
  }

  buildComposeUrls(data) {
    return EmailLinkManager.buildComposeUrls(
      data.contact,
      data.owner,
      data.labels
    );
  }

  handleClick(event) {
    const data = this.cardLoader?.getData();
    const email = data?.contact?.email?.trim();
    if (!email) return;

    const urls = this.buildComposeUrls(data);
    const platform = EmailLinkManager.getPlatform();

    if (platform === 'desktop') {
      event.preventDefault();
      window.open(urls.web, '_blank', 'noopener,noreferrer');
      return;
    }

    /* Mobile: same-tab deep link — target="_blank" blocks Gmail app on many browsers */
    event.preventDefault();

    if (platform === 'android') {
      window.location.href = urls.android;
      return;
    }

    this.openIosGmail(urls.ios, urls.iosAlt, urls.mailto);
  }

  openIosGmail(primaryUrl, secondaryUrl, mailtoUrl) {
    let didLeave = false;

    const markLeave = () => {
      didLeave = true;
    };

    window.addEventListener('pagehide', markLeave, { once: true });
    window.addEventListener('blur', markLeave, { once: true });

    window.location.href = primaryUrl;

    window.setTimeout(() => {
      if (!didLeave) {
        window.location.href = secondaryUrl;
      }
    }, 450);

    window.setTimeout(() => {
      if (!didLeave) {
        window.location.href = mailtoUrl;
      }
    }, 1200);
  }

  reconfigure() {
    this.applyLinkFromData();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailLinkManager;
}
