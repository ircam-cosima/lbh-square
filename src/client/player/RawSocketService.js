/**
 * 
 **/

import * as soundworks from 'soundworks/client';
const client = soundworks.client;

// import sio from 'socket.io-client';

const dbgFlag = '[Secure RawSocketService]';

export default class RawSocketService {
  constructor(port) {

    const socketProtocol = window.location.protocol.replace(/^http/, 'ws');
    const socketHostname = window.location.hostname;
    const url = `${socketProtocol}//${socketHostname}:${port}`;
    
    let ws = new WebSocket(url);

    console.log('connecting websocket to', url);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log(dbgFlag, 'socket connected to:', url);
    };

    ws.onmessage = (event) => {
      var array = new Uint32Array(event.data);
      console.log(dbgFlag, 'Successfully received data: ', array.length, array);
      ws.send(array.buffer);
    };

  }



}