/**
 * Social Interactions — short-lived press states (no sticky hover)
 */

class SocialInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.bindPressStates();
  }

  bindPressStates() {
    const pressables = document.querySelectorAll('.social-icon, .actions-grid .btn');
    InteractionUtils.bindPressFeedback(pressables);
  }

  reinitialize() {
    this.bindPressStates();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocialInteractions;
}
