/* eslint-disable no-undef */
'use strict';
require('dotenv').config();
// const createError = require('http-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const expressSession = require('express-session');
const MongoStore = require('connect-mongo')(expressSession);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { logging } = require('./utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../src/constants/httpStatusCodes.json');

const accountsRouter = require('./routes/accounts');
const connectionRouter = require('./routes/connection');
const PATH_STATIC_FILES = 'dist/patachou-client/';
const ACCOUNTS_API_PATH = '/api/accounts/';
const CONNECTION_API_PATH = '/api/connection/';

const app = express();
app.use(helmet());
app.use(bodyParser.json({limit: '1mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));
app.use(cors());
app.use(express.static(PATH_STATIC_FILES));

const dbUrl = process.env.DB_URL;

mongoose
  .connect(dbUrl, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false  })
  .then(() => {
    logging('info', base, null, `Connected to MongoDB`);
  })
  .catch((error) => {
    logging('error', base, null, 'MongoDB connection failed !', error);
    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).end();
  });

const options = {
  store: new MongoStore({
    url: dbUrl,
    ttl: process.env.SESSION_TTL,
    collection: process.env.SESSION_NAME,
  }),
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  cookie: {
    httpOnly: true,
    secure: true,
    // maxAge: process.env.COOKIE_MAXAGE
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES)
  },
};

app.use(expressSession(options));

app.use((req, res, next) => {
  logging('info', base, req.sessionID, `PATH=${req.originalUrl}`);
  next();
});

// routes
app.use(ACCOUNTS_API_PATH, accountsRouter);
app.use(CONNECTION_API_PATH, connectionRouter);

app.get('/*', function (req, res) {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile('index.html', { root: PATH_STATIC_FILES });
  }
});

app.use(function (req, res) {  
  logging('info', base, req.sessionID, `PATH=${req.originalUrl} not found !`);
  res.status(httpStatusCodes.NOT_FOUND).end();  
});

module.exports = app;