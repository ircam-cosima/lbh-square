import { Experience } from 'soundworks/server';

// const Slicer = require('node-audio-slicer').Slicer;

// server-side 'player' experience.
class PlayerExperience extends Experience {
  constructor(clientType, streamFiles) {
    super(clientType);

    // services
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');
    this.audioBufferManager = this.require('audio-buffer-manager');
    this.osc = this.require('osc');

    this.sharedParams = this.require('shared-params');

    this.audioStreamManager = this.require('audio-stream-manager', {
      audioFiles: streamFiles,
      compress: true,
      duration: 4,
      overlap: 0.1,
    });
  }

  start() {
    const clockInterval = 1; // refresh interval in seconds

    setInterval(() => {
      const syncTime = this.sync.getSyncTime();
      this.osc.send('/clock', syncTime);
    }, 1000 * clockInterval);
  }

  enter(client) {
    super.enter(client);

    // define osc msg routing
    this.receive(client, 'osc', (data) => {
      this.osc.send('/player', data);
    });

  }

  exit(client) {
    super.exit(client);
    this.osc.send('/player', [client.index, -1, 0]);
  }
}

export default PlayerExperience;
