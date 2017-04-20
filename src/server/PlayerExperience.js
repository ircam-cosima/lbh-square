import { Experience } from 'soundworks/server';
import AudioStreamHandler from './AudioStreamHandler'

// convert "stringified numbers" (e.g. '10.100') element of arayIn to Numbers
Array.prototype.numberify = function() {
  this.forEach( (elmt, index) => {
  if( !isNaN(elmt) ) 
      this[index] = Number(this[index]);
    });
};

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType) {
    super(clientType);

    // services
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');
    this.osc = this.require('osc');
    this.sharedConfig = this.require('shared-config');
    // this.audioBufferManager = this.require('audio-buffer-manager');
    

    // locals
    let audioFiles = this.sharedConfig.get('streamedAudioFileNames');
    this.audioStreamHandler = new AudioStreamHandler( this, audioFiles );
  }

  // if anything needs to append when the experience starts
  start() {

    // send update msg to OSC client (e.g. if connected after some of the players / conductor)
    this.osc.receive('/updateRequest', (values) => { console.log('OSC client connected'); });

    // sync. OSS client clock with server's (delayed in setTimeout for now because OSC not init at start.)
    setTimeout( () => {
      const clockInterval = 0.1; // refresh interval in seconds
      setInterval(() => { 
        this.osc.send('/clock', this.sync.getSyncTime()); 
      }, 1000 * clockInterval);
    }, 1000);

    // automatically transfer player osc message 
    this.osc.receive('/player', (msg) => {
      let args = msg.split(' ');
      let header = args.shift();
      // convert "stringified numbers"
      args.numberify();
      // convert singleton array if need be
      args = (args.length == 1) ? args[0] : args;      
      this.broadcast('player', null, header, args);
    });

  }

  // if anything needs to happen when a client enters the performance (*i.e.*
  // starts the experience on the client side), write it in the `enter` method
  enter(client) {
    super.enter(client);
    this.audioStreamHandler.enter( client );
  }

  exit(client) {
    super.exit(client);
    // ...
  }
}
