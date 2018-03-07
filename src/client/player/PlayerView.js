import * as soundworks from 'soundworks/client';

const client = soundworks.client;

// @todo - remove
// const template = `
//   <div class="background bkg-img" id="background">
//     <div class="bottom" id="background-banner" style="display:none" align="center">
//       <p class="soft-blink-2 black-text-banner">toucher l'écran une fois la position atteinte</p>
//     </div>
//     <div class="middle flex-middle">
//       <p class="black-text" id="background-instructions"></p>
//     </div>
//     <canvas id="backgroundCanvas">
//     </canvas>
//   </div>
//   <div class="foreground" id="foreground">
//     <div class="section-top flex-middle">
//       <p class="big" id="foreground-title"><%= title %></p>
//     </div>
//     <div class="section-center flex-middle">
//       <p class="medium" id="foreground-instructions"><%= instructions %></p>
//     </div>
//     <div class="section-bottom flex-middle soft-blink">
//       <p class="small" id="foreground-footer"></p>
//     </div>
//   </div>
// `;

const template = `
  <div class="background fit-container">
    <div id="background-image" class="fit-container"></div>
    <div id="background-color" class="fit-container"></div>
  </div>
  <div class="foreground">
    <div class="section-top flex-middle">
      <div id="top"></div>
    </div>
    <div class="section-center flex-middle">
      <div id="center"></div>
    </div>
    <div class="section-bottom flex-middle">
      <div id="bottom"></div>
    </div>
  </div>
  <% if (state === 'choice') { %>
  <div id="choice">
    <button id="restart"><%= common.restartStr %></button>
    <button id="continue"><%= common.continueStr %></button>
  </div>
  <% } %>
`;

class PlayerView extends soundworks.SegmentedView {
  constructor(model) {
    super(template, model, {}, {
      ratios: {
        '.section-top': 0.1,
        '.section-center': 0.8,
        '.section-bottom': 0.1
      }
    });
  }

  onRender() {
    super.onRender();

    this.$placeholders = {};
    this.$placeholders['top'] = this.$el.querySelector('#top');
    this.$placeholders['center'] = this.$el.querySelector('#center');
    this.$placeholders['bottom'] = this.$el.querySelector('#bottom');
    this.$placeholders['background-color'] = this.$el.querySelector('#background-color');
    this.$placeholders['background-image'] = this.$el.querySelector('#background-image');
  }

  clear() {
    this.$placeholders['top'].innerHTML = '';
    this.$placeholders['center'].innerHTML = '';
    this.$placeholders['bottom'].innerHTML = '';
    this.$placeholders['top'].style.opacity = 1;
    this.$placeholders['center'].style.opacity = 1;
    this.$placeholders['bottom'].style.opacity = 1;
    this.$placeholders['background-image'].style.backgroundImage = 'none';
  }

  setId(id) {
    this.$el.id = 'state-${id}';
  }

  setBackgroundColor(placeholder, color) {
    this.$placeholders[placeholder].style.backgroundColor = color;
  }

  setBackgroundImage(placeholder, url) {
    this.$placeholders[placeholder].style.backgroundImage = `url(${url})`;
  }

  setTextContent(placeholder, content) {
    this.$placeholders[placeholder].innerHTML = content;
  }

  fadeIn(placeholder, duration) {
    const $el = this.$placeholders[placeholder];
    $el.style.transition = `opacity ${duration}s`;
    $el.style.opacity = 1;
  }

  fadeOut(placeholder, duration) {
    const $el = this.$placeholders[placeholder];
    $el.style.transition = `opacity ${duration}s`;
    $el.style.opacity = 0;
  }

  setEvent(placeholder, callback) {
    console.log(client.platform.interaction);
    let key = client.platform.interaction === 'touch' ? 'touchstart' : 'mousedown';

    if (placeholder !== 'screen')
      key += ` #${placeholder}`

    this.installEvents({ [key]: callback }, true);
  }
}

export default PlayerView;
