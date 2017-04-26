import * as soundworks from 'soundworks/client';

import AudioPlayer from './AudioPlayer';
// import AudioStreamHandler from './AudioStreamHandler';
// import UglyAudioStream from './UglyAudioStream';
import AudioStream from './AudioStream';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">

    <div class="section-top flex-middle">
      <p id="title" class="big"> <%= title %> </p>
    </div>

    <div class="section-center flex-center">
      <p id="instructions" class"small"> ••• </p>
    </div>

    <div class="section-bottom flex-middle">
      <p id="value0" class="small"><%= 'NaN' %></p>
      <p id="value1" class="small"><%= 'NaN' %></p>
      <p id="value2" class="small"><%= 'NaN' %></p>      
    </div>

  </div>
`;


// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain, audioFiles) {
    super();
    
    // services
    // this.platform = this.require('platform', { features: ['web-audio', 'wake-lock'] });
    this.platform = this.require('platform', { features: ['web-audio'] });
    console.warn('REMOVED PLATFORM WAVE-LOCK FOR DEBUG ON CHROME (100%CPU..)');
    this.sync = this.require('sync');
    this.checkin = this.require('checkin', { showDialog: false });
    // this.audioBufferManager = this.require('audio-buffer-manager', { files: audioFiles });
    // this.motionInput = this.require('motion-input', { descriptors: ['deviceorientation', 'accelerationIncludingGravity'] });

    // locals
    this.bufferInfos = new Map();

    // bind
    // this.method = this.method.bind(this);
    
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: 'Square, id: ' + client.index, instructions: 'browse paris soundscape' };
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView(); 
  }

  start() {
    super.start();
    if (!this.hasStarted){  this.init(); }
    this.show();

    this.receive('stream:infos', ( bufferInfos ) => {
      // shape buffer infos
      bufferInfos.forEach( (item) => {
        // get file name (assume at least 1 chunk in item)
        let fileName = item[0].name.split("/").pop();
        fileName = fileName.substr(fileName.indexOf("-")+1, fileName.lastIndexOf(".")-2);
        // save in locals
        this.bufferInfos.set(fileName, item);
      });

      // debug: init audio stream
      this.audioStream = new AudioStream(this, this.bufferInfos);
      // this.audioStream.url = 'aphex-twin-vordhosbn-shortened';
      // this.audioStream.url = 'virtual_barber_shop-shortened';
      this.audioStream.url = 'virtual_barber_shop-shortened';
      this.audioStream.loop = true;
      this.audioStream.sync = true;
      this.audioStream.connect(audioContext.destination);
      this.audioStream.start(0);
      setTimeout( () => {
        this.audioStream.stop(5);
        this.audioStream.url = 'aphex-twin-vordhosbn-shortened';
        this.audioStream.sync = false;
        this.audioStream.start(6);
      }, 5000);
      
    });

    // this.audioStreamHandler = new AudioStreamHandler( this, this.streamableAudioFiles, () => {
    //   // stream audio file
    //   const startTime = this.sync.getSyncTime();
    //   let fileName = 'virtual-barber-shop.wav'; 
    //   // start sound
    //   this.audioStreamHandler.start(fileName, startTime, 0.1, true, 1.0);
    // });

    // this.uglyAudioStream = new UglyAudioStream();
    // this.uglyAudioStream.url = {file:'aphex-twin-vordhosbn', duration: 278};
    // this.uglyAudioStream.connect(audioContext.destination);
    // this.uglyAudioStream.start();
  }


}