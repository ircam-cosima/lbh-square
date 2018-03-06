
class DisplayManager {
  constructor() {
    // locals
    this.refreshRate = 20; // in ms
    this.callback = undefined;
  }

  start() {
    // handle to foreground
    this.foreground = document.getElementById('foreground');
    this.background = document.getElementById('background');
  }

  setImg(url) {
    this.background.style.backgroundImage = `url(${url})`;
  }

  set title(str) {
    document.getElementById('foreground-title').innerHTML = str;
  }

  set instructions(str) {
    document.getElementById('foreground-instructions').innerHTML = str;
  }

  set instructionsImg(str) {
    document.getElementById('background-instructions').innerHTML = str;
  }

  set instructionsImgClass(str) {
    document.getElementById('background-instructions').className = str;
  }

  set footer(str) {
    document.getElementById('foreground-footer').innerHTML = str;
  }

  setOpaque(onOff, fadeDuration) {
    let oneMinusOne = onOff ? 1 : -1;

    // immediate fade
    if (fadeDuration <= this.refreshRate / 1000) {
      this.foreground.style.opacity = onOff;
      return;
    }

    // prepare fade mechanism: clear running fading interval if need be
    if (this.callback !== undefined) {
      clearInterval(this.callback);
      this.callback = undefined;
    }

    // progressive fade
    const step = (this.refreshRate / 1000) / fadeDuration;

    this.callback = setInterval(() => {
      let val = Number(this.foreground.style.opacity) + oneMinusOne * step;
      // finished fade: set final value and clear interval
      if (val >= 1.0 || val <= 1e-3) {
        this.foreground.style.opacity = (oneMinusOne === 1)? '1':'0';
        clearInterval(this.callback);
        this.callback = undefined;
      } else {
      // ongoing fade: set opacity with new value
        this.foreground.style.opacity = String(val);
      }

    }, this.refreshRate);
  }
}

export default DisplayManager;
