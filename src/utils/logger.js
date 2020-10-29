'use strict';
const { createLogger, format, transports } = require('winston');
require('winston-mongodb');
const path = require('path');
// eslint-disable-next-line no-undef
const env = process.env.NODE_ENV || 'development', dbUrl = process.env.DB_URL;
const logDir = `log`;
const fileNameFormat = `qdo-qualif`;
const logFilename = path.join(logDir, `${fileNameFormat}.log`);

const logFormat = (info) =>
  `[${info.timestamp}] [${info.level}]: ${info.message}`;

const options = {
  console: {
    level: 'debug',
    format: format.combine(format.colorize(), format.printf(logFormat)),
  },

  file: {
    level: 'info',
    filename: logFilename,
    datePattern: 'YYYY-MM-DD',
    format: format.printf(logFormat),
  },

  mongoDb: {
    level: 'info',
    db: dbUrl,
    capped: true,
    datePattern: 'YYYY-MM-DD',
    format: format.printf(logFormat),
  },
  mongoDb_error: {
    level: 'error',
    db: dbUrl,
    collection: 'logError',
    capped: true,
    datePattern: 'YYYY-MM-DD',
    format: format.printf(logFormat),
  }
};

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    })
  )
});
if (env === 'development') {
  logger.add(new transports.Console(options.console));
  logger.add(new transports.File(options.file))
} else {
  logger.add(new transports.MongoDB(options.mongoDb));
  logger.add(new transports.MongoDB(options.mongoDb_error));
}

module.exports = logger;
