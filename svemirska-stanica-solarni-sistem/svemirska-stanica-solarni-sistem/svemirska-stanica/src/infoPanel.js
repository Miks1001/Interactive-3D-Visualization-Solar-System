export class InfoPanel {
  constructor(rootEl) {
    this.root = rootEl;
    this.titleEl = rootEl.querySelector('.info-title');
    this.imgEl = rootEl.querySelector('.info-image');
    this.textEl = rootEl.querySelector('.info-text');
    this.backBtn = rootEl.querySelector('.info-back');
  }

  show(body) {
    this.titleEl.textContent = body.name;
    this.textEl.textContent = body.info;
    if (body.thumb) {
      this.imgEl.src = body.thumb;
      this.imgEl.style.display = 'block';
    } else {
      this.imgEl.style.display = 'none';
    }
    this.root.classList.add('visible');
  }

  hide() {
    this.root.classList.remove('visible');
  }

  onBack(cb) {
    this.backBtn.addEventListener('click', cb);
  }
}
