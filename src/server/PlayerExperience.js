import { Experience } from 'soundworks/server';
import path from 'path';

class PlayerExperience extends Experience {
  constructor(clientType, appConfig) {
    super(clientType);

    this.appConfig = appConfig;
    // services
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');
    this.audioBufferManager = this.require('audio-buffer-manager');
    this.sharedParams = this.require('shared-params');

    // get all stream files from app configuration
    let streamFiles = appConfig.states.map(state => path.join('public', state.stream.file));
    streamFiles.push(path.join('public', appConfig.common.fallbackStream.file));
    // remove duplicates
    streamFiles = Array.from(new Set(streamFiles));

    this.audioStreamManager = this.require('audio-stream-manager', {
      audioFiles: streamFiles,
      compress: true,
      duration: 4,
      overlap: 0.1,
    });

    if (this.appConfig.environment.osc)
      this.osc = this.require('osc');
  }

  start() {
    // if osc sync clocks with max
    if (this.appConfig.environment.osc) {
      setInterval(() => {
        const syncTime = this.sync.getSyncTime();
        this.osc.send('/clock', syncTime);
      }, 1000);
    }
  }

  enter(client) {
    super.enter(client);

    if (this.appConfig.environment.osc) {
      this.receive(client, 'osc', (data) => {
        this.osc.send('/player', data);
      });
    }
  }

  exit(client) {
    super.exit(client);

    if (this.appConfig.environment.osc)
      this.osc.send('/player', [client.index, -1, 0]);
  }
}

export default PlayerExperience;
