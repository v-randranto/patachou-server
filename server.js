'use strict';
require('dotenv').config();
const app = require('./src/app');
const debug = require('debug')('backend:server');
const http = require('http');
const { logging } = require('./src/utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);

// eslint-disable-next-line no-undef
const port = normalizePort(process.env.PORT || 3001);
const noSession = null;
app.set('port', port);
// création du serveur http

const server = http.createServer(app);

server.listen(port, function () {  
  logging('info', base, noSession,
    // eslint-disable-next-line no-undef
    `Server ${process.env.NODE_ENV.toUpperCase()} listening on port ${port}`
  );
});
server.on('error', onError);
server.on('listening', onListening);

// normalisation du n° port d'écoute
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

// Gestion des erreurs sur serveur http
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      logging('error', base, noSession, `${bind} requires elevated privileges`);
      // eslint-disable-next-line no-undef
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logging('error', base, noSession, `${bind} is already in use`);
      // eslint-disable-next-line no-undef
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
// Gestion des erreurs sur serveur http.
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}