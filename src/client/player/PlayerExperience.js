import * as soundworks from 'soundworks/client';

import AudioPlayer from './AudioPlayer';
import AudioStream from './AudioStream';
import './googleAnalytics'
var utils = require('./utils');

const audioContext = soundworks.audioContext;
const client = soundworks.client;
const streamLoopFileName = '14-streaming-loop-infinite';
const numDaysCookieValid = 1; // number of days cookies are valid (for restarting exp. not from beginning)

const template = `
  <div class="background bkg-img" id="background">
    <div class="bottom" id="background-banner" style="display:none" align="center">
      <p class="soft-blink-2 black-text-banner">toucher l'écran une fois la position atteinte</p>
    </div>  
    <div class="middle flex-middle">
      <p class="black-text" id="background-instructions"></p>
    </div>      
    <canvas id="backgroundCanvas">
    </canvas>
  </div>
  <div class="foreground" id="foreground">
    <div class="section-top flex-middle">
      <p class="big" id="foreground-title"><%= title %></p>
    </div>
    <div class="section-center flex-middle">
      <p class="medium" id="foreground-instructions"><%= instructions %></p>
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
    this.motionInput = this.require('motion-input', { descriptors: ['deviceorientation'] });

    // locals
    this.bufferInfos = new Map();
    this.readyToStart = 0;
    this.stateId = 0;
    this.displayManager = new DisplayManager();
    this.cookieState = 0;

    // states parameters
    this.sParams = {
      subtitles: [
      ``, // introduction
      `Here is where I grew up, me, my kids, my nephews...`, // state 1
      `I think I read something about the couple who created this fountain, more than 3 centuries ago.
      I remember this sentence that the lady who made these sculptures, once full of colors and their feet in water, wrote.
      <br> <br> 
      "I am blind, my sculptures are my eyes, imagination is the rainbow, hapyness is the imagination, imagination exists."`,
      ``,
      ``,
      ``,
      `There is no synagogue, church, polis, ethnic community, that does not deserve to be abandonned.`,
      `It's here, taking this picture, that I made my mind to leave.`,
      `I closed my eyes to get used not to see this place anymore. <br> <br> I'm blind.`,
      `Allo? Hi it's me, is it true what they say, you're leaving? yeah, I'm heading south, looking for a job.
      Heading to Marseille? Yeah, and then further south. You want to cross the sea and go to Bechar? 
      Yeah, and then further south. You go to Beni Abbes?`,
      ``,
      `Imagination exists`,
      `I finally did not go in there. <br> <br> Too much noise, <br> too many people.`,
      ``,
      ],

      subtitlesImg: [
      `The first photo just showed up. A viewpoint so ordinary, declining.`,// introduction
      `Another photo, an animal`,
      `I then turned around and took a few pictures to bring with me.`, // state 1
      `You're heading to Marseille?`,
      `My memories were grim`,
      `Then I continued, to the end of the square, towards the church.`,
      `I hesitated to get in or not, then I mustered the courage and walked in.`,
      `I came out through the same door I went in, slowly. I sat down on the steps, amongst other people.`,
      ``,
      `I opened my eyes, stood up, and heading to my right walked towards home.`,
      `Before leaving, I told myself that I had to take a moment to sit and give this place a proper goobye. 
       I searched for a café around me.`,
      `Slowly, I arrived to the last café of the square.`,
      `I turned around, walked two or three steps to breathe more easily. <br> <br> I looked up towards this part of the sky that is my own.`,
      ``,
      ],

      // need to change text color for contrast over images
      subtitlesClass: [
      'black-text',
      'white-text',
      'white-text-bold',
      'black-text-bold',
      'black-text',
      'black-text',
      'white-text-bold',
      'white-text-bold',
      '',
      'white-text-bold',
      'black-text-bold',
      'white-text',
      'white-text',
      ],

      timeBeforeNewImageDisplayed : [52.6, 59, 80, 19.2, 16.5, 26, 40.5, 317, 112, 25, 98, 8.2, 31.5, 10.5],
      timeBeforeNewImageClickable : [10, 7, 11, 2, 2, 20, 25, 20, 2, 20, 18, 60, 25, 10],

      // debug: avoid waiting hours for tests
      // timeBeforeNewImageDisplayed : [1,1,1,1,1,1,1,1,1,1,1,1,1,10.5],
      // timeBeforeNewImageClickable : [1,1,1,1,1,1,1,1,1,1,1,1,1,10],
    }
    this.numberOfStates = this.sParams.timeBeforeNewImageDisplayed.length - 1; // -1 to account for end state time

    // bind
    this.triggerNextState = this.triggerNextState.bind(this);
    this.touchCallback = this.touchCallback.bind(this);  
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

    // init locals
    this.audioPlayerTouch = new AudioPlayer(this.audioBufferManager.data.touch);
    this.displayManager.start();    
    this.displayManager.setOpaque(1, 0);

    // check if I've already undertaken part of the exp. lately (to propose the option to jump there directly)
    this.cookieState = Number(utils.getCookie('lastState'));

    // propose to restart exp. from where left last time
    if( this.cookieState > 0 && this.cookieState < this.numberOfStates ){ this.displaySelectionScreen(); }
    // start introduction
    else{ this.startIntro(); }
  }
  
  // setup and start introduction (text + reading voice)
  startIntro(){
    this.s = new StateIntro(this);
    this.s.start();
  }
   
  // function for restart option (from last state or from start)
  displaySelectionScreen(){
    // display image
    this.displayManager.setImg(soundworks.client.config.assetsDomain + 'images/' + 'start-options.jpg'); 
    this.displayManager.setOpaque(0, 0.3);
    // setup touch surface
    this.surface = new soundworks.TouchSurface(this.view.$el);
    this.surface.addListener('touchstart', this.touchCallback);
    window.addEventListener('click', this.touchCallback);
  }

  // touch callback for restart option (from last state or from start)
  touchCallback(id, normX, normY){
    // handle click scenario (id is then a MouseEvent, normX and normY are not defined)
    if( id.button !== undefined ){
      let event = id;
      normY = event.clientY / event.view.innerHeight;
    }
    // fade off image
    this.displayManager.setOpaque(1, 0);
    // remove touch callback
    this.surface.removeListener('touchstart', this.touchCallback);
    window.removeEventListener('click', this.touchCallback);
    // trigger from start
    if(normY < 0.5){ this.startIntro(); }
    else{
      this.stateId = this.cookieState - 1;
      this.triggerNextState();
    }
  }

  triggerNextState() {
    // debug: change init state
    // if( this.stateId === 0 ){ this.stateId = 11; }
    // increment state id
    this.stateId += 1;
    // update cookie
    utils.setCookie('lastState', this.stateId, numDaysCookieValid );
    // trigger next state
    if( this.stateId < this.numberOfStates ){
      this.s = new State(this, this.stateId);
      this.s.start();
    }
    else{ this.s = new StateEnd(this); this.s.start(); }
  }

}

