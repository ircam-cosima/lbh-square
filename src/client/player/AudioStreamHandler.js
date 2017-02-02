import * as soundworks from 'soundworks/client';
const audioContext = soundworks.audioContext;

// same as audiostreamplayer but with manual streaming. 
// Not relying on html audio tag element: to achieve inter-device synchronization

export default class AudioStreamHandler {
  constructor( soundworksClient, audioFileNames ) {
    
    // locals
    this.soundworksClient = soundworksClient;
    this.streamSrcMap = new Map();

    // init stream sources for each potential streamed audio file (i.e. raw socket "channel")
    audioFileNames.forEach( (fileName) => {
      // create stream source
      let streamSrc = new StreamSource( fileName );
      // store stream source
      this.streamSrcMap.set( fileName, streamSrc );
      // setup socket reveive callbacks (receiving raw audio data)
      soundworksClient.rawSocket.receive(fileName, (data) => { 
        this.rawSocketCallback(fileName, data);
      });
    });

    // define callback for receiving metadata
    this.soundworksClient.receive('audioMeta', (fileName, metaData) => {
      let streamSrc = this.streamSrcMap.get( fileName );
      streamSrc.metaData = metaData;
      // check for too short sources (did not want to bother with that..)
      if( (metaData.length / metaData.sampleRate) < streamSrc.BUFFER_DURATION ){
        console.warn('WARNING: too short audio file, will not work for:', fileName, 
          '\n consider reducing BUFFER_DURATION');
      }
    });
    // request meta data from server for each source
    audioFileNames.forEach( (fileName) => {
      this.soundworksClient.send('audioMetaRequest', fileName );
    });

  }

  // start (streamed) audio source: startTime is the start position in buffer
  // ("start now, at startTime in buffer")
  start( fileName, startTime, fadeDuration = 0.3, loop = false ){
    // get stream source
    let streamSrc = this.streamSrcMap.get( fileName );
    // discard if undefined source
    if( streamSrc === undefined ){ console.warn('attempt to play undefined file', fileName); return; }

    // update stream source parameters
    streamSrc.nextSystemStartTime = this.soundworksClient.sync.getSyncTime();
    streamSrc.nextBufferStartTime = startTime;
    streamSrc.fadeDuration = fadeDuration;
    streamSrc.loop = loop;
    
    // check if loop mechanism required
    this.handleLoop( streamSrc );

    // require first buffer from server
    this.soundworksClient.send('audioStreamRequest', fileName, startTime, streamSrc.BUFFER_DURATION);

    // add auto-update callback
    streamSrc.callback.handle = setInterval( () => {
      this.srcUpdateCallback( fileName );
    }, streamSrc.callback.REFRESH_RATE_IN_MS );

  }

  // handle data received from raw socket channel "channelName"
  rawSocketCallback( channelName, data ){
    console.log('received data for', channelName, 'of length', data.length);

    // get stream source
    let streamSrc = this.streamSrcMap.get(channelName);
    streamSrc.fillNextBuffer( data );

    // estimate system time at which received data (hence audio buffer, hence audio source) is due to play
    let relativeSystemStartTime = this.soundworksClient.sync.getSyncTime() - streamSrc.nextSystemStartTime;
    console.log('start chunk', streamSrc.nextBufferStartTime, 'in', relativeSystemStartTime, 'sec')

    // start stream source chunk
    streamSrc.startNextBuffer( relativeSystemStartTime );
  }

  // callback used by each stream source to request from the server an update of it's data 
  // (when nearly reached end of current audio buffer)
  srcUpdateCallback( fileName ){
    // get stream source
    let streamSrc = this.streamSrcMap.get( fileName );

    // check how long remains with current buffer
    let now = this.soundworksClient.sync.getSyncTime();
    let timeBeforeLastBufferOver = streamSrc.nextSystemStartTime + streamSrc.BUFFER_DURATION - now;
    console.log('remains', timeBeforeLastBufferOver, 'sec of current buffer');
    
    // do nothing if enought buffered data for now
    if( timeBeforeLastBufferOver > streamSrc.CACHE_TIME_THRESHOLD ){ return; }

    // get next time stamps
    streamSrc.nextBufferStartTime += streamSrc.BUFFER_DURATION;
    streamSrc.nextSystemStartTime = now + timeBeforeLastBufferOver;

    // check if loop mechanism required
    this.handleLoop( streamSrc );
    
    // request for next data chunk
    this.soundworksClient.send('audioStreamRequest', fileName, streamSrc.nextBufferStartTime, streamSrc.BUFFER_DURATION);
    console.log('request new buffer starting at', streamSrc.nextBufferStartTime, 'sec');

  }

