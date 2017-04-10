// import client side soundworks and player experience
import * as soundworks from 'soundworks/client';
import PlayerExperience from './PlayerExperience.js';
import viewTemplates from '../shared/viewTemplates';
import viewContent from '../shared/viewContent';

// list of files to load (passed to the experience)
const files = [
  'sounds/count8-120bpm-1.mp3',
  'sounds/count8-120bpm-2.mp3',
  'sounds/count8-120bpm-3.mp3',
  'sounds/count8-120bpm-4.mp3',
  'sounds/count8-120bpm-5.mp3',
  'sounds/count8-120bpm-6.mp3',
  'sounds/count8-120bpm-7.mp3',
  'sounds/count8-120bpm-8.mp3'
];

// launch application when document is fully loaded
window.addEventListener('load', () => {
  // initialize the client with configuration received
  // from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const config = window.soundworksConfig;
  soundworks.client.init(config.clientType, config);
  soundworks.client.setViewContentDefinitions(viewContent);
  soundworks.client.setViewTemplateDefinitions(viewTemplates);

  // create client side (player) experience
  const experience = new PlayerExperience(config.assetsDomain, files);
  window.experience = experience;

  // start the client
  soundworks.client.start();
});