class State {
  constructor(experiment, id){

    // parameters / options
    this.e = experiment;
    this.id = id;

    // locals
    this.title = 'écoute';
    this.instructions = this.e.sParams.subtitles[this.id];
    this.instructionsImg = this.e.sParams.subtitlesImg[this.id];
    this.instructionsImgClass = this.e.sParams.subtitlesClass[this.id];
    this.streamUrl = utils.padDigits(this.id, 2) + '-streaming';
    this.image = soundworks.client.config.assetsDomain + 'images/' + this.id + '.jpg';
    this.timeBeforeNewImageDisplayed = this.e.sParams.timeBeforeNewImageDisplayed[this.id];
    this.timeBeforeNewImageClickable = this.e.sParams.timeBeforeNewImageClickable[this.id];
    this.initOri = undefined;

    // init local audio stream
    this.audioStream = new AudioStream(this.e, this.e.bufferInfos);
    this.audioStream.sync = false;
    if( [7, 6, 5].indexOf(this.id) >= 0 ){ this.audioStream.sync = true; }

    // init channel splitter / merger used in audio panning
    this.stereoPanner = new StereoPanner();
    this.audioStream.connect(this.stereoPanner.in);
    this.stereoPanner.connect(audioContext.destination);

    // bind 
    this.setupTouchSurface = this.setupTouchSurface.bind(this);  
    this.setupMotionInput = this.setupMotionInput.bind(this);  
    this.motionInputCallback = this.motionInputCallback.bind(this);  
    this.touchCallback = this.touchCallback.bind(this);  
  }