  stop( fileName, fadeDuration = 0.3 ){
    // get src
    let streamSrc = this.streamSrcMap.get( fileName );
    // discard if doesn't exist
    if( streamSrc === undefined ){ 
      console.warn('attempt to stop unknown source:', fileName ); 
      return;
    }
    // discard if not started (i.e no ref to audioBufferNode)
    if( streamSrc.refToCurrentAudioSource === undefined ){ 
      console.warn('attempt to stop non-started audio source', fileName ); 
      return;
    }
    // remove source callback (request data from server no longer)
    // WARNING: hyp. here is that fadeDuration lower than thresholdSeekingTime, 
    // otherwise you'd need to sustain callback until enough buffer remains to fade out
    clearInterval( streamSrc.callback.handle );
    // fade out gain
    const now = audioContext.currentTime;
    streamSrc.out.gain.cancelScheduledValues(now);
    streamSrc.out.gain.setValueAtTime(streamSrc.out.gain.value, now);
    streamSrc.out.gain.linearRampToValueAtTime(0.0, now + fadeDuration);
    // plan source stop
    streamSrc.refToCurrentAudioSource.stop( now + fadeDuration );
    // reset source 
    streamSrc.refToCurrentAudioSource = undefined;
    streamSrc.hasFadedIn = false;
  }

  handleLoop( streamSrc ){
    // check if reached end of file
    let duration = streamSrc.metaData.length / streamSrc.metaData.sampleRate;
    if( streamSrc.nextBufferStartTime > duration ){
      // stop source (and skip next data request)
      if( !streamSrc.loop ){ 
        this.stop( streamSrc.fileName );
        return;
      }
      // fire loop mechanism (the server does all the ring buffer work here)
      console.log('loop reached');
      streamSrc.nextBufferStartTime -= duration;
    }    
  }

}


class StreamSource {
  constructor( fileName ) {

    this.fileName = fileName;
    // metadata defining file associated with the streamSource
    this.metaData = { sampleRate: 44100, numberOfChannels:1, length:0 };
    // system time at which nex buffer will be played
    this.nextSystemStartTime = -1;
    // handle to callback in charge of requesting audio data from server
    // and its "setInterval" rate
    this.callback = { handle: undefined, REFRESH_RATE_IN_MS: 1000 };
    // duration of requested data blocks, in seconds
    this.BUFFER_DURATION = 4.0;
    // time threshold, in sec, below which a data request will be sent:
    // when only .. sec remain in current buffer, go fetch another
    this.CACHE_TIME_THRESHOLD = 2.0;
    // start time, wrt the audio file timeframe, of the last audio buffer received
    this.nextBufferStartTime = -1;
    // reference to current audio source node (e.g. handle for stop)
    this.refToCurrentAudioSource = undefined,
    // mark source as faded in or not, to trigger fade in only first time buffer is received 
    // and played
    this.hasFadedIn = false;
    // remember fadeDuration 
    this.fadeDuration = 0.1;
    // output gain
    this.out = audioContext.createGain();
    this.out.connect( audioContext.destination );
    // loop 
    this.loop = false;

  }

  // create audio source from received audio data
  fillNextBuffer( data ){ 
    // create audio buffer
    console.log('received data', data.length,  this.metaData.numberOfChannels)
    let bufferLength = data.length / this.metaData.numberOfChannels; // anticipate potentially interleaved data
    console.log('create buffer', this.metaData.numberOfChannels, bufferLength, this.metaData.sampleRate)
    let audioBuffer = audioContext.createBuffer(this.metaData.numberOfChannels, bufferLength, this.metaData.sampleRate);
    
    // for each audio channel ...
    for( let nCh = 0; nCh < audioBuffer.numberOfChannels; nCh++ ){
      let audioBufferDataArray = audioBuffer.getChannelData( nCh );
      // ... copy data to audio buffer
      for( let i = 0; i < bufferLength; i++ ){
        audioBufferDataArray[i] = data[ i * audioBuffer.numberOfChannels + nCh ];
      }
    }

    // create audio source
    let src = audioContext.createBufferSource();
    src.buffer = audioBuffer;
    // connect graph
    src.connect( this.out );
    // store reference
    this.refToCurrentAudioSource = src;
    
    return src;
  }

  startNextBuffer( relativeSystemStartTime ){
    // discard if required start time is after current buffer duration 
    // (i.e. buffer was received so late it's deprecated)
    if( relativeSystemStartTime > ( this.nextBufferStartTime + this.BUFFER_DURATION ) ){
      console.log('skipping deprecated (received too late) buffer');
      return;
    }

    const now = audioContext.currentTime;
    
    // handle fade in if first audio buffer
    if( !this.hasFadedIn ){
      // reset gain
      this.out.gain.cancelScheduledValues(now);
      this.out.gain.setValueAtTime(0.0, now);
      // fade in
      if( relativeSystemStartTime > 0){ // immediate: received buffer after start time
        this.out.gain.linearRampToValueAtTime(1.0, now + this.fadeDuration);
      }
      else{ // in the future (received buffer in advance)
        setTimeout( this.out.gain.linearRampToValueAtTime(1.0, now + this.fadeDuration) , - relativeSystemStartTime*1000 );
      }
      this.hasFadedIn = true;
    }

    // start source now (not from beginning since we're already late)
    if( relativeSystemStartTime > 0 ){ 
      this.refToCurrentAudioSource.start(now, relativeSystemStartTime); 
    }
    // start source delayed (from beginning in abs(relativeSystemStartTime) seconds)
    else{ this.refToCurrentAudioSource.start(now - relativeSystemStartTime, 0); }
  }

}




















