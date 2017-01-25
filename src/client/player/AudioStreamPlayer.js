import * as soundworks from 'soundworks/client';

const audioContext = soundworks.audioContext;
const CALLBACK_TIME_MS = 100;

export default class AudioStreamPlayer {
    constructor(audioTagArray) {
        
        // local attributes
        this.sourceMap = new Map();
        this.audioTagArray = audioTagArray;

        // master gain out
        this.gainOut = audioContext.createGain();
        this.gainOut.gain.value = 1.0;
        this.gainOut.connect(audioContext.destination);
    }

    start(soundFileName, loop = true, fadeInDuration = 0.0, sync = false){

      // check if there's still room (audio tag available) for new source
      if( this.sourceMap.size >= this.audioTagArray.length ){ 
        warn('reached maximum of audio stream sources:', this.audioTagArray.length, 
          'not playing audio file:', soundFileName);
      }

      // search for a source already defined for sound file (alas, forces unique source per sound file)
      for (let el of this.sourceMap) {
        if( el[1].soundFileName === soundFileName ){ 
          var src = el[1];
          break; 
        }
      }

      // if did not find already defined source, create new and connect it to unused audio tag
      if( src === undefined){
        // get list of occupied audio tag indices
        let usedIndices = Array.from( this.sourceMap ).map( (x) => { return x[1].id; } );
        // find unoccupied index
        for( let i = 0; i < this.audioTagArray.length; i++ ){
          // discard if occupied index
          if( usedIndices.indexOf(i) !== -1 ){ continue; }
          // create audio node (more complex, but will allow ambisonic playback eventually)
          let node = audioContext.createMediaElementSource(this.audioTagArray[i]);
          node.connect( this.gainOut );
          // create new source with unoccupied audio tag
          var src = {
            id: i,
            soundFileName: soundFileName,
            node: node,
            tag: this.audioTagArray[i],
            fadeCallback: undefined,
            fadeIncr: 0.01
          }
          // store source in local map
          this.sourceMap.set(soundFileName, src);
        }
      }

      // init audio tag
      src.tag.src = soundFileName;
      src.tag.loop = loop;

      // fade in
      if( fadeInDuration > 0 ){
        // define increment to fit required fade time
        src.fadeIncr = ( CALLBACK_TIME_MS / 1000 ) / fadeInDuration;
        // set initial volume to 0
        src.tag.volume = 0.0;
        // trigger fade callback
        src.tag.fadeCallback = setInterval( () => { 
          let volume = src.tag.volume;
          volume = Math.min( volume += src.fadeIncr, 1);
          src.tag.volume = volume;
          // console.log(src.fadeIncr , volume)
          // kill fade callback
          if( src.tag.volume === 1){ clearInterval( src.tag.fadeCallback )}
        }, CALLBACK_TIME_MS);
      }
      
      // sync mecanism

      src.tag.play();
  
    }

   
}

class AudioStreamSource {
  constructor() {

  }
}








