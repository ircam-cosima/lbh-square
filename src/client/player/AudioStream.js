// TODO:
// - support streaming of files of total duration shorter than packet duration

////////////////////////////////////////////////////////
// UTILS FUNCTIONS 
////////////////////////////////////////////////////////

// load an audio buffer from server's disk (based on XMLHttpRequest)
function loadAudioBuffer( chunkName ){
  const promise = new Promise( (resolve, reject) => {
    // create request
    var request = new XMLHttpRequest();
    request.open('GET', chunkName, true);
    request.responseType = 'arraybuffer';
    // define request callback
    request.onload = () => {
      audioContext.decodeAudioData(request.response, (buffer) => {
        resolve(buffer);
      }, (e) => { reject(e); });
    }
    // send request
    request.send();
  });
  return promise;
}

////////////////////////////////////////////////////////
// HEADER
////////////////////////////////////////////////////////

// import
import * as soundworks from 'soundworks/client';

// define constants
const audioContext = soundworks.audioContext;
const STREAM_MONITOR_INTERVAL_MS = 1000; // in ms
const REQUIRED_ADVANCE_THRESHOLD_S = 10; // in seconds
const PUBLIC_PATH = __dirname + '/../../../';

////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////

export default class AudioStream {
  constructor( experiment, bufferInfos ){

    // arguments
    this.e = experiment;
    this.bufferInfos = bufferInfos;

    // local attr.
    this._sync = false;
    this._loop = false;
    this._metaData = undefined;
    this._out = audioContext.createGain();

    // stream monitoring
    this._chunkRequestCallbackInterval = undefined;
    this._ctx_time_when_queue_ends = 0;
    this._srcMap = new Map();
    this._reset();
    this._stopRequired = false;
    
    // bind
    this._chunkRequestCallback = this._chunkRequestCallback.bind(this);
  }

  /**
  * init / reset local attributes (at stream creation and stop() )
  **/
  _reset(){
    this._offsetInFirstBuffer = 0;
    this._offsetInFirstBufferAccountedFor = false;
    this._ctxStartTime = -1;
    this._unsyncStartOffset = undefined;
    this._currentBufferIndex = -1;    
    this._firstPacketState = 0;
  }

  /** 
  * define url of audio file to stream, send meta data request to server
  * concerning this file
  **/ 
  set url( fileName ){
    // discard if currently playing
    if( this.isPlaying() ){ console.warn('set url ignored while playing'); return; }
    // check if url corresponds with a streamable file
    if( this.bufferInfos.get(fileName) ){ this._url = fileName; }
    // discard otherwise
    else{ console.error(fileName, 'url not in', this.bufferInfos, ', \n ### url discarded'); }
  }

  /**
  * enable / disable synchronized mode. in non sync. mode, the stream audio
  * will start whenever the first audio buffer is downloaded. in sync. mode, 
  * the stream audio will start (again asa the audio buffer is downloaded) 
  * with an offset in the buffer, as if it started playing exactly when the 
  * start() command was issued
  **/
  set sync(val){
    if( this.isPlaying() ){ console.warn('set sync ignored while playing'); return; }
    this._sync = val;
  }
  get sync(){
    return this._sync;
  }  

  /**
  * set loop mode
  **/
  set loop(val){
    if( this.isPlaying() ){ console.warn('set loop ignored while playing'); return; }
    this._loop = val;
  }  

  /**
  * get duration of audio file currently loaded
  **/
  get duration(){
    let bufferInfo = this.bufferInfos.get( this._url );
    let endBuffer = bufferInfo[bufferInfo.length-1];
    let duration = endBuffer.start + endBuffer.duration;
    return duration;
  }

  /**
  * connect audio stream to an audio node
  **/
  connect( node ){
    this._out.connect(node);
  }

  /**
  * return true if stream is playing, false otherwise
  **/
  isPlaying(){
    if( this._chunkRequestCallbackInterval === undefined ){ return false; }
    else{ return true }
  }

  /** 
  * start streaming audio source (offset is time in buffer from which to start)
  **/
  start(offset){

    // check if we dispose of valid url to execute start
    if( this._url === undefined ){
      console.warn('start command discarded, must define valid url first');
      return;
    }

    // get total duration of targetted audio file
    let bufferInfo = this.bufferInfos.get( this._url );
    let duration = this.duration;

    // make sure offset requested is valid
    if( offset >= duration || offset < 0 ){
      console.warn('requested offset:', offset, 'sec. larger than file duration:', duration, 'sec, start() discarded');
      return;
    }

    // unflag stop required
    this._stopRequired = false;

    // if sync, either use offset for quatization start or sync with running loop 
    if( this._sync ){ 
      // quantization mode: start with offset in file to match period (offset must be computed accordingly, in parent who calls this method)
      if( offset !== undefined ){ 
        if( offset >= duration ){ console.error('req. offset above file duration', offset, duration); }
      }
      // sync in "running loop" mode
      else{ offset = this.e.sync.getSyncTime() % duration; }
    }
    // set default offset if not defined
    else{ offset = (offset !== undefined) ? offset : 0; }

    // init queue timer
    this._ctx_time_when_queue_ends = this.e.sync.getSyncTime();

    // find first index in buffer list for given offset
    let index = 1;
    while( this._currentBufferIndex < 0 ){
      // if index corresponds to the buffer after the one we want || last index in buffer
      if( index === bufferInfo.length || offset < bufferInfo[index].start ){ 
        this._currentBufferIndex = index - 1;
        this._offsetInFirstBuffer = offset - bufferInfo[this._currentBufferIndex].start;
        // console.log('global offset:', offset, 'local offset:', this._offsetInFirstBuffer, 'file starts at:', bufferInfo[this._currentBufferIndex].start, 'total dur:', duration);
      }
      index += 1;
    }

    // start stream request chunks callback
    this._chunkRequestCallback(); // start with one call right now
    this._chunkRequestCallbackInterval = setInterval( this._chunkRequestCallback, STREAM_MONITOR_INTERVAL_MS );
  }

