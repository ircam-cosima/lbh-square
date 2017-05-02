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
  }

  start() {
    // init streaming
    let audioFiles = [ 
      './public/streams/01-image-streaming.wav',
      './public/streams/01-pre-image-streaming.wav',
      './public/streams/02-image-streaming.wav',
      './public/streams/02-pre-image-streaming.wav',
    ];
    prepareStreamChunks( audioFiles, (infos) => { this.bufferInfos = infos; });
  }

  enter(client) {
    super.enter(client);
    // send info on streamable files
    if( this.bufferInfos !== undefined ){
      this.send(client, 'stream:infos', this.bufferInfos);
    }
  }

  exit(client) {
    super.exit(client);
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