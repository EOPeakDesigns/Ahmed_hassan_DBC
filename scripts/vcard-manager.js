/**
 * vCard Manager - Generates and downloads .vcf contact files
 */

class VCardManager {
  constructor(cardLoader) {
    this.cardLoader = cardLoader;
    this.saveButton = null;
    this.init();
  }

  init() {
    this.saveButton = document.querySelector('[data-action="save-contact"]');
    if (this.saveButton) {
      this.saveButton.addEventListener('click', () => this.downloadVCard());
    }
  }

  downloadVCard() {
    const data = this.cardLoader?.getData();
    if (!data) return;

    const { owner, contact } = data;
    const vcard = this.buildVCard(owner, contact);
    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const fileName = `${(owner?.name || 'contact').toLowerCase().replace(/\s+/g, '-')}.vcf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const message = data.labels?.contactSaved || 'Contact file ready to save';
    if (window.showToast) window.showToast(message);

    InteractionUtils.releaseControl(this.saveButton);
  }

  buildVCard(owner, contact) {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${this.escape(owner?.name || '')}`,
      `TITLE:${this.escape(owner?.title || '')}`
    ];

    if (contact?.phoneE164) {
      lines.push(`TEL;TYPE=CELL:${this.escape(contact.phoneE164)}`);
    }
    if (contact?.email) {
      lines.push(`EMAIL;TYPE=INTERNET:${this.escape(contact.email)}`);
    }
    if (contact?.website) {
      lines.push(`URL:${this.escape(contact.website)}`);
    }

    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  escape(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/\n/g, '\\n');
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VCardManager;
}
