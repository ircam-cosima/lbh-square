import * as soundworks from 'soundworks/client';
import * as utils from '../misc/utils';
import StereoPanner from '../audio/StereoPanner';
import AudioStream from '../audio/AudioStream';

const audioContext = soundworks.audioContext;
const client = soundworks.audioContext;

class State {
  constructor(experiment, id) {
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
    this.timeBeforeSubtitleImgDisplayed = this.e.sParams.timeBeforeSubtitleImgDisplayed[this.id];
    this.timeBeforeSubtitleDisplayed = this.e.sParams.timeBeforeSubtitleDisplayed[this.id];
    this.initOri = undefined;

    // init local audio stream
    // this.audioStream = new AudioStream(this.e, this.e.bufferInfos);
    this.audioStream = this.e.audioStreamManager.getAudioStream();

    if ([7, 6, 5].indexOf(this.id) >= 0)
      this.audioStream.sync = true;
    else
      this.audioStream.sync = false;

    this.audioStream.loop = false;

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

  start() {
    // notify server
    this.e.send('osc', [client.index, this.id, 0, this.e.sync.getSyncTime()]);
    // set state view
    this.e.displayManager.title = this.title;
    // setup motionInput
    this.setupMotionInput(true);
    // setup audio stream
    this.audioStream.url = this.streamUrl;
    this.audioStream.loop = false;
    // setup 'on end of audio stream' callback
    this.audioStream.onended = function() {
      // start fallback stream
      this.url = streamLoopFileName;
      this.loop = true;
      this.start(0);
    }

    // start audio stream
    if ([7, 6, 5].indexOf(this.id) >= 0){
      // get quantization offset
      let period = 2.76;
      const offset = this.e.sync.getSyncTime() % period; // mod sound period for quantization

      this.audioStream.start(offset);
    } else {
      this.audioStream.start(0);
    }
    // setup subtitles callback
    setTimeout( () => {
      // display subtitles
      this.e.displayManager.instructions = this.instructions;
    }, this.timeBeforeSubtitleDisplayed * 1000);

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
        document.getElementById('background-banner').style.display = 'block';
        // setup touch callback
        this.setupTouchSurface();
      }, this.timeBeforeNewImageClickable * 1000);
      // setup subtitles display callback
      setTimeout( () => {
        // display image subtitles
        this.e.displayManager.instructionsImgClass = this.instructionsImgClass;
        this.e.displayManager.instructionsImg = this.instructionsImg;
      }, this.timeBeforeSubtitleImgDisplayed * 1000);

    }, this.timeBeforeNewImageDisplayed * 1000);

  }

  setupTouchSurface() {
    this.surface = new soundworks.TouchSurface(this.e.view.$el);
    this.surface.addListener('touchstart', this.touchCallback);
    window.addEventListener('click', this.touchCallback);
  }

  touchCallback(id, normX, normY) {
    // play touch notification sound
    this.e.audioPlayerTouch.start(this.id, 0, 0);
    // hide banner
    document.getElementById('background-banner').style.display = 'none';
    // clear subtitles
    this.e.displayManager.instructionsImg = '';
    this.e.displayManager.instructions = '';
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

  setupMotionInput(onOff) {
    // discard if not available
    if (!this.e.motionInput.isAvailable('deviceorientation'))
      return;

    // setup motion input listeners
    if (onOff)
      this.e.motionInput.addListener('deviceorientation', this.motionInputCallback);
    else
      this.e.motionInput.removeListener('deviceorientation', this.motionInputCallback);

  }

  // set left / right panning based on device orientation
  motionInputCallback(data) {
    // store first orientation value for rel. ori
    if (this.initOri === undefined)
      this.initOri = data[0];

    // get reverse orientation state (is subject facing opposite dir.
    // from when current state started)
    let rev = Math.cos( (data[0] - this.initOri) * (Math.PI / 180)) < 0;
    this.stereoPanner.inverseChannels(rev);
  }
}

export default State;
