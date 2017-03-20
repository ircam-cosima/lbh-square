import * as soundworks from 'soundworks/client';
import * as soundworksCordova from 'soundworks-cordova/client';

import AudioPlayer from './AudioPlayer';
import AudioStreamPlayer from './AudioStreamPlayer';
import AudioStreamHandler from './AudioStreamHandler';
import AmbisonicPlayer from './AmbisonicPlayer';
import PlayerRenderer from './PlayerRenderer';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">

    <div class="section-top flex-middle">
      <p id="title" class="big"> <%= title %> </p>
    </div>

    <div class="section-top flex-center">
      <button type="button" style="font-size:17pt;color:white;background-color:grey;"
      onclick="window.experience.onPlayClick();" > <br> Enable <br> <br> </button>
    </div>

    <div class="section-center flex-center">
      <p id="instructions"> ••• </p>
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

var arrayDist = function( a1, a2 ){
  if( a1.length !== a2.length ){ console.error('array must be the same length'); }
  let dist = 0;
  a1.forEach( (item1, index) => { 
    let item2 = a2[index];
    dist += Math.pow(item1 - item2, 2);
  });
  dist = Math.sqrt(dist);
  return dist;
}

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain, audioFiles) {
    super();
    
    // services
    this.platform = this.require('platform', { features: ['web-audio'] });
    this.platform.addFeatureDefinition( audioTag );
    this.platform.configure({ features: ['web-audio', 'audio-tag'] });    
    // this.platform = this.require('platform', { features: ['web-audio', 'audio-tag'] });

    this.sync = this.require('sync');
    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', { files: audioFiles });
    this.motionInput = this.require('motion-input', { descriptors: ['deviceorientation', 'accelerationIncludingGravity'] });
    this.rawSocket = this.require('raw-socket');
    this.sharedConfig = this.require('shared-config', { items: ['streamedAudioFileNames'] });

    // bind
    // this.initBeacon = this.initBeacon.bind(this);
    this.gpsCallback = this.gpsCallback.bind(this);
    this.soundGridCallback = this.soundGridCallback.bind(this);
    this.setNewZone = this.setNewZone.bind(this);

    // local attributes
    this.ambiFileId = -1;
    this.lastPos = [0,0,0]; // lat, long, time
    this.bonusBeaconActivated = false;
    
    this.doubleTouchWatcher = {lastTouchTime: 0, timeThreshold: 0.4} // in sec
  }

  init() {
    
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: 'Square, id: ' + client.index, 
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
    this.streamableAudioFiles = client.config.streamedAudioFileNames.map( (x) => { return x.replace(/^.*[\\\/]/, ''); });
    this.audioStreamHandler = new AudioStreamHandler( this, this.streamableAudioFiles );

    // init gps service
    this.geoloc = {
      refreshRateMs: 750, 
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
      // hysTime: 1.0, // in sec
      hysDistRatio: 1, // ratio of distNew / distOld must be above to change zone (one is no hyst., > 1 is conservative hyst.)
      refreshRateMs: 750,
      refToIntervalFunction: undefined,
      callback: this.soundGridCallback,
      zoneCenters: [ // latitude longitude pairs
        // equi distant points along stravinsky's length:
        [ 48.859830, 2.351469 ],
        [ 48.859586, 2.351277 ],
        [ 48.859286, 2.351059 ]
      ], 
      zoneColors: [
        [100, 0, 0],
        [0, 100, 0],
        [0, 0, 100]
      ],
      currentZoneId: -1,
      zoneSoundFileName: [
       'sounds/13_Misconceptions_About_Global_Warming_Cut.wav',
       'sounds/click_loop_square_120bpm.wav'
      ]
    }
    
    // callback: example of state machine controlled from OSC
    this.receive('enableSoundGrid', (onOff) => {
      if( onOff )
        this.soundGrid.refToIntervalFunction = setInterval( () => { this.soundGrid.callback(); }, this.soundGrid.refreshRateMs );
      else
        window.clearInterval( this.soundGrid.refToIntervalFunction );
    });

    // callback: debug ambisonic player
    this.receive('debugAmbisonicPlay', (args) => {
      let onOff = args.shift(); let fileId = args.shift();
      // this.ambisonicPlayer.stop(-1, 1.0); // stop all
      if( onOff ){ this.ambisonicPlayer.startSource( fileId, true, 1.0 ); }
      else{ this.ambisonicPlayer.stopSource( fileId, 1.0 ); }
    });

    // callback: debug ambisonic player
    this.receive('debugAmbisonicOri', (azimElev) => {
      this.ambisonicPlayer.setListenerAim(azimElev[0], azimElev[1]);
    });

    // callback: debug audioStream player
    this.receive('debugStreamPlay', (args) => {
      let onOff = args.shift(); let fileId = args.shift();
      // this.ambisonicPlayer.stop(-1, 1.0); // stop all
      if( onOff ){ this.audioStreamPlayer.start(this.soundGrid.zoneSoundFileName[fileId], 2.0, true, true); }
      else{ this.audioStreamPlayer.stop(this.soundGrid.zoneSoundFileName[fileId], 2.0); }
    });

    // callback: debug audioStreamHandler player
    this.receive('debugStreamHandlerPlay', (args) => {
      let onOff = args.shift(); let fileId = args.shift();  let startTime = args.shift();
      if( onOff ){ this.audioStreamHandler.start(this.streamableAudioFiles[fileId], startTime, 2.0, true); }
      else{ this.audioStreamHandler.stop(this.streamableAudioFiles[fileId], 1.0); }
    });

    // callback: debug audioStreamHandler player
    this.receive('debugSyncStream', (args) => {
      let onOff = args.shift(); let rendezVousTime = args.shift();
      if( onOff ){ 
        let delayedStartTime = rendezVousTime - this.sync.getSyncTime();
        if( delayedStartTime <= 0){ alert('too late to play; discard'); return; }
        console.log('rdv time:', rendezVousTime, 'i.e. start in:', delayedStartTime)
        this.audioStreamHandler.start(this.streamableAudioFiles[0], 2.0 - delayedStartTime, 0.2, true);
        
      }
      else{ this.audioStreamHandler.stop(this.streamableAudioFiles[0], 1.0); }
    });

    // setup motion input listener (update audio listener aim based on device orientation)
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

    // setup touch listeners (reset listener orientation on double touch)
    const surface = new soundworks.TouchSurface(this.view.$el);
    surface.addListener('touchstart', (id, normX, normY) => {
      // check if fast enough
      if( (audioContext.currentTime - this.doubleTouchWatcher.lastTouchTime) <= this.doubleTouchWatcher.timeThreshold ) {
        // reset listener orientation (azim only)
        this.ambisonicPlayer.resetListenerAim();
        // audio feedback
        this.audioPlayer.startSource(0, 0, false);
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
    navigator.geolocation.watchPosition( (position) => {
      this.geoloc.coords = [position.coords.latitude, position.coords.longitude];
      // document.getElementById("instructions").innerHTML =
      //   "Latitude: " + position.coords.latitude +
      //   "<br>Longitude: " + position.coords.longitude;      
      document.getElementById("title").innerHTML = Math.round( position.coords.accuracy * 10 ) / 10;
    },
    (error) => {
      document.getElementById("instructions").innerHTML = 'GPS UNAVAILABLE <br /> <br /> reason: <br />' + error.message;
      // this.renderer.setBkgColor([180, 40, 40]);
      // alert(error.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }

  soundGridCallback() {
    // define current zone
    let newZoneId = -1;
    let dist = Infinity; 
    let distTmp = 0;
    this.soundGrid.zoneCenters.forEach( (item, index) => {
      distTmp = arrayDist( item, this.geoloc.coords );
      if( distTmp < dist ){
        dist = distTmp;
        newZoneId = index;
      }
    });
    console.log('raw zone estimate (curr / new)', this.soundGrid.currentZoneId, newZoneId );

    // dbg zone detection
    let dbgStr = '';
    for( let i = 0; i < this.soundGrid.zoneCenters.length; i ++ ){
      dbgStr += i + ': ' 
      + Math.round( arrayDist( this.soundGrid.zoneCenters[i], this.geoloc.coords )  * 1000000 )
      + '  ('
      + Math.round((Math.abs( this.soundGrid.zoneCenters[i][0] - this.geoloc.coords[0] ) * 1000000)  )
      + ', '
      + Math.round((Math.abs( this.soundGrid.zoneCenters[i][1] - this.geoloc.coords[1] ) * 1000000)  )
      + ") <br>";
    }
    document.getElementById("instructions").innerHTML = dbgStr;

    // discard if new zone meaningless
    if( newZoneId === -1 || newZoneId === this.soundGrid.currentZoneId ){ return; }

    // new zone detected for the first time
    if( this.soundGrid.currentZoneId === -1 ){
      this.setNewZone( newZoneId ) ;
    }
    // new zone detected: apply hysteresis to check if dist is enough to trigger zone change
    else{
      // get dist from current and new zone
      let distFromCurrent = arrayDist( this.geoloc.coords, this.soundGrid.zoneCenters[this.soundGrid.currentZoneId] );
      let distFromNew = arrayDist( this.geoloc.coords, this.soundGrid.zoneCenters[newZoneId] );
      let distRatio = distFromCurrent / distFromNew;
      console.log( 'current dist ratio:', Math.round(distRatio*100)/100 );
      // discard if ratio not above threshold
      if( distRatio <= this.soundGrid.hysDistRatio ){ return; }
      // change zone otherwise
      this.setNewZone( newZoneId );
      console.log('!! Changed zone: new zone id:', newZoneId);
    }     
  }

  setNewZone(zoneId){
    // update local
    this.soundGrid.currentZoneId = zoneId;
    // update visual
    this.renderer.setBkgColor(this.soundGrid.zoneColors[zoneId]);
  }

  onPlayClick(){ 
    console.log('button clicked'); 
    
    this.geoloc.refToIntervalFunction = setInterval( () => { this.geoloc.callback(); }, this.geoloc.refreshRateMs );
    this.soundGrid.refToIntervalFunction = setInterval( () => { this.soundGrid.callback(); }, this.soundGrid.refreshRateMs );

    // let a = audioTagArray[0];
    // a.muted = !a.muted;

    // let s = audioContext.createMediaElementSource( a );
    // s.connect(audioContext.destination);
    // a.src = 'sounds/13_Misconceptions_About_Global_Warming_Cut.wav';
    // a.playbackRate = 0.6;
    // a.play();
  }

}
