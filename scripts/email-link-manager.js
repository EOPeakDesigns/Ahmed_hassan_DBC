/**
 * EmailLinkManager — opens Gmail app compose on mobile, Gmail web on desktop
 *
 * Mobile: native <a href> deep link only (no preventDefault — required for OS handoff)
 * Android: SENDTO intent → com.google.android.gm (no browser fallback URL)
 * iOS: googlegmail:///co?… with encoded query params
 */

class EmailLinkManager {
  constructor(cardLoader) {
    this.cardLoader = cardLoader;
    this.emailLink = null;
    this.boundDesktopClick = (event) => this.handleDesktopClick(event);
    this.init();
  }

  init() {
    this.emailLink = document.querySelector('[data-card="email-link"]');
    if (!this.emailLink) return;

    this.applyLinkFromData();

    if (EmailLinkManager.getPlatform() === 'desktop') {
      this.emailLink.addEventListener('click', this.boundDesktopClick);
    } else {
      this.emailLink.removeEventListener('click', this.boundDesktopClick);
    }
  }

  static getPlatform() {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    return 'desktop';
  }

  /**
   * Build all compose URLs for the current contact
   */
  static buildComposeUrls(contact, owner, labels) {
    const to = (contact?.email || '').trim();
    const subject = (contact?.emailSubject || labels?.emailSubject || '').trim();
    const body = (contact?.emailBody || labels?.emailBody || '').trim();

    const mailto = EmailLinkManager.buildMailtoUri(to, subject, body);

    const webParams = new URLSearchParams({ view: 'cm', fs: '1', to });
    if (subject) webParams.set('su', subject);
    if (body) webParams.set('body', body);
    const web = `https://mail.google.com/mail/?${webParams.toString()}`;

    const ios = EmailLinkManager.buildIosGmailUrl(to, subject, body);
    const android = EmailLinkManager.buildAndroidGmailIntent(mailto);
    const androidAlt = EmailLinkManager.buildAndroidGmailSchemeUrl(to, subject, body);

    return { web, mailto, ios, android, androidAlt };
  }

  static buildMailtoUri(to, subject, body) {
    const query = new URLSearchParams();
    if (subject) query.set('subject', subject);
    if (body) query.set('body', body);
    const qs = query.toString();
    return qs ? `mailto:${to}?${qs}` : `mailto:${to}`;
  }

  /** iOS Gmail — encode each query value (required by Gmail URL scheme) */
  static buildIosGmailUrl(to, subject, body) {
    const parts = [`to=${encodeURIComponent(to)}`];
    if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
    if (body) parts.push(`body=${encodeURIComponent(body)}`);
    return `googlegmail:///co?${parts.join('&')}`;
  }

  /**
   * Android Chrome — explicit SENDTO + mailto + Gmail package
   * Do NOT set S.browser_fallback_url (that forces Gmail website in browser)
   */
  static buildAndroidGmailIntent(mailtoUri) {
    const data = encodeURI(mailtoUri);
    return (
      `intent://send/#Intent;action=android.intent.action.SENDTO;data=${data};` +
      'package=com.google.android.gm;end'
    );
  }

  /** Android fallback scheme if SENDTO intent is blocked */
  static buildAndroidGmailSchemeUrl(to, subject, body) {
    const parts = [`to=${encodeURIComponent(to)}`];
    if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
    if (body) parts.push(`body=${encodeURIComponent(body)}`);
    return `googlegmail://co?${parts.join('&')}`;
  }

  static getMobileHref(urls) {
    const platform = EmailLinkManager.getPlatform();
    if (platform === 'android') return urls.android;
    if (platform === 'ios') return urls.ios;
    return urls.web;
  }

  applyLinkFromData() {
    const data = this.cardLoader?.getData();
    if (!data?.contact?.email || !this.emailLink) return;

    const urls = EmailLinkManager.buildComposeUrls(
      data.contact,
      data.owner,
      data.labels
    );
    const platform = EmailLinkManager.getPlatform();

    this.emailLink.setAttribute('data-gmail-web', urls.web);
    this.emailLink.setAttribute('data-gmail-mailto', urls.mailto);
    this.emailLink.setAttribute('data-gmail-ios', urls.ios);
    this.emailLink.setAttribute('data-gmail-android', urls.android);

    if (platform === 'desktop') {
      this.emailLink.href = urls.web;
      this.emailLink.setAttribute('target', '_blank');
      this.emailLink.setAttribute('rel', 'noopener noreferrer');
    } else {
      this.emailLink.href = EmailLinkManager.getMobileHref(urls);
      this.emailLink.removeAttribute('target');
      this.emailLink.removeAttribute('rel');
    }

    const label =
      data.labels?.emailAria ||
      `Email ${data.owner?.name || 'Ahmed Hassan'} in Gmail`;
    this.emailLink.setAttribute('aria-label', label);
    this.emailLink.setAttribute('title', label);
  }

  handleDesktopClick(event) {
    const data = this.cardLoader?.getData();
    if (!data?.contact?.email) return;

    event.preventDefault();
    const urls = EmailLinkManager.buildComposeUrls(
      data.contact,
      data.owner,
      data.labels
    );
    window.open(urls.web, '_blank', 'noopener,noreferrer');
  }

  reconfigure() {
    this.applyLinkFromData();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailLinkManager;
}
