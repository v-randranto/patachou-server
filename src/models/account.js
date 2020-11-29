'use strict';

const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
  pseudo: { type: String, required: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  pwdExpiringDate: { type: Date, required: true, default: '01/01/2100' },
  presentation: { type: String, default: 'Je prépare un pitch de présentation aux petits oignons...' },
  email: { type: String, required: true },
  isAdmin: { type: Boolean, required: true, default: false },
  photoUrl: { type: String, required: true },
  creationDate: { type: Date, required: true, default: Date.now },
  modificationDate: { type: Date, required: true, default: Date.now },
  isLoggedIn: { type: Boolean, required: true, default: false },
  isIdle: { type: Boolean, required: true, default: false }
});

module.exports = mongoose.model('Account', accountSchema);