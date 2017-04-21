/** 
* TODO:
**/

////////////////////////////////////////////////////////
// UTILS FUNCTIONS 
////////////////////////////////////////////////////////

// load an audio buffer from server's disk (based on XMLHttpRequest)
function loadAudioBuffer( chunkPath ){
  const promise = new Promise( (resolve, reject) => {
    // create request
    var request = new XMLHttpRequest();
    request.open('GET', chunkPath, true);
    request.responseType = 'arraybuffer';
    // define request callback
    request.onload = () => {
      audioContext.decodeAudioData(request.response, (buffer) => {
        resolve(buffer);
      }, (e) => { reject(e); 
      });
    }
    // send request
    request.send();
  });
  return promise;
}

function padL(a,b,c){//string/number,length=2,char=0
 return (new Array(b||2).join(c||0)+a).slice(-b)
}

////////////////////////////////////////////////////////
// HEADER
////////////////////////////////////////////////////////

// import
import * as soundworks from 'soundworks/client';

// define constants
const audioContext = soundworks.audioContext;
const STREAM_MONITOR_INTERVAL_MS = 1000; // in ms
const NUM_CHUNK_IN_ADVANCE = 4; // S.I.
const CHUNK_DURATION = 4; // in sec
const streamPath = __dirname + '/../../../streams/';

////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////

export default class AudioStream {
  constructor( experience ){
    this.e = experience;

    // local attr.
    this._out = audioContext.createGain();
    this.url = '';
    this.loop = false;

    // stream monitoring
    this._chunkRequestCallbackInterval = undefined;
    
    // bind
    this._chunkRequestCallback = this._chunkRequestCallback.bind(this);
  }

  /**
  * init / reset local attributes (at stream creation and stop() )
  **/
  _reset(){
    // stream monitoring
    this._ctxStartTime = -1;
    this._ctxLastBufferStartTime = -1;
  } 

  /**
  * connect audio stream to an audio node
  **/
  connect( node ){
    this._out.connect(node);
  }

  /** 
  *
  **/
  start(){
    // // copy params for later (to re-call start whenever first buffer arrives)
    // this._offset = offset;
    // this._duration = duration;
    // this._when = when;
    // // init local time flags
    // this._ctxStartTime = this.e.sync.getSyncTime() + when;
    const now = audioContext.currentTime;
    this._ctxStartTime = now;
    this._ctxLastBufferStartTime = now;
    // // check if we dispose of valid metaData to execute start
    // if( this._metaData === undefined ){
    //   // request sent, awaiting server response
    //   if( this._awaitsMetaData ){ this._shouldStartUponMetaDataReception = true; }
    //   // skip if no meta data present nor requested
    //   else{ console.warn('start command discarded, must define valid url first'); }
    //   return;
    // }
    // // make sure offset requested is valid
    // if( offset >= this._metaData.length / this._metaData.sampleRate ){
    //   console.warn('offset of', offset, 'sec larger than file duration of',
    //     this._metaData.length / this._metaData.sampleRate, 'sec');
    //   return;
    // }
    // start stream request chunks callback
    this._chunkRequestCallbackInterval = setInterval( this._chunkRequestCallback, STREAM_MONITOR_INTERVAL_MS );
  }