  /** 
  * check if we have enought "local buffer time" for the audio stream, 
  * request new buffer chunks otherwise
  **/
  _chunkRequestCallback(){
    
    // get array of streamed chunks info
    let bufferInfo = this.bufferInfos.get(this._url);
    
    // loop: do we need to request more chunks? if so, do, increment time flag, ask again
    while( this._ctx_time_when_queue_ends - this.e.sync.getSyncTime() <= REQUIRED_ADVANCE_THRESHOLD_S ){

      // mechanism to force await first buffer to offset whole queue in unsync mode
      if( this._firstPacketState == 1 && !this._sync ){ return; }

      // get current working chunk info
      let metaBuffer = bufferInfo[this._currentBufferIndex];

      // get context absolute time at which current buffer must be started
      // this "const" here allows to define a unique ctx_startTime per while loop that will 
      // be used in its corresponding loadAudioBuffer callback. (hence not to worry in sync.
      // mode if the first loaded audio buffer is not the first requested)
      const ctx_startTime = this._ctx_time_when_queue_ends;
      
      // load and add buffer to queue
      let chunkName = PUBLIC_PATH + metaBuffer.name.substr(metaBuffer.name.indexOf('public')+7, metaBuffer.name.length-1);
      loadAudioBuffer(chunkName).then( (buffer) => {
        // discard if stop required since
        if( this._stopRequired ){ return; }
        this._addBufferToQueue( buffer, ctx_startTime );
        // mark that first packet arrived and that we can ask for more
        if( this._firstPacketState == 1 && !this._sync ){ this._firstPacketState = 2; }
      });

      // flag that first packet has been required and that we must await for its arrival in unsync mode before asking for more
      if( this._firstPacketState == 0 && !this._sync ){ this._firstPacketState = 1; }

      // increment
      this._currentBufferIndex += 1;
      this._ctx_time_when_queue_ends += metaBuffer.duration;
      // need to increment queue time of only a percentage of first buffer duration (for sync mode)
      if( !this._offsetInFirstBufferAccountedFor ){
        this._ctx_time_when_queue_ends -= this._offsetInFirstBuffer;
        this._offsetInFirstBufferAccountedFor = true;
      }

      // check if reached end of chunk list (i.e. end of file) at next iteration
      if( this._currentBufferIndex === bufferInfo.length ){
        if( this._loop){ this._currentBufferIndex = 0; }
        else{ this._drop(); return; }
      }

    }
  }

  /**
  * add audio buffer to stream queue
  **/
  _addBufferToQueue( buffer, startTime ){

    // get relative start time (in  how many seconds from now must the buffer be played)
    let relStartTime = startTime - this.e.sync.getSyncTime();
    
    // non sync scenario: should play whole first buffer when downloaded
    if( !this._sync ){
      // first packet: keep track off init offset (MUST BE FIRST PACKET REGARDING TIME LINE, hence _firstPacketState based mechanism above)
      if( this._unsyncStartOffset === undefined ){
        this._unsyncStartOffset = relStartTime;
      }
      relStartTime -= this._unsyncStartOffset;
    }
    // sync scenario: should play in first buffer to stay in sync
    else{
      // hack: use _unsyncStartOffset to check if first time we come here
      if( this._unsyncStartOffset === undefined ){ 
        this._unsyncStartOffset = -1; // just so we don't come here again
        relStartTime -= this._offsetInFirstBuffer;
      }
    }

    // if then relStartTime is above source buffer duration
    if( -relStartTime >= buffer.duration ){
      console.warn('audiostream: too long loading, discarding buffer');
      return;
    }

    // console.log( 'add buffer to queue starting at', startTime, 'i.e. in', relStartTime, 'sec' );

    // create audio source
    let src = audioContext.createBufferSource();
    src.buffer = buffer;
    // connect graph
    src.connect( this._out );
    
    // start source now (not from beginning since we're already late)
    const now = audioContext.currentTime;
    if( relStartTime < 0 ){  src.start(now, -relStartTime);  }
    // start source delayed (from beginning in abs(relStartTime) seconds)
    else{ src.start(now + relStartTime, 0); }
    // keep ref. to source
    this._srcMap.set( startTime, src);
    // source removes itself from locals when ended
    src.onended = () => { this._srcMap.delete( startTime ); };
  }

  /** 
  * micmics AudioBufferSourceNode stop() method
  **/
  stop(when = 0){
    // no need to stop if not started
    if( !this.isPlaying() ){
      console.warn('stop discarded, must start first');
      return;
    }
    this._drop();
    // flag stop required to avoid playing newly loaded buffers
    this._stopRequired = true;
    // kill sources
    this._srcMap.forEach( (src, startTime) => {
      // if source due to start after stop time
      if( startTime >= this.e.sync.getSyncTime() + when ){ src.stop(); }
      // stop all sources currently playing in "when" (don't care if source then stopped by itself)
      else{ src.stop(audioContext.currentTime + when); }
    });
  }

  /**
  * local stop: end streaming requests, clear streaming callbacks, etc.
  * in short, stop all but stop the audio sources, to use _drop() rather 
  * than stop() in "audio file over and not loop" scenario
  **/
  _drop(){
    // reset local values
    this._reset();
    // kill callback
    clearInterval( this._chunkRequestCallbackInterval );
    this._chunkRequestCallbackInterval = undefined;    
  }

}