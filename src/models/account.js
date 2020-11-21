'use strict';

const mongoose = require('mongoose');

const accountSchema = mongoose.Schema({
  pseudo: { type: String, required: true },
  password: { type: String, required: true },
  salt: { type: String },
  pwdExpiringDate: { type: Date, required: true, default: '01/01/2100' },
  presentation: { type: String, default: 'Pas de présentation' },
  email: { type: String, required: true },
  isAdmin: { type: Boolean, required: true, default: false },
  photoUrl: { type: String },
  creationDate: { type: Date, default: Date.now },
  modificationDate: { type: Date, required: true, default: Date.now }
});

module.exports = mongoose.model('Account', accountSchema);