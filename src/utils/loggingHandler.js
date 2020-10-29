'use strict';
const logger = require('./logger');

exports.logging = function (level, base, sessionId = 'none', msg = '', object = null) {
  let message = `[${base}] [ID=${sessionId}] ${msg}`;
  if (object) {
    message += `- ${object}`;
  }
  switch (level) {
    case 'debug':
      logger.debug(message);
      break;
    case 'info':
      logger.info(message);
      break;
    case 'warn':
      logger.warn(message);
      break;
    case 'error':
      logger.error(message);
      break;
  }
};
