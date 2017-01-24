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


    <audio controls id="audioElmt">
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

    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', { files: audioFiles });
    this.motionInput = this.require('motion-input', { descriptors: ['deviceorientation', 'accelerationIncludingGravity'] });
    

    // bind
    // this.initBeacon = this.initBeacon.bind(this);

    // local attributes
    this.audioStreamPlayer = new AudioStreamPlayer(audioTagArray);

    this.ambiFileId = -1;
    this.lastPos = [0,0,0]; // lat, long, time
    this.bonusBeaconActivated = false;
    this.geolocCallback = undefined;
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

    // audioTagArray[0].src = 'sounds/13_Misconceptions_About_Global_Warming_Cut.wav';
    // audioTagArray[0].play();
    // audioTagArray[1].src = 'sounds/click-loop-square-120bpm.wav';
    // audioTagArray[1].play();

    this.audioStreamPlayer.start('sounds/13_Misconceptions_About_Global_Warming_Cut.wav', true, 5, false)


    if (!this.hasStarted){
      // this.initBeacon();
      this.init();
    }
    this.show();

    // init HOA player
    let roomReverb = false;
    this.ambisonicPlayer = new AmbisonicPlayer(roomReverb);
    this.audioPlayer = new AudioPlayer(this.audioBufferManager.audioBuffers.default);

    // this.ambisonicPlayer.startSource( this.ambiFileId );
    // setTimeout( () => {
    //   this.ambisonicPlayer.startSource( 0 );}, 4000);    
  
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

    // GPS Coordinates
    if (navigator.geolocation) {
      const clockInterval = 2; // refresh interval in seconds
      this.geolocCallback = setInterval(() => {

      navigator.geolocation.getCurrentPosition(

          (position) => {

          // update GUI text
              document.getElementById("instructions").innerHTML =
                "Latitude: " + position.coords.latitude +
                "<br>Longitude: " + position.coords.longitude;

              // get current zone (dummy for now)
              let bkgColor = [0,0,0];
              let newAmbiFileId = -1;
              // if( position.coords.latitude > 48.8596 ){ // android
              if( position.coords.longitude > 2.3517 ){ // ios
                newAmbiFileId = 0;
                bkgColor = [0,100,0];
              } 
              else{
                newAmbiFileId = 1;
                bkgColor = [0,0,100];            
              }

              if( newAmbiFileId != this.ambiFileId ){
                // update local
                // this.lastDistHysteresisTime = audioContext.currentTime;
                this.ambiFileId = newAmbiFileId;

                // update player
                this.ambisonicPlayer.stop(-1, 1.0);
                // this.ambisonicPlayer.startSource( this.ambiFileId, true, 1.0 );

                // update bkg color
                this.renderer.setBkgColor(bkgColor);
              }
              // debug: check callback still running
              // this.renderer.setBkgColor([0, Math.round(200 * Math.random()), Math.round(200 * Math.random()) ]);

          }, 

          (error) => {
              // window.clearInterval(this.geolocCallback);
              document.getElementById("instructions").innerHTML = 'GPS UNAVAILABLE <br /> (application disabled) <br /> <br /> reason: <br />' + error.message;
              // this.renderer.setBkgColor([180, 40, 40]);
              // alert(error.message);
          }, 

          { enableHighAccuracy: true ,timeout : 10000, maximumAge: 10000}
      );

      }, 1000 * clockInterval );
    }

