function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Vodjena tura koja redom obilazi zadata tela, zaustavlja se na svakom
 * (prikazuje info panel) i nakon pauze automatski nastavlja dalje.
 */
export class GuidedTour {
  constructor({ order, focusBodyByKey, holdMs = 5000 }) {
    this.order = order;
    this.focusBodyByKey = focusBodyByKey;
    this.holdMs = holdMs;
    this.active = false;
    this.cancelRequested = false;
  }

  async start(onFinish) {
    if (this.active) return;
    this.active = true;
    this.cancelRequested = false;

    for (const key of this.order) {
      if (this.cancelRequested) break;
      await this.focusBodyByKey(key);
      if (this.cancelRequested) break;
      await delay(this.holdMs);
    }

    this.active = false;
    if (!this.cancelRequested && onFinish) onFinish();
  }

  stop() {
    this.cancelRequested = true;
    this.active = false;
  }
}