  start(){
    // notify server
    this.e.send('osc', [client.index, this.id, 0, this.e.sync.getSyncTime()]);
    // set state view
    this.e.displayManager.title = this.title;
    this.e.displayManager.instructions = this.instructions;
    // setup motionInput
    this.setupMotionInput(true);
    // setup audio stream
    this.audioStream.url = this.streamUrl;
    this.audioStream.loop = false;
    // setup "on end of audio stream" callback
    this.audioStream.onended = function(){
      this.url = streamLoopFileName;
      this.loop = true;
      this.start(0);
    }
    // start audio stream
    if( [7, 6, 5].indexOf(this.id) >= 0 ){
      // get quantization offset
      let period = 2.76;
      const offset = this.e.sync.getSyncTime() % period; // mod sound period for quantization
      this.audioStream.start(offset);
    }
    else{
      this.audioStream.start(0);
    }

    // set callback to change stream / display image
    setTimeout( () => {
      // display image subtitles
      this.e.displayManager.instructionsImgClass = this.instructionsImgClass;
      this.e.displayManager.instructionsImg = this.instructionsImg;
      // notify server
      this.e.send('osc', [client.index, this.id, 1]);
      // display image
      this.e.displayManager.setImg(this.image);
      this.e.displayManager.setOpaque(0, 2);
      // setup touch callback after block time
      setTimeout( () => {
        // un-hide banner
        document.getElementById("background-banner").style.display='block';
        // setup touch callback
        this.setupTouchSurface();
      }, this.timeBeforeNewImageClickable * 1000);

    }, this.timeBeforeNewImageDisplayed * 1000);

  }

  setupTouchSurface(){
    this.surface = new soundworks.TouchSurface(this.e.view.$el);
    this.surface.addListener('touchstart', this.touchCallback);
    window.addEventListener('click', this.touchCallback);
  }

  touchCallback(id, normX, normY){
    // play touch notification sound
    this.e.audioPlayerTouch.start(this.id,0,0);
    // hide banner
    document.getElementById("background-banner").style.display='none';
    // hide subtitles
    this.e.displayManager.instructionsImg = '';
    // stop stream
    this.audioStream.stop(0);
    // fade off image
    const imageFadeOffDuration = 1;
    this.e.displayManager.setOpaque(1, imageFadeOffDuration);    
    // setup switch to next state when image stream is over
    // const duration = this.audioStream.duration;
    this.surface.removeListener('touchstart', this.touchCallback);
    window.removeEventListener('click', this.touchCallback);
    // remove motion input listener
    this.setupMotionInput(false);
    // trigger state change
    this.e.triggerNextState();
  }

  setupMotionInput(onOff){
    // discard if not available
    if (!this.e.motionInput.isAvailable('deviceorientation')) { return; }
    // setup motion input listeners
    if(onOff){ this.e.motionInput.addListener('deviceorientation', this.motionInputCallback); }
    else{ this.e.motionInput.removeListener('deviceorientation', this.motionInputCallback); }
    
  }

  // set left / right panning based on device orientation
  motionInputCallback(data) {
    // store first orientation value for rel. ori
    if( this.initOri === undefined ){ this.initOri = data[0]; }
    // get reverse orientation state (is subject facing opposite dir. 
    // from when they clicked on img, i.e. current state started)
    let rev = Math.cos( (data[0] - this.initOri) * (Math.PI / 180)) < 0;
    this.stereoPanner.inverseChannels(rev);
  }

}