// var options = { enableHighAccuracy: true, maximumAge: 100, timeout: 60000 };
// var gotPos = function(pos) {console.log('gotPos:', pos)}
// var gotErr = function(err) {console.log('gotErr:', err)}
// if( navigator.geolocation) {
//    var watchID = navigator.geolocation.watchPosition( gotPos, gotErr, options );
//    var timeout = setTimeout( function() { navigator.geolocation.clearWatch( watchID ); }, 5000 );
// } else {
//    alert('no navigator available');
// }

    // else {
    //   document.getElementById("instructions").innerHTML = "Geolocation is not supported by this browser.";
    // }

    // // setup motion input listeners (shake to change listening mode)
    // if (this.motionInput.isAvailable('accelerationIncludingGravity')) {
    //   this.motionInput.addListener('accelerationIncludingGravity', (data) => {

    //       // get acceleration data
    //       const mag = Math.sqrt(data[0] * data[0] + data[1] * data[1] + data[2] * data[2]);

    //       // switch between spatialized mono sources / HOA playing on shaking (+ throttle inputs)
    //       if (mag > 40 && ( (audioContext.currentTime - this.lastShakeTime) > 0.5) ){
    //         // update throttle timer
    //         this.lastShakeTime = audioContext.currentTime;
    //         // switch mode
    //         if( this.audioMode == 0 ){
    //           this.audioMode = 1;
    //           this.spatSourceHandler.stop();
    //           this.ambisonicPlayer.startSource( this.ambiFileId, true, 0.0 );
    //         }
    //         else{
    //           this.audioMode = 0;
    //           this.ambisonicPlayer.stop(); 
    //           this.spatSourceHandler.startAll();
    //         }
    //       }
    //   });
    // }

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


    // Create an <audio> element dynamically.
    // this.audio = new Audio();
    this.audio = document.getElementById("audioElmt");

    // this.audio.oncanplaythrough = () => {
    //   console.log('finished loading');
    //   // alert("Can play through audio without stopping");
    //   this.audio.play();
    //   };   

    // this.audio.src = 'sounds/Boucle_FranceInfo_Regie_Ambi_01_01-04ch.wav';
    this.audio.src = 'sounds/Orchestre_Ambi_Montage10Cordes_01-04ch.mp3';
    this.audio.controls = true;
    this.audio.autoplay = true;
    this.audio.loop = true;
    this.audio.muted = false;
    document.body.appendChild(this.audio);
    console.log(this.audio);
    console.log(window)

    // setTimeout( () => {
    //   this.audio.src = 'sounds/Boucle_Hall_Ambi_01_01-04ch.mp3';
    //   console.log('timeout');}, 20000);

    // example how to pause / stop source
    // audio.pause();
    // audio.currentTime = 10000;
    // audio.play(); 
    // this.audio.play();

    // Wait for window.onload to fire. See crbug.com/112368
    

    // var gainOut = audioContext.createGain();
    // gainOut.gain.value = 1.0;
    // gainOut.connect(this.ambisonicPlayer.rotator.in);
    // gainOut.connect(audioContext.destination);
    // Our <audio> element will be the audio source.
    this.streamSource = audioContext.createMediaElementSource(this.audio);
    // this.streamSource.channelCountMode = 'explicit';
    // this.streamSource.channelCount = 4;

    var inA = audioContext.createChannelSplitter(4);
    var outA = audioContext.createChannelMerger(4);

    // inA.channelCountMode = 'explicit';
    // inA.channelCount = 4;

    // outA.channelCountMode = 'explicit';
    // outA.channelCount = 4;    

    // this.out.channelCount = 1;

    this.streamSource.connect(inA);
    // inA.connect(outA, 0,0);
    // inA.connect(outA, 1,1);
    // inA.connect(outA, 2,2);
    // inA.connect(outA, 3,3);
    for (let i = 0; i < 4; i++) {
      inA.connect(outA, i, i);
      // outA.connect(this.ambisonicPlayer.rotator.in, i, i);
    }
    
    console.log(inA)
    console.log(outA)
    console.log(this.ambisonicPlayer.rotator.in)
    

    // inA.connect(outA);

    outA.connect(this.ambisonicPlayer.rotator.in);

    // this.streamSource.connect(inA);


    // this.streamSource.connect(this.ambisonicPlayer.rotator.in);

    console.log(this.streamSource);


  }

  onPlayClick(){
    console.log('hfods')
    document.getElementById('audioElmt').play();
  }

  // -------------------------------------------------------------------------------------------
  // BEACON-RELATED METHODS
  // -------------------------------------------------------------------------------------------

  // initBeacon() {

  //   // initialize ibeacon service
  //   if (this.beacon) {
  //     // add callback, invoked whenever beacon scan is executed
  //     this.beacon.addListener(this.beaconCallback);
  //     // fake calibration
  //     this.beacon.txPower = -55; // in dB (see beacon service for detail)
  //     // set major / minor ID based on client id
  //     if (!this.standalone) {
  //       this.beacon.major = 0;
  //       this.beacon.minor = client.index + AddedOffsetToPlayerBeaconId;
  //       this.beacon.restartAdvertising();
  //     }
  //   }

  //   // INIT FAKE BEACON (for computer based debug)
  //   else { 
  //     this.beacon = {major:0, minor: client.index + AddedOffsetToPlayerBeaconId};
  //     this.beacon.rssiToDist = function(){return 1.5 + 6*Math.random()};    
  //     window.setInterval(() => {
  //       var pluginResult = { beacons : [] };
  //       for (let i = 0; i < 4; i++) {
  //         var beacon = {
  //           major: 0,
  //           minor: i,
  //           rssi: -45 - i * 5,
  //           proximity : 'fake, nearby',
  //         };
  //         pluginResult.beacons.push(beacon);
  //       }
  //       this.beaconCallback(pluginResult);
  //     }, 3000);
  //   }

  // }

  // beaconCallback(pluginResult) {
  //   // // diplay beacon list on screen
  //   // var log = 'Closeby Beacons: </br></br>';
  //   // pluginResult.beacons.forEach((beacon) => {
  //   //   log += beacon.major + '.' + beacon.minor + ' dist: ' 
  //   //         + Math.round( this.beacon.rssiToDist(beacon.rssi)*100, 2 ) / 100 + 'm' + '</br>' +
  //   //          '(' + beacon.proximity + ')' + '</br></br>';
  //   // });
  //   // document.getElementById('logValues').innerHTML = log;

  //   // select current ambisonic file based on distance to beacon 0
  //   pluginResult.beacons.forEach((beacon) => {
      
  //     if( (beacon.minor == 0) && !this.bonusBeaconActivated ){

  //       // get current zone (based on distance from beacon 0)
  //       let dist = this.beacon.rssiToDist(beacon.rssi);
  //       let newAmbiFileId = this.ambiFileId;
  //       let bkgColor = [0,0,0];

  //       if( dist <  ( zoneRadius[0] - hysteresisOffsetDist ) ){ 
  //         newAmbiFileId = 0;
  //         bkgColor = [0,0,100];
  //       }
  //       else if( dist > ( zoneRadius[0] + hysteresisOffsetDist ) && dist < ( zoneRadius[1] - hysteresisOffsetDist ) ){ 
  //         newAmbiFileId = 1;
  //         bkgColor = [100,0,0];
  //       }
  //       else if( dist > ( zoneRadius[1] + hysteresisOffsetDist ) ){ 
  //         newAmbiFileId = 2;
  //         bkgColor = [0,100,0];
  //       }

  //       // bypass hysteresis for first launch, start in zone 0
  //       if( !this.hasLoadedOnce ){
  //         this.hasLoadedOnce = true;
  //         newAmbiFileId = 0;
  //         bkgColor = [0,0,100];          
  //       }

  //       console.log(this.ambiFileId, newAmbiFileId);
  //       // set ambisonic file id if 1) new and 2) hysteresys
  //       if( (newAmbiFileId != this.ambiFileId) && 
  //         (audioContext.currentTime - this.lastDistHysteresisTime) > hysteresisOffsetTime ){

  //         // play transition sound
  //         let transId;
  //         // if( this.ambiFileId == 0 && newAmbiFileId == 1 ) transId = 1;
  //         if( this.ambiFileId == 1 && newAmbiFileId == 0 ) transId = 1;
  //         // if( this.ambiFileId == 1 && newAmbiFileId == 2 ) transId = 0;
  //         if( this.ambiFileId == 2 && newAmbiFileId == 1 ) transId = 0;
  //         if( transId !== undefined )
  //           this.audioPlayer.startSource(transId, 0, false);

  //         // update local
  //         this.lastDistHysteresisTime = audioContext.currentTime;
  //         this.ambiFileId = newAmbiFileId;

  //         // update player
  //         this.ambisonicPlayer.stop(-1, 1.0);
  //         this.ambisonicPlayer.startSource( this.ambiFileId, true, 1.0 );

  //         // update bkg color
  //         this.renderer.setBkgColor(bkgColor);

  //       }
  //     }

  //     // special other beacon that only plays single file when close by
  //     if( beacon.minor == 1 ){
  //       let dist2 = this.beacon.rssiToDist(beacon.rssi);
  //       console.log('beacon', beacon.minor);
  //       // warning: dist2 = 0 when beacon lost line of sight for the moment
  //       if( (dist2> 0.01) && (dist2 < 5) && !this.bonusBeaconActivated ){
  //         console.log('start', this.bonusBeaconActivated, dist2);
  //         // stop every other source
  //         this.ambisonicPlayer.stop(-1, 1.0);
  //         // play transition sound
  //         if(!this.bonusBeaconActivated) this.audioPlayer.startSource(2, 0, false);
  //         // start special sound
  //         this.ambisonicPlayer.startSource( 3, true, 1.0 );
  //         // flag special 
  //         this.bonusBeaconActivated = true;
  //       }

  //       else if ( (dist2 > 7) && this.bonusBeaconActivated ){
  //         console.log('stop', this.bonusBeaconActivated, dist2);
  //         // stop special
  //         this.ambisonicPlayer.stop(3, 1.0);
  //         // restart other 
  //         this.ambisonicPlayer.startSource( this.ambiFileId, true, 1.0 );
  //         // flag no more special
  //         this.bonusBeaconActivated = false;
  //       }
  //     }


  //   });
  // }

  // -------------------------------------------------------------------------------------------

}
