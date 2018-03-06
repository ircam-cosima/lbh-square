import { audioContext } from 'soundworks/client';

class AudioPlayer {
  constructor(audioBuffers) {
    // master gain out
    this.gainOut = audioContext.createGain();
    this.gainOut.gain.value = 1.0;

    // connect graph
    this.gainOut.connect(audioContext.destination);

    // local attributes
    this.sourceMap = new Map();
    this.buffers = audioBuffers;
  }

  stop(id, fadeOutDuration = 0){
    if( !this.sourceMap.has(id) ){
        console.warn('failed to stop source', id, 'in AudioPlayer (source never started)');
        return;
    }

    // get source
    let srcObj = this.sourceMap.get(id);

    // fade out
    const param = srcObj.gain.gain;
    const now = audioContext.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(0.0, now + fadeOutDuration);

    // stop when fade out over
    srcObj.src.stop(now + fadeOutDuration);

    // remove from local
    this.sourceMap.delete(id);
  }

  // init and start spat source. id is audio buffer id in loader service
  // ("start now, at startTime in buffer")
  start(id, startTime, fadeInDuration = 0.1, loop = false, volume = 1.0) {
    if (this.buffers[id] == undefined) {
      console.warn('wrong file index', id, 'in AudioPlayer');
      return;
    }

    // modulo of start time if loop required
    let buffer = this.buffers[id];

    if (loop) { 
      startTime = startTime % (buffer.length / buffer.sampleRate);
    } else if (startTime >= buffer.length / buffer.sampleRate) {
      console.warn('source', id, 'start time greater than total time', startTime, buffer.length / buffer.sampleRate, 'discard starting source (consider setting loop to true)');
      return;
    }

    // create audio source
    var src = audioContext.createBufferSource();
    src.buffer = this.buffers[id];
    src.loop = loop;

    // create fadeIn gain
    let gain = audioContext.createGain();
    gain.gain.value = 0.0;
    gain.gain.setValueAtTime(gain.gain.value, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + fadeInDuration);

    // connect graph
    src.connect(gain);
    gain.connect(this.gainOut);

    // start source at correct time
    src.start(audioContext.currentTime, startTime);

    // store new spat source
    this.sourceMap.set(id, { src:src, gain:gain });
  }

  // init and start spat source. id is audio buffer id in loader service
  volume(id, volume, fadeDuration = 0.1) {
    // get source
    let srcObj = this.sourceMap.get(id);
    // discard if doesn't exist
    if( srcObj === undefined ){
      console.warn('attempt to set volume of unknown source:', id);
      return;
    }
    // set volume
    const now = audioContext.currentTime;
    srcObj.gain.gain.cancelScheduledValues(now);
    srcObj.gain.gain.setValueAtTime(srcObj.gain.gain.value, now);
    srcObj.gain.gain.linearRampToValueAtTime(volume, now + fadeDuration);
  }
}

export default AudioPlayer;