class StateIntro extends State{
  constructor(experiment){
    super(experiment, 0);
    
    this.sParams = {
      textTimes: [0.01, 17, 27, 41], // in sec

      textFr:[
        `Mon histoire est vite racontée. Je suis née en Novembre 2331, ici à 
        Paris. Fille de parents anglais venus en France à la recherche d’une fortune 
        meilleure après la grande crise d’Angleterre,`,
        `c’est maintenant mon tour de
        partir, de tout laisser, pour chercher une alternative à ce lieu sans espoir. 
        Voilà les derniers souvenirs que j'ai d'ici.`,
        `Des simples photos, des points de vue sur ce square qui m’est si cher. Pour
        suivre le fil rouge de mes souvenirs, tu devras me suivre, et littéralement
        te mettre à l'endroit d'où j'ai pris ces photos.`,
        `Seulement une fois que tu auras trouvé le même point de vue de l’image, 
        tu devras cliquer sur l’image et suivre mon parcours. Une image après 
        l’autre, mon histoire.`
      ],

      textEn:[
        `My story is short to tell. I was born in November 2331, here in Paris.
        Daughter of English parents who came in France looking for a better 
        everyday fleeing the great depression,`,
        `it's now my turn to go away and leave everything to seek an alternative 
        to this hopeless place. These are the last memories I have from here.`,
        `A few pictures, viewpoints on this Square so dear to me. To follow 
        the thread of my memories, you'll have to follow me and literally adopt
        the viewpoint I had when I took these pictures.`,
        `Only once you've reach its viewpoint will you click on an image and 
        follow my journey. One image after the next, my story.`
      ],
    }; 

    // prepare on-image subtitles
    this.e.displayManager.instructionsImg = this.e.sParams.subtitlesImg[this.id];
  }

  start(){
    // notify server
    this.e.send('osc', [client.index, this.id, 0, this.e.sync.getSyncTime()]);
    // setup motionInput
    this.setupMotionInput(true);
    // setup audio 
    this.audioStream.url = this.streamUrl;
    this.audioStream.loop = false;
    // setup "on end of audio stream" callback
    this.audioStream.onended = function(){
      this.url = streamLoopFileName;
      this.loop = true;
      this.start(0);
    }    
    // start audio 
    this.audioStream.start(0);

    // setup main text and subtitles change callbacks
    for( let i = 0; i < this.sParams.textTimes.length; i++ ){
      setTimeout( () => {
        // display text
        this.e.displayManager.instructions = this.sParams.textFr[i] + '<br> <br>' + this.sParams.textEn[i];
      }, this.sParams.textTimes[i] * 1000 );
    }

    // set callback to change stream / display image
    setTimeout( () => {
      // notify server
      this.e.send('osc', [client.index, this.id, 1]);
      // display image
      this.e.displayManager.setImg(this.image);
      this.e.displayManager.setOpaque(0, 2);
      // setup touch callback after block time
      setTimeout( () => {
        // un-hide banner
        document.getElementById("background-banner").style.display='block';      
        // setup touch callback
        this.setupTouchSurface();
      }, this.timeBeforeNewImageClickable * 1000);

    }, (this.timeBeforeNewImageDisplayed) * 1000);

  }
}

class StateEnd extends State {
  constructor(experiment){
    super(experiment, experiment.numberOfStates);
    // specific title / instruction for end screen
    this.title = 'SQUARE';
    this.instructions = '';
  }

  start(){
    // notify server
    this.e.send('osc', [client.index, this.id, 0, this.e.sync.getSyncTime()]);
    // set state view
    this.e.displayManager.title = this.title;
    this.e.displayManager.instructions = this.instructions;
    // setup motionInput
    this.setupMotionInput(true);
    // setup audio stream
    this.audioStream.url = this.streamUrl;
    this.audioStream.loop = false;
    // setup "on end of audio stream" callback
    this.audioStream.onended = function(){}
    // start audio stream
    this.audioStream.start(0);
    // setup callback
    setTimeout( () => {
      // credits
      this.e.displayManager.instructions = `
        Concept et Création: Lorenzo Bianchi Hoesch <br> <br>
        Développement: David Poirier-Quinot <br>
        Voix principale: Deborah Lopatin <br>
        Violon: Szuhwa Wu <br>
        Trompette et voix: Amir el Saffar <br>
        Water Games: West Gaua
      `;
      setTimeout( () => {
        // touch callback to restart experiment
        this.setupTouchSurface();
        this.e.displayManager.footer = "toucher l'écran pour accéder à la page du projet";
      }, this.timeBeforeNewImageClickable * 1000 );
    }, this.timeBeforeNewImageDisplayed * 1000);
  }

