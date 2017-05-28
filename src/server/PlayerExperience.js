import { Experience } from 'soundworks/server';

const Slicer = require('node-audio-slicer').Slicer;

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType) {
    super(clientType);

    // services
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');
    this.audioBufferManager = this.require('audio-buffer-manager');
    this.osc = this.require('osc');
  }

  start() {
    // init streaming
    let audioFiles = [ 
      './public/streams/00-streaming.wav',
      './public/streams/01-streaming.wav',
      './public/streams/02-streaming.wav',
      './public/streams/03-streaming.wav',
      './public/streams/04-streaming.wav',
      './public/streams/05-streaming.wav',
      './public/streams/06-streaming.wav',
      './public/streams/07-streaming.wav',
      './public/streams/08-streaming.wav',
      './public/streams/09-streaming.wav',
      './public/streams/10-streaming.wav',
      './public/streams/11-streaming.wav',
      './public/streams/12-streaming.wav',
      './public/streams/13-streaming.wav',
      './public/streams/14-streaming-loop-infinite',
    ];
    prepareStreamChunks( audioFiles, (infos) => { this.bufferInfos = infos; });

    // sync. OSS client clock with server's (delayed in setTimeout for now because OSC not init at start.)
    setTimeout( () => {
      const clockInterval = 1; // refresh interval in seconds
      setInterval(() => { 
        this.osc.send('/clock', this.sync.getSyncTime()); 
      }, 1000 * clockInterval);
    }, 1000);    
  }

  enter(client) {
    super.enter(client);
    // send info on streamable files
    if( this.bufferInfos !== undefined ){
      this.send(client, 'stream:infos', this.bufferInfos);
    }

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

/*
* prepare chunks of files for streaming
* args: audioFiles: array of audio files to chunk
* callback: method launched when slicing over
*/
function prepareStreamChunks(audioFiles, callback) {
  // output array
  let bufferInfos = [];
  // init slicer
  let slicer = new Slicer({ format: 'auto', duration: 4 });
  // loop over input audio files
  audioFiles.forEach((item, id) => {
    // slice current audio file
    slicer.slice(item, (chunkList) => {
      // feed local array
      bufferInfos.push(chunkList);
      // return local map when all file a read
      if (bufferInfos.length >= audioFiles.length) {
        callback(bufferInfos);
      }
    });
  });
}