import * as soundworks from 'soundworks/client';

import AudioPlayer from './AudioPlayer';
// import AudioStreamHandler from './AudioStreamHandler';
// import UglyAudioStream from './UglyAudioStream';
import AudioStream from './AudioStream';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const template = `
  <canvas class="background" id="background"></canvas>
  <div class="foreground" id="foreground">
    <div class="section-top flex-middle">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-center flex-center">
      <p class="small"><%= instructions %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;


// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
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

    // bind
    // this.method = this.method.bind(this);
    
  }

  start() {
    super.start(); // don't forget this

   // initialize the view
    let model = { 
      title: '',
      instructions: ''
    };
    this.view = new soundworks.CanvasView(template, model, {}, {
      id: this.id,
      preservePixelRatio: true,
    });

    // receive stream info
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

    // console.log(this.audioBufferManager)
    // // initialize the view
    // let model = { 
    //   title: 'Square',
    //   instructions: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vitae lacus molestie, bibendum diam vel, malesuada leo. Cras mattis consectetur ligula, non finibus sem. Sed porta mi eget porta varius. Pellentesque leo eros, dapibus commodo velit et, vehicula volutpat tortor.'
    // };
    // this.view = new soundworks.CanvasView(template, model, {}, {
    //   id: this.id,
    //   preservePixelRatio: true,
    // });

    // // as show can be async, we make sure that the view is actually rendered
    // // this.show().then(() => {

      // // init locals
      // this.displayManager.start();
      // this.audioPlayer = new AudioPlayer(this.audioBufferManager.data);
      // this.audioPlayer.start(0);

      // PHASE: INTRODUCTION //

      // start introduction sound


      /////////////////////////


      //   // debug: audio stream
      //   // this.startAudioStream('aphex-twin-vordhosbn-shortened');

      // });
        
      // debug: display manager
      // this.displayManager.setOpaque(1, 0.1);
      // setInterval( () => {
      //   let imgId = Math.floor(Math.random() * 8) + 1;
      //   console.log('setImage', imgId)
      //   this.displayManager.setImg(imgId);
      //   this.displayManager.setOpaque(0, 1);
      //   setTimeout( () => {this.displayManager.setOpaque(1, 0.5)}, 2000 );
      // }, 3000);
      // x.backgroundImage = "url('../images/IMG_1092.JPG')";


      // // debug: surface control -> double tap to add streaming
      // const surface = new soundworks.TouchSurface(this.view.$el);
      // this.lastTouchTime = 0;
      // this.didDoubleTap = 0;
      // surface.addListener('touchstart', (id, normX, normY) => {
      //   if( (audioContext.currentTime - this.lastTouchTime) < 0.4 ){ // tap time in sec
      //     if( this.didDoubleTap == 0 ){
      //       this.startAudioStream('Poltergeist-Mike_Koenig-1605093045');
      //       let foreground = document.getElementById("foreground");
      //       foreground.style.background = '#ffa500';
      //       this.didDoubleTap = 1;
      //     }
      //   }
      //   this.lastTouchTime = audioContext.currentTime;
      // });

    // });


  }

  startWhenReady(){
    // skip while not ready
    this.readyToStart += 1;
    if( this.readyToStart < 2 ){ return; }

    // init locals
    this.audioPlayer = new AudioPlayer(this.audioBufferManager.data);

    // start state machine

    // STATE: INTRODUCTION
    this.s = new State(this, 0);
    this.s.title = 'Square';
    this.s.instructions = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vitae lacus molestie, bibendum diam vel, malesuada leo. Cras mattis consectetur ligula, non finibus sem. Sed porta mi eget porta varius. Pellentesque leo eros, dapibus commodo velit et, vehicula volutpat tortor.';
    this.s.preStream = 'aphex-twin-vordhosbn-shortened';
    this.s.postStream = 'virtual_barber_shop-shortened';
    this.s.image = '../images/1.JPG';
    this.s.timeBeforeImage = 3;
    this.s.start();
  }

  triggerNextState() {
    console.log('next state');
  }

}

class State {
  constructor(experiment){
    this.e = experiment;
    this.title = '';
    this.instructions = '';
    this.preStream = '';
    this.postStream = '';
    this.image = '';
    this.timeBeforeImage = 10;
    this.transitionSound = 0;

    this.audioStream = new AudioStream(this.e, this.e.bufferInfos);
    this.audioStream.loop = true;
    this.audioStream.sync = false;
    this.audioStream.connect(audioContext.destination);

    this.displayManager = new DisplayManager();  

    // bind 
    this.setupTouchSurface = this.setupTouchSurface.bind(this);  
  }

  start(){
    // set state view
    let model = { 
      title: this.title,
      instructions: this.instructions
    };
    this.e.view.model = model;
    this.e.view.render();

    this.displayManager.start();
    this.displayManager.setOpaque(1, 0);

    // start audio 
    this.audioStream.url = this.preStream;
    this.audioStream.start(0);

    // set callback to change stream / display image
    setTimeout( () => {
      // play transition sound
      this.e.audioPlayer.start(this.transitionSound,0,0);
      // stop stream
      this.audioStream.stop(0);
      // change stream
      this.audioStream.url = this.postStream;
      this.audioStream.start(0);
      // display image
      this.displayManager.setImg(this.image);
      this.displayManager.setOpaque(0, 2);
      // setup touch callback after block time
      console.log('TIMEOUT?')
      setTimeout( () => {
        console.log('ITMTIOE')
        this.setupTouchSurface();
      }, 3000);

    }, this.timeBeforeImage*1000);

  }

  setupTouchSurface(){
    console.log('setup touch surface')
    // debug: surface control -> double tap to add streaming
    const surface = new soundworks.TouchSurface(this.e.view.$el);
    surface.addListener('touchstart', (id, normX, normY) => {
      this.exit();
      this.e.triggerNextState();
    });    
  }

  exit(){
  }

}

class DisplayManager{
  constructor(){
    // locals
    this.refreshRate = 100; // in ms
  }

  start(){
    // handle to foreground
    this.foreground = document.getElementById("foreground");
    this.foreground.style.background = '#000000';
    this.background = document.getElementById("background");   
  }

  setImg(url){
    // this.background.style.backgroundImage = "url('" + url + "')";

    this.background.style.backgroundImage = "url('../images/1.JPG')";
  }

  setOpaque(onOff, fadeDuration){
    let oneMinusOne = onOff?1:-1
    const step = (this.refreshRate / 1000 ) / fadeDuration;

    this.callback = setInterval( () => {
      let val = Number(this.foreground.style.opacity) + oneMinusOne*step;
      // console.log('opacity', this.foreground.style.opacity)
      if( val >= 1.0 || val <= 0 ){ 
        this.foreground.style.opacity = (oneMinusOne === 1)? "1":"0";
        clearInterval( this.callback );
      }
      else{ this.foreground.style.opacity = String(val); }
    }, this.refreshRate);
  }

}




