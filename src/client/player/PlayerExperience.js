import * as soundworks from 'soundworks/client';
import slugify from 'slugify';
import SimplePlayer from './audio/SimplePlayer';
import State from './State';
import PlayerView from './PlayerView';

const audioContext = soundworks.audioContext;
const client = soundworks.client;
const audio = soundworks.audio;
// should be somewhere else, even if not a big deal
const localStorageId = 'lbh-square';


// import * as utils from './misc/utils';
// import './misc/googleAnalytics'

// const streamLoopFileName = '14-streaming-loop-infinite';
// const numDaysCookieValid = 1; // number of days cookies are valid (for restarting exp. not from beginning)

class PlayerExperience extends soundworks.Experience {
  constructor(envConfig, appConfig) {
    super();

    this.envConfig = envConfig;
    this.appConfig = appConfig;

    // services
    // this.platform = this.require('platform', { features: ['web-audio', 'wake-lock'] });
    this.platform = this.require('platform', { features: ['web-audio'] });
    console.warn('REMOVED PLATFORM WAVE-LOCK FOR DEBUG ON CHROME (100%CPU..)');

    this.sync = this.require('sync');
    this.checkin = this.require('checkin', { showDialog: false });
    this.sharedParams = this.require('shared-params');
    this.motionInput = this.require('motion-input', {
      descriptors: ['deviceorientation'],
    });
    this.audioStreamManager = this.require('audio-stream-manager', {
      monitorInterval: 1,
      requiredAdvanceThreshold: 10,
    });

    const triggerAudioBuffers = {};

    this.appConfig.states.forEach(state => {
      state.events.forEach(event => {
        if (event.triggerAudio)
          triggerAudioBuffers[event.triggerAudio.id] = event.triggerAudio.file;
      });
    });

    this.audioBufferManager = this.require('audio-buffer-manager', {
      assetsDomain: this.envConfig.assetsDomain,
      files: triggerAudioBuffers,
    });
  }

  start() {
    super.start();

    this.simplePlayer = new SimplePlayer(this.audioBufferManager.data);
    this.view = new PlayerView({
      state: 'experience',
      common: this.appConfig.common.txt,
    });

    this.show().then(() => {
      this.transport = new audio.Transport();
      this.playControl = new audio.PlayControl(this.transport);

      this.currentStateIndex = null;
      this.state = null;

      // init debug - listen for controller for debugging / test
      this.debugMode = false;

      this.sharedParams.addParamListener('debug-mode', value => {
        console.log('debug-mode', value)
        this.debugMode = value;
      });

      this.appConfig.states.forEach((state, stateIndex) => {
        const name = slugify(state.title);

        this.sharedParams.addParamListener(name, value => {
          if (!this.debugMode || !value)
            return;

          console.log('sharedParams', value, this.debugMode);
          // get event index from value
          const getPrefix = /^\[[0-9]+\]/;
          const cleanPrefix = /\[|\]/g;
          const prefix = getPrefix.exec(value)[0];
          const eventIndex = parseInt(prefix.replace(cleanPrefix, ''));

          this.setState(stateIndex);

          const time = state.events[eventIndex].time;
          this.state.seek(time);
        });
      });

      const storedStateIndex = parseInt(window.localStorage.getItem(localStorageId));

      if (!this.debugMode) {
        if (Number.isInteger(storedStateIndex)) {
          this.view.model.state = 'choice';
          this.view.render();

          this.view.installEvents({
            'click #restart': () => {
              this.view.installEvents({}, true);
              this.view.model.state = 'experience';
              this.view.render();
              this.setState(0);
            },
            'click #continue': () => {
              this.view.installEvents({}, true);
              this.view.model.state = 'experience';
              this.view.render();
              this.setState(storedStateIndex);
            },
          }, true);
        } else {
          this.setState(0);
        }
      }
    });
  }

  // setup and start introduction (text + reading voice)
  setState(stateIndex) {
    console.log('setState', stateIndex);

    this.currentStateIndex = stateIndex;
    const config = this.appConfig;

    if (this.state) {
      this.state.exit();
      this.view.clear();
    }

    if (stateIndex < config.states.length) {
      const stateConfig = config.states[stateIndex];
      const commonConfig = config.common;

      this.state = new State(stateIndex, this, stateConfig, commonConfig);
      this.state.enter();

      window.localStorage.setItem(localStorageId, this.currentStateIndex);
      console.log('[localStorage] set stateIndex:', this.currentStateIndex);
    } else {
      console.log('this is the end...');
      window.localStorage.removeItem(localStorageId);
    }
  }
}

export default PlayerExperience;


