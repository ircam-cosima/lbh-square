// import client side soundworks and player experience
import * as soundworks from 'soundworks/client';
import PlayerExperience from './PlayerExperience';
import serviceViews from '../shared/serviceViews';
import ImagesLoader from '../shared/services/ImagesLoader';

import appConfig from '../../shared/app-config';

function bootstrap() {
  // initialize the client with configuration received
  // from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const config = Object.assign({ appContainer: '#container' }, window.soundworksConfig);
  soundworks.client.init(config.clientType, config);

  // configure views for the services
  soundworks.client.setServiceInstanciationHook((id, instance) => {
    if (serviceViews.has(id))
      instance.view = serviceViews.get(id, config);

    // use audio buffer manager view for images loader
    if (id === 'service:images-loader')
      instance.view = serviceViews.get('service:audio-buffer-manager', config);

    if (id === 'service:platform')
      instance.view = serviceViews.get('service:platform', appConfig.txt.home);
  });

  // create client side (player) experience and start the client
  const experience = new PlayerExperience(config, appConfig);
  soundworks.client.start();
}

window.addEventListener('load', bootstrap);
