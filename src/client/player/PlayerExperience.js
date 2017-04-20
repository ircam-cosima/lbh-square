import * as soundworks from 'soundworks/client';

import AudioPlayer from './AudioPlayer';
import AudioStreamHandler from './AudioStreamHandler';

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
    this.platform = this.require('platform', { features: ['web-audio'] });
    this.sync = this.require('sync');
    this.checkin = this.require('checkin', { showDialog: false });
    // this.audioBufferManager = this.require('audio-buffer-manager', { files: audioFiles });
    // this.motionInput = this.require('motion-input', { descriptors: ['deviceorientation', 'accelerationIncludingGravity'] });
    this.rawSocket = this.require('raw-socket');
    this.sharedConfig = this.require('shared-config', { items: ['streamedAudioFileNames'] });
    // this.geolocation = this.require('geolocation', { debug:false, state:'start', enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 } );

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

    // init audio players
    this.streamableAudioFiles = client.config.streamedAudioFileNames.map( (x) => { return x.replace(/^.*[\\\/]/, ''); });
    this.audioStreamHandler = new AudioStreamHandler( this, this.streamableAudioFiles, () => {

      // stream audio file
      const startTime = this.sync.getSyncTime();
      let fileName = 'virtual-barber-shop.wav'; 
      // start sound
      this.audioStreamHandler.start(fileName, startTime, 0.1, true, 1.0);
      
    });

  }


}