
// req audio read depts
const fs = require('fs');
var AudioContext = require('web-audio-api').AudioContext
const audioContext = new AudioContext;

function Float32Concat(first, second)
{
    var firstLength = first.length,
        result = new Float32Array(firstLength + second.length);

    result.set(first);
    result.set(second, firstLength);

    return result;
}

// server-side 'player' experience.
export default class AudioStreamHandler {
  constructor( soundworksServer, audioFiles ) {
  
    // locals
    this.audioBuffersMap = new Map();
    this.soundworksServer = soundworksServer;

    // init raw-socket service: create one channel per potential streamed audio file
    let audioFileNames = audioFiles.map( (x) => { return x.replace(/^.*[\\\/]/, ''); });
    var protocol = [];
    audioFileNames.forEach( (item, index) => {
      protocol.push( { channel: item, type: 'Float32' } );
    });
    this.rawSocket = soundworksServer.require('raw-socket', { protocol: protocol });
    console.log(protocol);

    // init: preload audio files in server
    this.preLoad( audioFiles );
  }

  // load audio files to audioBuffers (prior to any client connection)
  preLoad( audioFiles ){
    // read audio files that will then be available for streaming to clients
    audioFiles.forEach((item, index) => {
      fs.readFile(item, (err, buf) => {
        if (err) { throw err; }
        audioContext.decodeAudioData(buf, (audioBuffer) => {
          // store audio buffer
          let fileName = item.replace(/^.*[\\\/]/, '');
          this.audioBuffersMap.set(fileName, audioBuffer);
          // debug
          console.log('\nread file:', fileName);
          console.log('num channels:', audioBuffer.numberOfChannels);
          console.log('sample rate:', audioBuffer.sampleRate, 'Hz');
          console.log('duration:', audioBuffer.length / audioBuffer.sampleRate, 'sec \n');
        }, 
        (err) => { throw err; }); });
    });    
  }

  // executed at client connection
  enter( client ){

   // setup meta data exchange (send audio metadata to client upon request)
    this.soundworksServer.receive( client, 'audioMetaRequest', ( fileName ) => {
      console.log('received request for meta data of file:', fileName, 'from client:', client.index);
      // get associated audio buffer
      let audioBuffer = this.audioBuffersMap.get( fileName );
      // discard if buffer doesn't exist
      if( audioBuffer === undefined ){ 
        console.warn('requested metadata for undefined file:', fileName); 
        return; 
      }
      // shape data
      let data = {
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
        length: audioBuffer.length,
      }
      console.log('thus sent:', data)
      // send data
      this.soundworksServer.send( client, 'audioMeta', fileName, data );
    });

    // setup audio data exchange (send audio data to client upon request)
    this.soundworksServer.receive( client, 'audioStreamRequest', (soundFile, startTime, duration) => {
      this.seek( client, soundFile, startTime, duration);  
    }); 
  }

  seek( client, fileName, startTime, duration){
    console.log('client', client.index, 'request', fileName, 'startTime', startTime, 'dur', duration);
    // get audio buffer
    let audioBuffer = this.audioBuffersMap.get(fileName);
    // discard if wrong name
    if( audioBuffer === undefined ){ 
      console.warn('requesting unknown file name:', fileName); 
      return; 
    }
    // get data index start / end
    let startIndex = startTime * audioBuffer.sampleRate;
    // let endIndex = Math.min( (startTime + duration) * audioBuffer.sampleRate, audioBuffer.length );
    let endIndex = (startTime + duration) * audioBuffer.sampleRate;
    // discard if start index > length
    if( startIndex >= audioBuffer.length ){ 
      console.warn('requested start time out of range:', startTime, fileName); 
      return; 
    }
    // discard if end index == start index
    if( endIndex === startIndex ){ 
      console.warn('empty chunk, discard sending'); 
      return; 
    }
    // extract data + interleave
    let chunkLength = Math.ceil(endIndex - startIndex);
    let interleavedData = new Float32Array( audioBuffer.numberOfChannels * chunkLength );
    // console.log('out length:', interleavedData.length, chunkLength, 'from/to', startIndex, '/', endIndex)
    for( let nCh = 0; nCh < audioBuffer.numberOfChannels; nCh++ ){
      // default fetch in buffer
      if( endIndex < audioBuffer.length){
        var channelData = audioBuffer.getChannelData( nCh ).slice(startIndex, endIndex);
      }
      // handle loop mechanism
      else{
        console.log('in loop!', startIndex, endIndex, audioBuffer.length)
        let firstChunk = audioBuffer.getChannelData( nCh ).slice(startIndex, audioBuffer.length);
        let secondChunk = audioBuffer.getChannelData( nCh ).slice(0, endIndex - audioBuffer.length);
        var channelData = Float32Concat(firstChunk, secondChunk);
      }
      // add to output array
      console.log('client', client.index, 'ch', nCh, 'add data length', channelData.length ,'offset:', chunkLength, 'total length', interleavedData.length)
      interleavedData.set(channelData, nCh * chunkLength);
      // for( let i = 0; i < chunkLength; i++ ){
      //   interleavedData[ i*audioBuffer.numberOfChannels + nCh ] = channelData[i];
      // }
    }
    // send data
    this.rawSocket.send( client, fileName, interleavedData );
  }



}



















