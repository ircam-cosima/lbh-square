/**
 * Test for rawsocket streaming in https mode.
 * to use, open chrome with 
 * Google\ Chrome --user-data-dir=/tmp/whatever --ignore-certificate-errors
 **/

import http from 'http';
import https from 'https';
import pem from 'pem';
import express from 'express';

const dbgFlag = '[Secure RawSocketService]';

import * as soundworks from 'soundworks/server';
const server = soundworks.server;

export default class RawSocketService {
  constructor(port) {

    // init express app
    let app = express();

    // check http / https mode
    let useHttps = server.config.useHttps;
    console.log(dbgFlag, 'is secure (https) connection:', useHttps);

    // create either http or https server
    if (!useHttps) {
      let httpServer = http.createServer(app);
      this.setup(httpServer, port);

    } else {
      pem.createCertificate({ days: 1, selfSigned: true }, (err, keys) => {
        let httpsServer = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app);
        this.setup(httpsServer, port);
      });
    }

  }

  setup(server, port) {

    server.listen(port, () => {
      console.log(dbgFlag, 'server listening on *:' + port);
    });

    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({ server: server });

    wss.on('connection', (ws) => {

      ws.on('message', (msg) => {
      	let array =  new Uint32Array(msg);
        console.log('received:', array);
      });

      let array = new Uint32Array(1);
      for (let i = 0; i < array.length; i++) {  array[i] = i+1; }
      ws.send( array.buffer, { binary: true, mask: false } );
    });

  }

}