/* eslint-disable no-undef */
'use strict';
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { logging } = require('./utils/loggingHandler');
// eslint-disable-next-line no-undef
const { base } = require('path').parse(__filename);
const httpStatusCodes = require('../src/constants/httpStatusCodes.json');

const connectDB = require('./config/db-config')

const authRouter = require('./routes/auth');
const privateRouter = require('./routes/private');
const errorHandler = require('./middleware/error');

const PATH_STATIC_FILES = 'dist/patachou-client/';
const AUTH_API_PATH = '/api/auth/';
const PRIVATE_API_PATH = '/api/private/';

const app = express();
app.use(helmet());
app.use(bodyParser.json({limit: '1mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));
app.use(cors());
app.use(express.static(PATH_STATIC_FILES));

connectDB();

app.use((req, res, next) => {
  logging('info', base, req.sessionID, `PATH=${req.originalUrl}`);
  next();
});

// routes
app.use(AUTH_API_PATH, authRouter);
app.use(PRIVATE_API_PATH, privateRouter);

app.get('/*', function (req, res) {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile('index.html', { root: PATH_STATIC_FILES });
  }
});

app.use(function (req, res) {  
  logging('info', base, req.sessionID, `PATH=${req.originalUrl} not found !`);
  res.status(httpStatusCodes.NOT_FOUND).end();  
});

app.use(errorHandler)

module.exports = app;