  touchCallback(id, normX, normY){
    // play touch notification sound
    // this.e.audioPlayerTouch.start(this.id,0,0);
    // stop stream
    this.audioStream.stop(0);
    // redirect to project webpage
    location = "http://forumnet.ircam.fr/event/square-installation-interactive-lorenzo-bianchi-hoesch/";
  }
}


class DisplayManager{
  constructor(){
    // locals
    this.refreshRate = 20; // in ms
    this.callback = undefined;
  }

  start(){
    // handle to foreground
    this.foreground = document.getElementById("foreground");
    this.background = document.getElementById("background");
  }

  setImg(url){
    this.background.style.backgroundImage = "url('" + url + "')";
  }

  set title(str){
    document.getElementById("foreground-title").innerHTML = str;    
  }

  set instructions(str){
    document.getElementById("foreground-instructions").innerHTML = str;    
  }

  set instructionsImg(str){
    document.getElementById("background-instructions").innerHTML = str;    
  }  
  
  set instructionsImgClass(str){
    document.getElementById("background-instructions").className = str;
  }  

  set footer(str){
    document.getElementById("foreground-footer").innerHTML = str;    
  }

  setOpaque(onOff, fadeDuration){
    let oneMinusOne = onOff ? 1 : -1;
    
    // immediate fade
    if( fadeDuration <= this.refreshRate/1000 ){
      this.foreground.style.opacity = onOff;
      return;
    }
    
    // prepare fade mechanism: clear running fading interval if need be
    if( this.callback !== undefined ){
      clearInterval( this.callback );
      this.callback = undefined;
    }

    // progressive fade
    const step = (this.refreshRate / 1000 ) / fadeDuration;
    this.callback = setInterval( () => {
      let val = Number(this.foreground.style.opacity) + oneMinusOne*step;
      // finished fade: set final value and clear interval
      if( val >= 1.0 || val <= 1e-3 ){ 
        this.foreground.style.opacity = (oneMinusOne === 1)? "1":"0";
        clearInterval( this.callback );
        this.callback = undefined;
      }
      // ongoing fade: set opacity with new value
      else{ this.foreground.style.opacity = String(val); }
    }, this.refreshRate);
  }

}

class StereoPanner{
  constructor(){

    // locals
    this.inversed = false;

    // init channel splitter / merger used in audio panning
    this.splitter = audioContext.createChannelSplitter(2);
    this.merger = audioContext.createChannelMerger(2);
    this.gainLL = audioContext.createGain();
    this.gainLR = audioContext.createGain();
    this.gainRL = audioContext.createGain();
    this.gainRR = audioContext.createGain();
    this.gainLL.gain.value = 1.0;
    this.gainLR.gain.value = 0.0;
    this.gainRL.gain.value = 0.0;
    this.gainRR.gain.value = 1.0;

    // connect graph
    this.splitter.connect(this.gainLL, 0);
    this.splitter.connect(this.gainLR, 0);
    this.splitter.connect(this.gainRL, 1);
    this.splitter.connect(this.gainRR, 1);

    this.gainLL.connect(this.merger, 0, 0);
    this.gainLR.connect(this.merger, 0, 1);
    this.gainRL.connect(this.merger, 0, 0);
    this.gainRR.connect(this.merger, 0, 1);
  }

  get in(){
    return this.splitter;
  }

  connect(audioNode){
    this.merger.connect(audioNode);
  }

  inverseChannels(onOff){
    if( onOff && !this.inversed){
      this.rampGain(this.gainLL, 0);
      this.rampGain(this.gainLR, 1);
      this.rampGain(this.gainRL, 1);
      this.rampGain(this.gainRR, 0);
      this.inversed = true;
    }
    else if( !onOff && this.inversed ){
      this.rampGain(this.gainLL, 1);
      this.rampGain(this.gainLR, 0);
      this.rampGain(this.gainRL, 0);
      this.rampGain(this.gainRR, 1);
      this.inversed = false;
    }
  }

  rampGain(gNode, oneZero, rampDuration = 4.0){
    // handle envelope
    let now = audioContext.currentTime;
    gNode.gain.cancelScheduledValues(now);
    gNode.gain.setValueAtTime(gNode.gain.value, now);
    gNode.gain.linearRampToValueAtTime(oneZero, now + rampDuration);  
  }

}



