import * as soundworks from 'soundworks/client';

import AudioPlayer from './AudioPlayer';
// import AudioStreamHandler from './AudioStreamHandler';
// import UglyAudioStream from './UglyAudioStream';
import AudioStream from './AudioStream';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const template = `
  <div class="background" id="background">
    <div class="bottom" id="background-banner" style="display:none">
      <p class="soft-blink-2 black-text">toucher l'écran une fois la position atteinte</p>
    </div>  
    <canvas id="backgroundCanvas">
    </canvas>
  </div>
  <div class="foreground" id="foreground">
    <div class="section-top flex-middle">
      <p class="big" id="foreground-title"><%= title %></p>
    </div>
    <div class="section-center flex-center">
      <p class="small" id="foreground-instructions"><%= instructions %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
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
    this.numberOfStates = 2;
    this.displayManager = new DisplayManager();

    // bind
    this.triggerNextState = this.triggerNextState.bind(this);
  }

  start() {
    super.start();

   // initialize the view
    let model = { title: '', instructions: '' };
    this.view = new soundworks.CanvasView(template, model, {}, {
      id: this.id,
      preservePixelRatio: true,
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

    // init locals
    this.audioPlayerTouch = new AudioPlayer(this.audioBufferManager.data.touch);
    this.audioPlayerImgPopup = new AudioPlayer(this.audioBufferManager.data.imgPopup);
    this.displayManager.start();    
    this.displayManager.setOpaque(1, 0);
    // un-hide banner for latter (it, for now, will still be hidden behind background)
    document.getElementById("background-banner").style.display='block';
    // start state machine
    this.triggerNextState();
  }

  triggerNextState() {
    // increment state id
    this.stateId += 1;

    // check if reached last state
    if( this.stateId > this.numberOfStates ){
      this.exit();
      return;
    }

    // trigger next state
    this.s = new State(this, this.stateId);
    if( this.stateId == 1 ){
      this.s.instructions = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vitae lacus molestie, bibendum diam vel, malesuada leo. Cras mattis consectetur ligula, non finibus sem. Sed porta mi eget porta varius. Pellentesque leo eros, dapibus commodo velit et, vehicula volutpat tortor.';
    }
    this.s.start();
  }

  exit() {
    // update server
    this.send('osc', [client.index, this.stateId, 0]);
    // display exit screen
    this.displayManager.title = 'Game Over';
    this.displayManager.instructions = 'thanks for playing';
    // remove background blinking text
    document.getElementById("background-banner").innerHTML = "";
  }

}

class State {
  constructor(experiment, id){

    this.e = experiment;
    this.id = id;

    this.title = 'Square ' + this.id;
    this.instructions = '';
    this.preStream = '0' + this.id + '-pre-image-streaming';
    this.postStream = '0' + this.id + '-image-streaming';
    this.image = '../images/' + this.id + '.JPG';
    this.timeBeforeImage = 2;
    this.timeBeforeTouchImage = 2;

    this.audioStream = new AudioStream(this.e, this.e.bufferInfos);
    this.audioStream.sync = false;
    this.audioStream.connect(audioContext.destination);

    // bind 
    this.setupTouchSurface = this.setupTouchSurface.bind(this);  
    this.touchCallback = this.touchCallback.bind(this);  
    this.exit = this.exit.bind(this);  
  }

  start(){
    // update server
    this.e.send('osc', [client.index, this.id, 0]);
    // set state view
    this.e.displayManager.title = this.title;
    this.e.displayManager.instructions = this.instructions;

    // start audio 
    this.audioStream.url = this.preStream;
    this.audioStream.loop = true;
    this.audioStream.start(0);

    // set callback to change stream / display image
    setTimeout( () => {
      // update server
      this.e.send('osc', [client.index, this.id, 1]);
      // display image
      this.e.displayManager.setImg(this.image);
      this.e.displayManager.setOpaque(0, 2);
      // notification sound for image display
      this.e.audioPlayerImgPopup.start(this.id-1, 0, 0);
      // setup touch callback after block time
      setTimeout( () => {
        this.setupTouchSurface();
      }, this.timeBeforeTouchImage * 1000);

    }, this.timeBeforeImage * 1000);

  }

  setupTouchSurface(){
    this.surface = new soundworks.TouchSurface(this.e.view.$el);
    this.surface.addListener('touchstart', this.touchCallback);
    window.addEventListener('click', this.touchCallback);
  }

  touchCallback(id, normX, normY){
    // update server
    this.e.send('osc', [client.index, this.id, 2]);
    // play touch notification sound
    this.e.audioPlayerTouch.start(this.id-1,0,0);
    // stop stream
    this.audioStream.stop(0);
    // change stream
    this.audioStream.url = this.postStream;
    this.audioStream.loop = false;
    this.audioStream.start(0);
    // setup switch to next state when image stream is over
    // const duration = this.audioStream.duration;
    const duration = 3; // DEBUG
    setTimeout( this.exit, duration * 1000);
    this.surface.removeListener('touchstart', this.touchCallback);
    window.removeEventListener('click', this.touchCallback);
  }

  exit(){
    // shut down audio stream
    this.audioStream.stop(0);
    // remove foreground text
    this.e.displayManager.title = '';
    this.e.displayManager.instructions = '';
    // fade off image
    const imageFadeOffDuration = 1;
    this.e.displayManager.setOpaque(1, imageFadeOffDuration);
    // trigger next state
    setTimeout( this.e.triggerNextState, (imageFadeOffDuration+0.3) * 1000);
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
    this.foreground.style.background = '#000000';
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




