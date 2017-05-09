import * as soundworks from 'soundworks/client';

import AudioPlayer from './AudioPlayer';
import AudioStream from './AudioStream';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const template = `
  <div class="background" id="background">
    <div class="bottom" id="background-banner" style="display:none" align="center">
      <p class="soft-blink-2 black-text">toucher l'écran une fois la position atteinte</p>
    </div>  
    <canvas id="backgroundCanvas">
    </canvas>
  </div>
  <div class="foreground" id="foreground">
    <div class="section-top flex-middle">
      <p class="big" id="foreground-title"><%= title %></p>
    </div>
    <div class="section-center flex-middle">
      <p class="small" id="foreground-instructions"><%= instructions %></p>
    </div>
    <div class="section-bottom flex-middle soft-blink">
      <p class="small" id="foreground-footer"></p>
    </div>
  </div>
`;


// Soundworks Square: part of L B H residence
export default class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain) {
    super();
    
    // services
    // this.platform = this.require('platform', { features: ['web-audio', 'wake-lock'] });
    this.platform = this.require('platform', { features: ['web-audio'] });
    console.warn('REMOVED PLATFORM WAVE-LOCK FOR DEBUG ON CHROME (100%CPU..)');
    this.sync = this.require('sync');
    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', {
      assetsDomain: assetsDomain,
      directories: { path: 'sounds', recursive: true },
    });
    // this.motionInput = this.require('motion-input', { descriptors: ['deviceorientation', 'accelerationIncludingGravity'] });

    // locals
    this.bufferInfos = new Map();
    this.readyToStart = 0;
    this.stateId = 0;
    this.numberOfStates = 8;
    this.displayManager = new DisplayManager();

    // states parameters
    this.sParams = {
      timeBeforeNewImageDisplayed : [19, 20, 19, 20, 19, 20, 19, 20],
      // timeBeforeNewImageDisplayed : [3,3,3,3,3,3,3,3],
    }

    // bind
    this.triggerNextState = this.triggerNextState.bind(this);
    this.touchCallback = this.touchCallback.bind(this);  
    this.exit = this.exit.bind(this);  
  }

  start() {
    super.start();

   // initialize the view
    let model = { title: '', instructions: '' };
    this.view = new soundworks.CanvasView(template, model, {}, {
      id: this.id,
      preservePixelRatio: true,
      ratios: {
      '.section-top': 0.1,
      '.section-center': 0.8,
      '.section-bottom': 0.1        
      }
    });

    // callback: receive stream info
    this.receive('stream:infos', ( bufferInfos ) => {
      // shape buffer infos
      bufferInfos.forEach( (item) => {
        // get file name (assume at least 1 chunk in item)
        let fileName = item[0].name.split("/").pop();
        fileName = fileName.substr(fileName.indexOf("-")+1, fileName.lastIndexOf(".")-2);
        // save in locals
        this.bufferInfos.set(fileName, item);
      });
      this.startWhenReady();
    });
    
    // as show can be async, we make sure that the view is actually rendered
    this.show().then(() => { this.startWhenReady(); });
  }

  // start mecanism: awaits both stream metadata and view render to start the experience
  startWhenReady(){
    // skip while not ready
    this.readyToStart += 1;
    if( this.readyToStart < 2 ){ return; }

    // notify server
    this.send('osc', [client.index, this.stateId, 0]);
    // init locals
    this.audioPlayerTouch = new AudioPlayer(this.audioBufferManager.data.touch);
    this.displayManager.start();    
    this.displayManager.setOpaque(1, 0);

    // setup description screen ----------------------------------------
    this.displayManager.title = 'SQUARE';
    this.displayManager.instructions = `
    Je suis née en Novembre 2331, ici à Paris. Fille de parents anglais venus en France à la recherche d'une fortune meilleure après la grandé crise d’Angleterre, c’est maintenant mon tour de partir, de tout laisser, pour chercher une alternative à ce lieu sans espoir.
    Voilà les derniers souvenirs que j'ai d'ici.
    <br> <br>

    De simple photos, des points de vue sur ce square qui m’est si cher.
    Pour suivre le fil rouge de mes souvenirs, tu devra me suivre, et littéralement te mettre à l'endroit d'où j'ai pris ces photos.
    Une image après l’autre, mon histoire.    
    `;
    // init local audio stream
    this.audioStream = new AudioStream(this, this.bufferInfos);
    this.audioStream.sync = false;
    let gainNode = audioContext.createGain();
    gainNode.gain.value = 0.05;
    gainNode.connect(audioContext.destination);
    this.audioStream.connect(gainNode);
    // start audio 
    this.audioStream.url = 'introduction';
    this.audioStream.loop = true;
    this.audioStream.start(0);
    setTimeout( () => {
      // set surface listener
      this.surface = new soundworks.TouchSurface(this.view.$el);
      this.surface.addListener('touchstart', this.touchCallback);
      window.addEventListener('click', this.touchCallback);
      // indicate click to go on 
      document.getElementById("foreground-footer").innerHTML = `toucher l'écran pour continuer`;
    }, 3 * 1000);
    // setup description screen ----------------------------------------
  }

  touchCallback(id, normX, normY){
    // remove listener from surface
    this.surface.removeListener('touchstart', this.touchCallback);
    window.removeEventListener('click', this.touchCallback);
    // remove footer
    document.getElementById("foreground-footer").innerHTML = '';
    // stop audio stream
    this.audioStream.stop(0);
    // set opaque background
    this.displayManager.setOpaque(1, 0);
    // start state machine
    this.triggerNextState();
  }


  triggerNextState() {
    // increment state id
    this.stateId += 1;
    // check if reached last state
    if( this.stateId > this.numberOfStates ){
      // plan exit
      const waitBeforeEndDisplay = 4;
      setTimeout( this.exit, waitBeforeEndDisplay * 1000 );
      return;
    }
    // trigger next state
    this.s = new State(this, this.stateId);
    this.s.start();
  }

  exit() {
    // update server
    this.send('osc', [client.index, this.stateId, 0]);
    // display exit screen
    this.displayManager.title = 'FIN';
    this.displayManager.instructions = 'Lorenzo Bianchi Hoesch <br> <br> www.lorbi.info';
    // remove background blinking text
    document.getElementById("background-banner").innerHTML = "";
    // fade off image
    const imageFadeOffDuration = 1;
    this.displayManager.setOpaque(1, imageFadeOffDuration);
  }

}