  /** 
  * check if we have enought "local buffer time" for the audio stream, 
  * request new buffer chunks otherwise
  **/
  _chunkRequestCallback(){

    
    // prepare while loop
    let timeThreshold = NUM_CHUNK_IN_ADVANCE * CHUNK_DURATION;
    // let noLoopAndNeedToStop = false;

    const now = audioContext.currentTime;
    // while loop: do we need to request more chunks? if so, do, increment time flag, ask again
    while( this._ctxLastBufferStartTime - audioContext.currentTime <= timeThreshold ){
      
      // get file name based on current running time
      const index = Math.round( ( (this._ctxLastBufferStartTime - this._ctxStartTime) % this.url.duration ) / CHUNK_DURATION );
      // TODO: 
      // - loop is always active for now (see modulo above)
      // - loop doesn't loop neat for now, only if total file length is modulo of CHUNK_DURATION
      const filePath = streamPath + this.url.file + '/' + padL(index, 3) + '.mp3'
      
      // load file
      const currentStartTime = this._ctxLastBufferStartTime;
      loadAudioBuffer( filePath ).then( (audioBuffer) => {
        // create audio source
        let src = audioContext.createBufferSource();
        src.buffer = audioBuffer;
        // connect graph
        src.connect( this._out );
        const offset = currentStartTime - audioContext.currentTime;
        // we're late, start source with advance in buffer
        if( offset <= 0 ){ 
          src.start( audioContext.currentTime, -offset ); 
          console.log( 'play offset', Math.round(offset*1000)/1000 , index);
        }
        // we're in advance, plan source start in future
        else{
          src.start( audioContext.currentTime + offset ); 
          console.log( 'play delayed', Math.round(offset*1000)/1000 , index);
        }
      });

      // increment
      console.log( 'load file:', index);
      this._ctxLastBufferStartTime += CHUNK_DURATION;
    }
  }

  // /**
  // * add audio buffer stream play queue
  // **/
  // _addBufferToQueue( buffer, startTime ){
  //   // estimate system start time
  //   let relativeSystemStartTime = startTime - this.e.sync.getSyncTime();
    
  //   // non sync scenario: should play whole first buffer when downloaded
  //   if( !this._sync ){
  //     // first packet: keep track off init offset
  //     if( this._unsyncStartOffset < 0 ){
  //       this._unsyncStartOffset = relativeSystemStartTime;
  //     }
  //     relativeSystemStartTime -= this._unsyncStartOffset;
  //   }

  //   console.log( 'add buffer to queue starting at', startTime, 'i.e. in', relativeSystemStartTime, 'seconds' );

  //   // create audio source
  //   let src = audioContext.createBufferSource();
  //   src.buffer = buffer;
  //   // connect graph
  //   src.connect( this._out );
    
  //   // start source now (not from beginning since we're already late)
  //   const now = audioContext.currentTime;
  //   if( relativeSystemStartTime < 0 ){  src.start(now, -relativeSystemStartTime);  }
  //   // start source delayed (from beginning in abs(relativeSystemStartTime) seconds)
  //   else{ src.start(now + relativeSystemStartTime, 0); }
  //   // keep ref. to source
  //   this._srcMap.set( startTime, src);
  //   // source removes itself from locals when ended
  //   src.onended = () => { this._srcMap.delete( startTime ); };
  // }

  // /** 
  // * micmics AudioBufferSourceNode stop() method
  // **/
  // stop(when = 0){
  //   this._drop();
  //   // kill sources
  //   this._srcMap.forEach( (src, startTime) => {
  //     // if source due to start after stop time
  //     if( startTime >= this.e.sync.getSyncTime() + when ){ src.stop(); }
  //     // if source will be the one playing when stop is due
  //     else if( startTime - this.e.sync.getSyncTime() < when && startTime >= this.e.sync.getSyncTime() ){
  //       src.stop(audioContext.currentTime + when);
  //     }      
  //   });
  // }

  // /**
  // * local stop: end streaming requests, clear streaming callbacks, etc.
  // * in short, stop all but stop the audio sources, to use _drop() rather 
  // * than stop() in "audio file over and not loop" scenario
  // **/
  // _drop(){
  //   // reset local values
  //   this._reset();
  //   // no need to stop if not started
  //   if( this._chunkRequestCallbackInterval === undefined ){
  //     console.warn('stop discarded, must start first');
  //     return;
  //   }
  //   // kill callback
  //   clearInterval( this._chunkRequestCallbackInterval );
  //   this._chunkRequestCallbackInterval = undefined;    
  //   // notify server that stream stopped
  //   // this.e.send('stream:stop', client.index, fileName);
  // }

}