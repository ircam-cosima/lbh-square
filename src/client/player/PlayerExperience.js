import * as soundworks from 'soundworks/client';

import AudioPlayer from './AudioPlayer';
import AudioStreamHandler from './AudioStreamHandler';
import PlayerRenderer from './PlayerRenderer';

const audioContext = soundworks.audioContext;
const client = soundworks.client;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">

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
    this.sync = this.require('sync');
    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', { files: audioFiles });
    this.motionInput = this.require('motion-input', { descriptors: ['deviceorientation', 'accelerationIncludingGravity'] });
    this.rawSocket = this.require('raw-socket');
    this.sharedConfig = this.require('shared-config', { items: ['streamedAudioFileNames'] });
    this.geolocation = this.require('geolocation', { debug:false, state:'start', enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 } );

    // bind
    this.runWhenAudioStreamHandlerIsReady = this.runWhenAudioStreamHandlerIsReady.bind(this);
    
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
    if (!this.hasStarted){  this.init(); }
    this.show();

    // init audio players
    this.audioPlayer = new AudioPlayer(this.audioBufferManager.data);
    this.streamableAudioFiles = client.config.streamedAudioFileNames.map( (x) => { return x.replace(/^.*[\\\/]/, ''); });
    this.audioStreamHandler = new AudioStreamHandler( this, this.streamableAudioFiles, this.runWhenAudioStreamHandlerIsReady );
    
    
    // // setup motion input listener (update audio listener aim based on device orientation)
    // if (this.motionInput.isAvailable('deviceorientation')) {
    //   this.motionInput.addListener('deviceorientation', (data) => {});
    // }

    // // setup touch listeners (reset listener orientation on double touch)
    // const surface = new soundworks.TouchSurface(this.view.$el);
    // surface.addListener('touchstart', (id, normX, normY) => {});

  }

  // run only when audio stream is ready to stream (i.e. received all metadata for all stream files)
  runWhenAudioStreamHandlerIsReady(){
    // init audio zones handler
    this.audioZonesHandler = new AudioZonesHandler(this);
    // debug: fake GPS position
    this.receive('fakeGps', (coords) => { client.coordinates = coords; });

    // start main audio (red line)
    this.audioStreamHandler.start('virtual-barber-shop.wav', 0.0, 1.0, true);
  }

}

class AudioZonesHandler{
  constructor(clientExperience) {
    this.e = clientExperience;

    // hysTime: 1.0, // in sec
    this.hysDistRatio = 1; // ratio of distNew / distOld must be above to change zone (one is no hyst., > 1 is conservative hyst.)
    this.refreshRateMs= 750;
    this.refToRunningCallback = undefined;

    this.zoneCenters = [ // latitude longitude pairs
      // equi distant points along stravinsky's length:
      [ 48.859928, 2.351483 ], 
      [ 48.859784, 2.351896 ], 
      [ 48.859244, 2.350892 ], 
      [ 48.859063, 2.351415 ], 
      [ 48.859472, 2.351089 ], 
      [ 48.859700, 2.351286 ], 
      [ 48.859303, 2.351575 ], 
      [ 48.859544, 2.351736 ]
    ];

    this.zoneColors = [
      [100, 0, 0],
      [0, 100, 0],
      [0, 0, 100],
      [20, 20, 20],
      [100, 100, 0],
      [100, 0, 100],
      [100, 100, 0],
      [100, 100, 100]
    ];

    this.currentZoneId = -1;
    this.zoneSoundFileName = [
      'count8-120bpm-1.mp3',
      'count8-120bpm-2.mp3',
      'count8-120bpm-3.mp3',
      'count8-120bpm-4.mp3',
      'count8-120bpm-5.mp3',
      'count8-120bpm-6.mp3',
      'count8-120bpm-7.mp3',
      'count8-120bpm-8.mp3'
    ];

    this.zoneStatus = [];
    this.zoneSoundFileName.forEach( () => { this.zoneStatus.push(0); });

    this.activateZoneThresholdGain = 0.01;

    // bind
    this.runningCallback = this.runningCallback.bind(this);
    this.setNewZone = this.setNewZone.bind(this);

    // start zones check callback
    this.refToRunningCallback = setInterval(() => { this.runningCallback(); }, this.refreshRateMs);
  }

  runningCallback(){

    // loop over zone coords
    let dbgStr = '';
    this.zoneCenters.forEach( (coords, index) => {
      // get gain = f(client distance from zone center)
      let g = this.getZoneGain(index);
      dbgStr += index + ': ' + Math.round(g * 1000)/1000 + '<br>';
      // activate zone streaming if above gain threshold
      if( g >= this.activateZoneThresholdGain && this.zoneStatus[index] === 0 ){
        console.log('++ start streaming for zone', index);
        // get running time
        const startTime = this.e.sync.getSyncTime();
        // start sound (fade time long here to make sure volume is actually controlled by distance from zone center below)
        this.e.audioStreamHandler.start(this.zoneSoundFileName[index], startTime, 4.0, true);
        this.zoneStatus[index] = 1;
      }
      // de-activate zone streaming if gain below...
      else if( g < this.activateZoneThresholdGain && this.zoneStatus[index] === 1 ){
        console.log('-- stop streaming for zone', index);
        this.e.audioStreamHandler.stop(this.zoneSoundFileName[index], 0.1);
        this.zoneStatus[index] = 0;
      }
      // set volume of all active zones
      if( this.zoneStatus[index] === 1 ){
        this.e.audioStreamHandler.volume(this.zoneSoundFileName[index], g, 0.1);
      }

    });
    document.getElementById("instructions").innerHTML = dbgStr;
    document.getElementById("title").innerHTML = client.coordinates[0] + '<br>' + client.coordinates[1]

    // console.log('raw zone estimate (curr / new)', this.currentZoneId, newZoneId );

    // // discard if new zone meaningless
    // if( newZoneId === -1 || newZoneId === this.currentZoneId ){ return; }

    // // new zone detected for the first time
    // if( this.currentZoneId === -1 ){
    //   this.setNewZone( newZoneId ) ;
    // }
    // // new zone detected: apply hysteresis to check if dist is enough to trigger zone change
    // else{
    //   // get dist from current and new zone
    //   let distFromCurrent = arrayDist( client.coordinates, this.zoneCenters[this.currentZoneId] );
    //   let distFromNew = arrayDist( client.coordinates, this.zoneCenters[newZoneId] );
    //   let distRatio = distFromCurrent / distFromNew;
    //   console.log( 'current dist ratio:', Math.round(distRatio*100)/100 );
    //   // discard if ratio not above threshold
    //   if( distRatio <= this.hysDistRatio ){ return; }
    //   // change zone otherwise
    //   this.setNewZone( newZoneId );
    //   console.log('!! Changed zone: new zone id:', newZoneId);
    // }

 
  }

  getZoneGain(id){
    let x = this.zoneCenters[id][0] - client.coordinates[0];
    let y = this.zoneCenters[id][1] - client.coordinates[1];
    let gain = Math.min( 1.0, 2 * 
                  Math.exp( -Math.pow(x,2) / 2e-8 ) *
                  Math.exp( -Math.pow(y,2) / 2e-8 ));
    return gain;
  }

  setNewZone(zoneId){
    // update audio
    this.e.audioStreamHandler.start(this.zoneSoundFileName[zoneId], 0.0, 0.1, true);
    this.e.audioStreamHandler.stop(this.zoneSoundFileName[this.currentZoneId], 0.1);    
    // update local
    this.currentZoneId = zoneId;
    // update visual
    this.e.renderer.setBkgColor(this.zoneColors[zoneId]);
  }

}













