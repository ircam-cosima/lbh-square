import { Experience } from 'soundworks/server';

const Slicer = require('node-audio-slicer').Slicer;
const fs = require('fs');  // TODELETE

 // TODELETE
let s = new Date().toLocaleString();
s = s.replace(/[,]/g,'');
s = s.replace(/[\s\/:]/g,'-');
const logFilePath = 'log-info-' + s + '.txt';
// TODELETE

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType) {
    super(clientType);

    // services
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');
  }

  start() {
    // init streaming
    let audioFiles = [ 
      './public/streams/aphex-twin-vordhosbn-shortened.wav',
      './public/streams/Poltergeist-Mike_Koenig-1605093045.wav', // TODELETE
    ];
    prepareStreamChunks( audioFiles, (infos) => { this.bufferInfos = infos; });
    fs.exists(logFilePath, (exists) => { if(exists) { fs.unlink(logFilePath); } }); // TODELETE
  }

  enter(client) {
    super.enter(client);
    // send info on streamable files
    if( this.bufferInfos !== undefined ){
      this.send(client, 'stream:infos', this.bufferInfos);
    }
     // TODELETE
    this.receive(client, 'stream:drop', (id, url) => {
      this.addToLog( id + ' ' + this.sync.getSyncTime() + ' ' + url );
    });
    this.receive(client, 'stream:start', (id, url) => {
      this.addToLog( id + ' ON ' + this.sync.getSyncTime() + ' ' + url );
    });
     // TODELETE
  }

  exit(client) {
    super.exit(client);
    this.addToLog( client.index + ' OFF ' + this.sync.getSyncTime() );
  }

  // TODELETE
  addToLog(s){
    console.log('->', s);
    fs.appendFile(logFilePath, s + '\n', function (err) { if (err) throw err; });    
  }
  // TODELETE
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