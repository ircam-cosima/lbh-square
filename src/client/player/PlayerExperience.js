import * as soundworks from 'soundworks/client';

import AudioPlayer from './audio/AudioPlayer';

import State from './states/State';
import StateIntro from './states/StateIntro';
import StateEnd from './states/StateEnd';

import * as utils from './misc/utils';
import './misc/googleAnalytics'

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


class PlayerExperience extends soundworks.Experience {
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
      `I turned around, walked two or three steps to breathe more easily. I looked up towards this part of the sky that is my own.`,
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

      // these times are absolute, from the start of the current state's audio stream file
      timeBeforeNewImageDisplayed : [52.6, 59, 80, 19.2, 16.5, 26, 40.5, 317, 112, 25, 98, 8.2, 31.5, 10.5],
      // these times are relative, from the moment the image is displayed:
      timeBeforeNewImageClickable : [10, 7, 11, 2, 2, 20, 25, 20, 2, 20, 18, 60, 25, 10],
      // these times are absolute, from the start of the current state's audio stream file
      timeBeforeSubtitleDisplayed: [0.1, 2, 3.5, 0.1, 0.1, 0.1, 2.5, 6, 1, 2, 0.1, 3, 16, 0.1], // in sec, first is dummy for intro defines its own times
      // these times are relative, from the moment the image is displayed:
      timeBeforeSubtitleImgDisplayed: [4, 4.5, 6, 3.5, 0.1, 4, 6.6, 3.5, 0.1, 3, 6.6, 3.2, 11, 0.1], // in sec

      // // debug: avoid waiting hours for tests
      // timeBeforeNewImageDisplayed : [1,1,1,1,1,1,1,1,1,1,1,1,1,10.5],
      // timeBeforeNewImageClickable : [1,1,1,1,1,1,1,1,1,1,1,1,1,10],
      // timeBeforeSubtitleImgDisplayed : [2,2,2,2,2,2,2,2,2,2,2,2,2,2], // in sec
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
        fileName = fileName.substr(fileName.indexOf("-") + 1, fileName.lastIndexOf(".") - 2);
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

    // debug: change init state
    // this.stateId = 1; this.triggerNextState(); return;

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

export default PlayerExperience;


