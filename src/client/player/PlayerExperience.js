import * as soundworks from 'soundworks/client';
import * as soundworksCordova from 'soundworks-cordova/client';

import AudioPlayer from './AudioPlayer';
import AudioStreamPlayer from './AudioStreamPlayer';
import AmbisonicPlayer from './AmbisonicPlayer';
import PlayerRenderer from './PlayerRenderer';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const HYSTERESIS_DIST = 1.0; // in m
const HYSTERESIS_TIME = 1.0; // in sec

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">

    <div class="section-top flex-middle">
      <p class="big"> <%= title %> </p>
    </div>

    <div class="section-center flex-center">
      <button type="button" onclick="
      window.experience.onPlayClick();
      " >Click Me!</button>
    </div>


    <audio hidden id="audioElmt">
    </audio>

    <div class="section-center flex-center">
      <p id="instructions" class="button"> Test </p>
    </div>

    <div class="section-bottom flex-middle">
      <p id="value0" class="small"><%= 'NaN' %></p>
      <p id="value1" class="small"><%= 'NaN' %></p>
      <p id="value2" class="small"><%= 'NaN' %></p>      
    </div>

  </div>
`;

// Define audio-tag platform object -------------------
const NUMBER_OF_SIMULTANEOUS_STREAMED_AUDIOSOURCES = 2;
const audioTagArray = [];

const audioTag = {
  id: 'audio-tag',
  check: function() {
    return !!audioContext;
  },
  interactionHook: function() {
    // if( !client.platform.isMobile ){ return; }

    // create audio tag and start them to avoid requiring user input to start them latter
    for( let i = 0; i < NUMBER_OF_SIMULTANEOUS_STREAMED_AUDIOSOURCES; i++ ){
      let audioElmt = new Audio();
      audioElmt.play();      
      // audioElmt.play = () => { audioElmt.pause(); audioElmt.play = undefined; };
      audioTagArray.push(audioElmt);
    }
  }
}
// -----------------------------------------------------

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain, audioFiles) {
    super();
    
    // services
    this.platform = this.require('platform', { features: ['web-audio'] });
    this.platform.addFeatureDefinition( audioTag );
    this.platform = this.require('platform', { features: ['web-audio', 'audio-tag'] });

    this.sync = this.require('sync');
    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', { files: audioFiles });
    this.motionInput = this.require('motion-input', { descriptors: ['deviceorientation', 'accelerationIncludingGravity'] });
    

    // bind
    // this.initBeacon = this.initBeacon.bind(this);
    this.gpsCallback = this.gpsCallback.bind(this);
    this.soundGridCallback = this.soundGridCallback.bind(this);

    // local attributes
    this.ambiFileId = -1;
    this.lastPos = [0,0,0]; // lat, long, time
    this.bonusBeaconActivated = false;
    
    this.doubleTouchWatcher = {lastTouchTime: 0, timeThreshold: 0.4} // in sec
  }

  init() {
    
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: 'In the Square <br />' + client.index, 
                         instructions: 'browse paris soundscape' };
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView();
    this.renderer = new PlayerRenderer();
    this.view.addRenderer(this.renderer);    
  }

  start() {
    super.start();

    if (!this.hasStarted){
      // this.initBeacon();
      this.init();
    }
    this.show();

    // init audio players
    let roomReverb = false;
    this.ambisonicPlayer = new AmbisonicPlayer(roomReverb);
    this.audioPlayer = new AudioPlayer(this.audioBufferManager.audioBuffers.default);
    this.audioStreamPlayer = new AudioStreamPlayer(audioTagArray, this.sync);

    // init gps service
    this.geoloc = {
      refreshRateMs: 2000, 
      refToIntervalFunction: undefined, 
      coords: [NaN, NaN],
      callback: this.gpsCallback,
    };

    // callback: example of state machine controlled from OSC
    this.receive('enableGps', (onOff) => {
      if( onOff )
        this.geoloc.refToIntervalFunction = setInterval( () => { this.geoloc.callback(); }, this.geoloc.refreshRateMs );
      else
        window.clearInterval( this.geoloc.refToIntervalFunction );
    });

    // debug: fake GPS position
    this.receive('fakeGps', (coords) => { this.geoloc.coords = coords; });

    // init GPS zone based sounds
    this.soundGrid = {
      hysteresisTime: 1.0, // in sec
      hysteresisDistance: 1.0, // in m ... or lat / long deg value?
      refreshRateMs: 2000,
      refToIntervalFunction: undefined,
      callback: this.soundGridCallback,
      areaCenters: [ // longitude, latitude pairs
        // [ 2.3517, ? ]
        [1, 1],
        [1, 2],
        [2, 1],
        [2, 2],
      ]
    }
    
    // callback: example of state machine controlled from OSC
    this.receive('enableSoundGrid', (onOff) => {
      if( onOff )
        this.soundGrid.refToIntervalFunction = setInterval( () => { this.soundGrid.callback(); }, this.soundGrid.refreshRateMs );
      else
        window.clearInterval( this.soundGrid.refToIntervalFunction );
    });

    // // start audio automatically (debug)
    // this.counter = 0;
    // setInterval(()=>{
    //   let state = (this.counter % 4);
    //   this.counter += 1;
    //   console.log('debug state:', state);

    //   if( state == 0 ){
    //     this.audioStreamPlayer.start('sounds/13_Misconceptions_About_Global_Warming_Cut.wav', 2.0, true, true);
    //   }

    //   if( state == 1 ){
    //     this.audioStreamPlayer.stop('sounds/13_Misconceptions_About_Global_Warming_Cut.wav', 2.0);
    //   }
      
    //   if( state == 2 ){
    //     this.audioStreamPlayer.start('sounds/click_loop_square_120bpm.wav', 2.0, true, true);
    //   }

    //   if( state == 3 ){
    //     this.audioStreamPlayer.stop('sounds/click_loop_square_120bpm.wav', 2.0);
    //   }

    // }, 3000);

  
    this.azimIncr = 0;
    setInterval( () => {
      this.ambisonicPlayer.setListenerAim(this.azimIncr, 0);
      this.azimIncr += 2;
      if (this.azimIncr >= 360) this.azimIncr = 0;
    }, 100);  

    // window.addEventListener('deviceorientation', function(e) { console.log(e); }, true);

    // setup motion input listener (update audio listener aim based on device orientation)
    // console.log(this.motionInput.isAvailable('deviceorientation'), this.motionInput)
    if (this.motionInput.isAvailable('deviceorientation')) {
      this.motionInput.addListener('deviceorientation', (data) => {
        // console.log(data)
        // display orientation info on screen
        document.getElementById("value0").innerHTML = Math.round(data[0]*10)/10;
        document.getElementById("value1").innerHTML = Math.round(data[1]*10)/10;
        document.getElementById("value2").innerHTML = Math.round(data[2]*10)/10;
        // set audio source position
        // this.ambisonicPlayer.setListenerAim(data[0], data[1]);
      });
    }



    // create touch event source referring to our view
    const surface = new soundworks.TouchSurface(this.view.$el);
    // setup touch listeners (reset listener orientation on double touch)
    surface.addListener('touchstart', (id, normX, normY) => {
        if( (audioContext.currentTime - this.doubleTouchWatcher.lastTouchTime) <= this.doubleTouchWatcher.timeThreshold ) {
        // reset listener orientation (azim only)
        this.ambisonicPlayer.resetListenerAim();
        // audio feedback
        let src = audioContext.createBufferSource();
        src.buffer = this.audioBufferManager.audioBuffers.default[0];
        src.connect(audioContext.destination);
        src.start(audioContext.currentTime);

        // DEBUG
        this.audio.pause();
        this.streamSource = audioContext.createMediaElementSource(this.audio2);
        this.streamSource.connect(audioContext.destination);
        console.log('click');

        }
        // update last touch time
        this.doubleTouchWatcher.lastTouchTime = audioContext.currentTime;
    });

  }

  gpsCallback(){
    console.log('running gps callback');
    // discard if service not available
    if (!navigator.geolocation) { return; }
    // store current gps output to local attr
    navigator.geolocation.getCurrentPosition( (position) => {
      this.geoloc.coords = [position.coords.latitude, position.coords.longitude];
      document.getElementById("instructions").innerHTML =
        "Latitude: " + position.coords.latitude +
        "<br>Longitude: " + position.coords.longitude;      
    },
    (error) => {
      document.getElementById("instructions").innerHTML = 'GPS UNAVAILABLE <br /> (application disabled) <br /> <br /> reason: <br />' + error.message;
      // this.renderer.setBkgColor([180, 40, 40]);
      // alert(error.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }



  onPlayClick(){ console.log('click button'); }

  soundGridCallback() {

    // define current zone
    let zoneId = -1;
    let dist = Infinity; 
    let distTmp = 0;
    this.soundGrid.areaCenters.forEach( (item, index) => {
      distTmp = Math.sqrt( Math.pow( item[0] - this.geoloc.coords[0], 2)
                      + Math.pow( item[1] - this.geoloc.coords[1], 2) );
      if( distTmp < dist ){
        dist = distTmp;
        zoneId = index;
      }
    });

    console.log('current zone id:', zoneId, 'dist:', dist);

    // // get current zone (dummy for now)
    // let bkgColor = [0,0,0];
    // let newAmbiFileId = -1;
    // // if( position.coords.latitude > 48.8596 ){ // android
    // if( position.coords.longitude > 2.3517 ){ // ios
    //   newAmbiFileId = 0;
    //   bkgColor = [0,100,0];
    // } 
    // else{
    //   newAmbiFileId = 1;
    //   bkgColor = [0,0,100];            
    // }

    // if( newAmbiFileId != this.ambiFileId ){
    //   // update local
    //   // this.lastDistHysteresisTime = audioContext.currentTime;
    //   this.ambiFileId = newAmbiFileId;

    //   // update player
    //   this.ambisonicPlayer.stop(-1, 1.0);
    //   // this.ambisonicPlayer.startSource( this.ambiFileId, true, 1.0 );

    //   // update bkg color
    //   this.renderer.setBkgColor(bkgColor);
    // }
    // // debug: check callback still running
    // // this.renderer.setBkgColor([0, Math.round(200 * Math.random()), Math.round(200 * Math.random()) ]);

  }

  // enableGpsMode(){
    // // GPS Coordinates
    // if (navigator.geolocation) {
    //   const clockInterval = 2; // refresh interval in seconds
    //   this.geolocCallback = setInterval(() => {

    //   navigator.geolocation.getCurrentPosition(

    //       (position) => {

    //       // update GUI text
    //           document.getElementById("instructions").innerHTML =
    //             "Latitude: " + position.coords.latitude +
    //             "<br>Longitude: " + position.coords.longitude;

    //           // get current zone (dummy for now)
    //           let bkgColor = [0,0,0];
    //           let newAmbiFileId = -1;
    //           // if( position.coords.latitude > 48.8596 ){ // android
    //           if( position.coords.longitude > 2.3517 ){ // ios
    //             newAmbiFileId = 0;
    //             bkgColor = [0,100,0];
    //           } 
    //           else{
    //             newAmbiFileId = 1;
    //             bkgColor = [0,0,100];            
    //           }

    //           if( newAmbiFileId != this.ambiFileId ){
    //             // update local
    //             // this.lastDistHysteresisTime = audioContext.currentTime;
    //             this.ambiFileId = newAmbiFileId;

    //             // update player
    //             this.ambisonicPlayer.stop(-1, 1.0);
    //             // this.ambisonicPlayer.startSource( this.ambiFileId, true, 1.0 );

    //             // update bkg color
    //             this.renderer.setBkgColor(bkgColor);
    //           }
    //           // debug: check callback still running
    //           // this.renderer.setBkgColor([0, Math.round(200 * Math.random()), Math.round(200 * Math.random()) ]);

    //       }, 

    //       (error) => {
    //           // window.clearInterval(this.geolocCallback);
    //           document.getElementById("instructions").innerHTML = 'GPS UNAVAILABLE <br /> (application disabled) <br /> <br /> reason: <br />' + error.message;
    //           // this.renderer.setBkgColor([180, 40, 40]);
    //           // alert(error.message);
    //       }, 

    //       { enableHighAccuracy: true ,timeout : 10000, maximumAge: 10000}
    //   );

    //   }, GPS_UPDATE_RATE_MS * clockInterval );
    // }

  // }

}
