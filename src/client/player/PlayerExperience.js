import * as soundworks from 'soundworks/client';

import AudioPlayer from './AudioPlayer';
// import AudioStreamHandler from './AudioStreamHandler';
// import UglyAudioStream from './UglyAudioStream';
import AudioStream from './AudioStream';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const viewTemplate = `
  <canvas class="background" id="background">
  </canvas>

  <div class="foreground" id="foreground">

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
    this.displayManager = new DisplayManager();
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
    this.displayManager.start();

    this.receive('stream:infos', ( bufferInfos ) => {
      // shape buffer infos
      bufferInfos.forEach( (item) => {
        // get file name (assume at least 1 chunk in item)
        let fileName = item[0].name.split("/").pop();
        fileName = fileName.substr(fileName.indexOf("-")+1, fileName.lastIndexOf(".")-2);
        // save in locals
        this.bufferInfos.set(fileName, item);
      });

      // debug: audio stream
      this.audioStream = new AudioStream(this, this.bufferInfos);
      this.audioStream.url = 'aphex-twin-vordhosbn-shortened';
      this.audioStream.loop = true;
      this.audioStream.sync = false;
      this.audioStream.connect(audioContext.destination);
      this.audioStream.start(0);
      
      // debug: display manager
      this.displayManager.setOpaque(1, 0.1);

      setInterval( () => {
        let imgId = Math.floor(Math.random() * 8) + 1;
        console.log('setImage', imgId)
        this.displayManager.setImg(imgId);
        this.displayManager.setOpaque(0, 1);
        setTimeout( () => {this.displayManager.setOpaque(1, 0.5)}, 2000 );
      }, 3000);
      // x.backgroundImage = "url('../images/IMG_1092.JPG')";

    });

    // this.uglyAudioStream = new UglyAudioStream();
    // this.uglyAudioStream.url = {file:'aphex-twin-vordhosbn', duration: 278};
    // this.uglyAudioStream.connect(audioContext.destination);
    // this.uglyAudioStream.start();
  }


}

class DisplayManager{
  constructor(){
    // init image files
    this.images = []
    for( let i = 1; i <=8; i++){ this.images.push('../images/' + i + '.JPG'); }
    
    // locals
    this.refreshRate = 100; // in ms
  }

  start(){
    // handle to foreground
    this.foreground = document.getElementById("foreground");
    this.foreground.style.background = '#000000';
    this.background = document.getElementById("background");

    this.setOpaque = this.setOpaque.bind(this)     
  }

  setImg(id){
    this.background.style.backgroundImage = "url('" + this.images[id-1] + "')";
  }

  setOpaque(onOff, fadeDuration){
    let oneMinusOne = onOff?1:-1
    const step = (this.refreshRate / 1000 ) / fadeDuration;
      
    console.log('SET OPAQUE')
    this.callback = setInterval( () => {
      let val = Number(this.foreground.style.opacity) + oneMinusOne*step;
      console.log('opacity', this.foreground.style.opacity)
      if( val >= 1.0 || val <= 0 ){ 
        this.foreground.style.opacity = (oneMinusOne === 1)? "1":"0";
        clearInterval( this.callback );
      }
      else{ this.foreground.style.opacity = String(val); }
    }, this.refreshRate);
  }

}




