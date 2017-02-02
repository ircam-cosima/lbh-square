import * as soundworks from 'soundworks/client';
const audioContext = soundworks.audioContext;

// same as audiostreamplayer but with manual streaming. Not relying on html audio tag
// element to achieve synchronization

export default class AudioStreamHandler {
  constructor( soundworksClient, audioFileNames ) {
    
    // locals
    this.soundworksClient = soundworksClient;
    this.streamSourcesMap = new Map();
    this.outGainMap = new Map();

    // for each potential streamed audio file (i.e. "raw socket channel")
    audioFileNames.forEach( (socketChannelName) => {
      // setup socket reveive callbacks (receiving raw audio data)
      soundworksClient.rawSocket.receive(socketChannelName, (data) => { 
        this.rawSocketCallback(socketChannelName, data);
      });
      
      // create output gains
      let gain = audioContext.createGain();
      gain.connect( audioContext.destination );
      this.outGainMap.set(socketChannelName, gain);
    });
  }

  start( soundFile, startTime, fadeDuration = 0.3 ){
    // create new source
    let streamSrc = { 
      absoluteStartTime: this.soundworksClient.sync.getSyncTime(), // store time at start request 
      updateCallback: undefined,
      bufferDuration: 4.0, // duration (in sec) of an audio buffer
      thresholdSeekingTime: 2.0, // when only .. sec remain in current buffer, go fetch another
      updateRefreshRateInMs: 1000,
      lastBufferStartTime: startTime, // start time, wrt the audio file timeframe, of the last audio buffer received
      refToCurrentAudioSource: undefined,
      // requestedStop: false,
      hasFadedIn: false, 
      fadeDuration: fadeDuration,
    };
    // store src in local
    this.streamSourcesMap.set(soundFile, streamSrc);
    
    // require data from server
    this.soundworksClient.send('audioStreamRequest', soundFile, startTime, streamSrc.bufferDuration);

    // add auto-update callback
    streamSrc.updateCallback = setInterval( () => {
      this.srcUpdateCallback( soundFile );
    }, streamSrc.updateRefreshRateInMs);

  }

  rawSocketCallback( channelName, data ){
    console.log('received data for', channelName, 'of length', data.length);

    // get stream source
    let streamSrc = this.streamSourcesMap.get(channelName);
    // // check if due to stop
    // if( streamSrc.requestedStop ){
    //   console.log('discarding received data: stop requested on source');
    //   return;
    // }

    // create audio buffer
    let audioBuffer = audioContext.createBuffer(1, data.length, 44100);
    var audioBufferDataArray = audioBuffer.getChannelData(0);
    // copy data to audio buffer
    for( let i = 0; i < data.length; i++ ){
      audioBufferDataArray[i] = data[i];
    }
    // create audio source
    let src = audioContext.createBufferSource();
    src.buffer = audioBuffer;
    streamSrc.refToCurrentAudioSource = src;
    // connect graph
    let streamGain = this.outGainMap.get(channelName);
    src.connect( streamGain );
    // estimate time offset into buffer (delay between required start and actual start)
    let timeIntoBuffer = this.soundworksClient.sync.getSyncTime() - streamSrc.absoluteStartTime;
    console.log('start chunck', streamSrc.lastBufferStartTime, 'in', timeIntoBuffer, 'sec')

    // start source
    if( timeIntoBuffer > 0){ // received buffer after start time
      // imediate fade in if first time source is played
      if( !streamSrc.hasFadedIn ){
        const now = audioContext.currentTime;
        streamGain.gain.cancelScheduledValues(now);
        streamGain.gain.setValueAtTime(0.0, now);
        streamGain.gain.linearRampToValueAtTime(1.0, now + streamSrc.fadeDuration);
        streamSrc.hasFadedIn = true;
      }
      // immediate start source (with offset in buffer to compensate for delay)
      src.start(audioContext.currentTime, timeIntoBuffer);
    }
    else{ // received buffer before start time
      // plan fade in
      if( !streamSrc.hasFadedIn ){
        const now = audioContext.currentTime;
        streamGain.gain.cancelScheduledValues(now);
        streamGain.gain.setValueAtTime(0.0, now);
        setTimeout( streamGain.gain.linearRampToValueAtTime(1.0, now + streamSrc.fadeDuration) , -timeIntoBuffer*1000 );
        streamSrc.hasFadedIn = true;
      }      
      // delayed start
      src.start(audioContext.currentTime - timeIntoBuffer, 0); 
    }    
  }

  srcUpdateCallback( soundFile ){
    let streamSrc = this.streamSourcesMap.get( soundFile );
    // check how long remains with current buffer
    let now = this.soundworksClient.sync.getSyncTime();
    let timeBeforeLastBufferOver = streamSrc.absoluteStartTime + streamSrc.bufferDuration - now;
    console.log('remains', timeBeforeLastBufferOver, 'sec of current buffer');
    // do nothing if enought buffered data for now
    if( timeBeforeLastBufferOver > streamSrc.thresholdSeekingTime ){ return; }
    // request new data chunck + update time values
    streamSrc.lastBufferStartTime += streamSrc.bufferDuration;
    streamSrc.absoluteStartTime = now + timeBeforeLastBufferOver;
    console.log('request new buffer starting at', streamSrc.lastBufferStartTime, 'sec');
    this.soundworksClient.send('audioStreamRequest', soundFile, streamSrc.lastBufferStartTime, streamSrc.bufferDuration);
  }

  stop( soundFile, fadeDuration = 0.3 ){
    // get src
    let streamSrc = this.streamSourcesMap.get(soundFile);
    let streamGain = this.outGainMap.get(soundFile);
    // discard if not started
    if( streamSrc === undefined ){ 
      console.warn('attempt to stop non-started audio source', soundFile, 'discarded'); 
      return;
    }
    // kill callback
    // WARNING: hyp. here is that fadeDuration lower than thresholdSeekingTime, 
    // otherwise you'd need to sustain callback until enough buffer remains to fade out
    clearInterval( streamSrc.updateCallback );
    // fade out gain
    const now = audioContext.currentTime;
    streamGain.gain.cancelScheduledValues(now);
    streamGain.gain.setValueAtTime(streamGain.gain.value, now);
    streamGain.gain.linearRampToValueAtTime(0.0, now + fadeDuration);
    // plan source stop
    streamSrc.refToCurrentAudioSource.stop( now + fadeDuration );
    // mark stop request
    // streamSrc.requestedStop = true;
  }

}




