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

const accountsRouter = require('./routes/accounts');
const authRouter = require('./routes/auth');
const recipesRouter = require('./routes/recipes');
const errorHandler = require('./middleware/error');

const PATH_STATIC_FILES = 'dist/patachou-client/';
const ACCOUNTS_API_PATH = '/api/accounts/';
const AUTH_API_PATH = '/api/auth/';
const RECIPES_API_PATH = '/api/recipes/';

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
app.use(ACCOUNTS_API_PATH, accountsRouter);
app.use(AUTH_API_PATH, authRouter);
app.use(RECIPES_API_PATH, recipesRouter);

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