class State {
  constructor(experiment, id){

    // parameters / options
    this.e = experiment;
    this.id = id;

    // locals
    this.title = 'ecoute';
    this.instructions = '';
    this.streamUrl = '0' + this.id + '-streaming';
    this.image = '../images/' + this.id + '.jpg';
    this.timeBeforeNewImageDisplayed = this.e.sParams.timeBeforeNewImageDisplayed[this.id-1];
    this.timeBeforeTouchImage = 2;

    // init local audio stream
    this.audioStream = new AudioStream(this.e, this.e.bufferInfos);
    this.audioStream.sync = false;
    if( this.id == 3 ){ this.audioStream.sync = true; }
    this.audioStream.connect(audioContext.destination);

    // bind 
    this.setupTouchSurface = this.setupTouchSurface.bind(this);  
    this.touchCallback = this.touchCallback.bind(this);  
  }

  start(){
    // notify server
    this.e.send('osc', [client.index, this.id, 0, this.e.sync.getSyncTime()]);
    // set state view
    this.e.displayManager.title = this.title;
    this.e.displayManager.instructions = this.instructions;
    // start audio 
    this.audioStream.url = this.streamUrl;
    this.audioStream.loop = true;
    this.audioStream.start(0);

    // set callback to change stream / display image
    setTimeout( () => {
      // notify server
      this.e.send('osc', [client.index, this.id, 1]);
      // display image
      this.e.displayManager.setImg(this.image);
      this.e.displayManager.setOpaque(0, 2);
      // un-hide banner
      document.getElementById("background-banner").style.display='block';      
      // setup touch callback after block time
      setTimeout( () => {
        this.setupTouchSurface();
      }, this.timeBeforeTouchImage * 1000);

    }, (this.timeBeforeNewImageDisplayed) * 1000);

  }

  setupTouchSurface(){
    this.surface = new soundworks.TouchSurface(this.e.view.$el);
    this.surface.addListener('touchstart', this.touchCallback);
    window.addEventListener('click', this.touchCallback);
  }

  touchCallback(id, normX, normY){
    // play touch notification sound
    this.e.audioPlayerTouch.start(this.id-1,0,0);
    // hide banner
    document.getElementById("background-banner").style.display='none';
    // stop stream
    this.audioStream.stop(0);
    // fade off image
    const imageFadeOffDuration = 1;
    this.e.displayManager.setOpaque(1, imageFadeOffDuration);    
    // setup switch to next state when image stream is over
    // const duration = this.audioStream.duration;
    this.surface.removeListener('touchstart', this.touchCallback);
    window.removeEventListener('click', this.touchCallback);
    // trigger state change
    this.e.triggerNextState();
  }

}

class DisplayManager{
  constructor(){
    // locals
    this.refreshRate = 20; // in ms
  }

  start(){
    // handle to foreground
    this.foreground = document.getElementById("foreground");
    this.background = document.getElementById("background");
  }

  setImg(url){
    this.background.style.backgroundImage = "url('" + url + "')";
    // this.background.style.backgroundImage = "url('../images/1.JPG')";
  }

  set title(str){
    document.getElementById("foreground-title").innerHTML = str;    
  }

  set instructions(str){
    document.getElementById("foreground-instructions").innerHTML = str;    
  }

  setOpaque(onOff, fadeDuration){
    let oneMinusOne = onOff ? 1 : -1;
    
    // immediate fade
    if( fadeDuration <= this.refreshRate/1000 ){
      this.foreground.style.opacity = onOff;
      return;
    }

    // progressive fade
    const step = (this.refreshRate / 1000 ) / fadeDuration;
    this.callback = setInterval( () => {
      let val = Number(this.foreground.style.opacity) + oneMinusOne*step;
      if( val >= 1.0 || val <= 0 ){ 
        this.foreground.style.opacity = (oneMinusOne === 1)? "1":"0";
        clearInterval( this.callback );
      }
      else{ this.foreground.style.opacity = String(val); }
    }, this.refreshRate);
  }

}




