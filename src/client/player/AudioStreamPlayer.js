import * as soundworks from 'soundworks/client';

const audioContext = soundworks.audioContext;
const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function urlToFileName(url){
  let fileName = url.substring(url.lastIndexOf("/") + 1, url.length);
  return fileName;
 }



export default class AudioStreamPlayer {
    constructor(audioTagArray, sync) {
        
        // local attributes
        this.sync = sync;
        this.sourceArray = [];
        this._syncRefTime = 0.0;

        // master gain out
        this.gainOut = audioContext.createGain();
        this.gainOut.gain.value = 1.0;
        this.gainOut.connect(audioContext.destination);

        // if( IS_SAFARI ){ alert( 'you are using Safari ain t you?'); }

        // pre-init of source nodes (can be created only once)
        audioTagArray.forEach( (item, index) => {
          // mute audioTag for safari: else the overwrite of audioTag output by the createMediaElmt does not 
          // happend fast enought and one can hear the volume 1.0 at startup. Note: Safari will automatically 
          // bypass the mute when using the createMediaElmt, Chrome won't.
          if( IS_SAFARI ){ item.muted = true; }
          // create source
          let src = new AudioStreamSource( item, this.sync);
          src.out.connect( this.gainOut );
          // store local
          this.sourceArray.push( src );
        });

    }

    start(soundFileName, fadeDuration = 0.1, loop = true, isSynchronized = false){

      // check if source with given file already exists
      let src = this.getSourceFromFileName(soundFileName);

      // if src already associated with sound file, simply re-start it
      if( src ){
        // discard if source is currently playing
        if( src.isPlaying ){ 
          console.warn('source already started:', soundFileName); 
          return;
        }
      }
      else{
        // search for a source unoccupied
        for (let el of this.sourceArray) {
          if( !el.isPlaying ){ 
            src = el;
            break; 
          }
        }
      }

      // discard if no available source
      if( src === undefined ){
        console.warn('reached maximum of audio stream sources:', this.sourceArray.length, 
          'not playing audio file:', soundFileName);
        return;        
      }

      // handle fade mechanism
      const now = audioContext.currentTime;
      src.out.gain.cancelScheduledValues(now);
      src.out.gain.setValueAtTime(src.out.gain.value, now);
      // src.out.gain.linearRampToValueAtTime(0.0, now);
      src.out.gain.linearRampToValueAtTime(1.0, now + fadeDuration);
      
      // init audio tag
      if( urlToFileName( src.audioTag.src ) !== urlToFileName( soundFileName ) ){
        src.audioTag.src = soundFileName; // if Safari crashes when sound URL changes, see // https://bugs.webkit.org/show_bug.cgi?id=153593 (i.e. update Safari)
      }
      src.audioTag.loop = loop;

      // sync mechanism
      src.enableSync( isSynchronized );
      // start source
      src.play();

    }

    stop( soundFileName, fadeDuration = 0.1){
      // check if source with given file already exists
      let src = this.getSourceFromFileName(soundFileName);

      // discard otherwise
      if( src === undefined ){ 
        console.warn('trying to stop un-started source:', soundFileName)
        return; 
      }

      // fade out
      const now = audioContext.currentTime;
      src.out.gain.cancelScheduledValues(now);
      src.out.gain.setValueAtTime(src.out.gain.value, now);
      // src.out.gain.linearRampToValueAtTime(1.0, now);
      src.out.gain.linearRampToValueAtTime(0.0, now + fadeDuration);

      // setup stop source
      setTimeout( () => {
        src.stop();
      }, Math.ceil( fadeDuration * 1000 ) + 100 );

    }

    set syncRefTime( time ){
      this.sourceArray.forEach( (item, index) => {
        item.syncRefTime = time;
      });
    }

    getSourceFromFileName(soundFileName){
      // search for a source already defined for that sound file (alas, forces unique source per sound file)
      // WARNING: supposes there is no "/" in file name (not in path, e.g. soundFileName, but in file name as displayed in explorer)
      for (let el of this.sourceArray) {
        // from stored url to comparable file name
        let currentUrl = el.audioTag.src;
        let currentName = urlToFileName( currentUrl );
        let futureName = urlToFileName( soundFileName );
        // break if match
        if( currentName === futureName ){ return el }
      }
    }

   
}

class AudioStreamSource {
  constructor(audioTag, sync) {
    // local attributes
    this.audioTag = audioTag;
    this.sync = sync;
    this.CALLBACK_TIME_MS = 100; // general callback refresh rate, in ms
    this.isPlaying = false; // determine is source is occupied or can be used to play new audio file

    // create audio node (more complex, but will allow ambisonic playback eventually)
    this.audioNode = audioContext.createMediaElementSource( audioTag );

    // gain out (needed for fade mechanism as safari doesn't let us change audioTag.volume)
    this.out = audioContext.createGain();
    this.out.gain.value = 0.0;

    // fade mechanism
    this.fadeCallback = undefined;
    this.fadeIncr = 0.01;

    // sync. mecanism
    this.syncCallback = undefined;
    this.syncRefTime = 0.0;
    this.MAX_OFFSYNC_TIME_S = 0.5; // max time accepted by the system before forcing sync., in sec

    // connect graph
    this.audioNode.connect( this.out );
    
  }

  play(){
    this.isPlaying = true;
    this.audioTag.play();
  }

  stop(){
    this.isPlaying = false;
    this.audioTag.pause();
    this.enableSync( false );
    // reset play position
    this.audioTag.currentTime = 0.0;
  }

  enableSync( isSynchronized ){
    // simply remove callback if requires no sync
    if( isSynchronized === false ){  
      if( this.syncCallback !== undefined ){
        clearInterval( this.syncCallback );
        this.syncCallback = undefined;
      }
      return;
    }

    // trigger sync callback
    this.syncCallback = setInterval( () => { 
      // get current sync time
      let now = this.sync.getSyncTime();
      let timeIn = ( now  - this.syncRefTime ) % this.audioTag.duration;
      // console.log( 'running sync. callback, offset:', this.audioTag.currentTime - timeIn )
      // sync. if large enought offset
      if( Math.abs( this.audioTag.currentTime - timeIn ) > this.MAX_OFFSYNC_TIME_S ){
        // console.log('forced sync.', this.audioTag.currentTime,  timeIn);
        this.audioTag.currentTime = timeIn;
      }

    }, this.CALLBACK_TIME_MS);

  }


}








