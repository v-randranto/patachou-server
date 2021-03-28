'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken');

const cloudinary = require('cloudinary').v2;
const sendEmail = require('../utils/sendEmail');
const storePhoto = require('../utils/storePhoto');

const {
  getRandomInt
} = require('../utils/randomNumber')

const AccountSchema = new mongoose.Schema({
  pseudo: {
    type: String,
    required: [true, 'Le pseudo est obligatoire'],
    unique: true,
  },

  email: {
    type: String,
    required: [true, "L'email est obligatoire"],
  },

  password: {
    type: String,
    required: [true, "Le mot de passe est obligatoire"],
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  presentation: {
    type: String,
    default: 'Je prépare un pitch de présentation aux petits oignons...'
  },
  photoUrl: {
    type: String
  },

  creationDate: {
    type: Date,
    default: Date.now
  },
  modificationDate: {
    type: Date,
    default: Date.now
  }
});

AccountSchema.pre("save", async function (next) {
  if (!this.isModified) {
    next()
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }

  if (this.isModified("photoUrl")) {
    this.photoUrl = await storePhoto(this.photoUrl)
  } else {
    this.photoUrl = process.env[`DEFAULT_AVATAR_${getRandomInt(4)}`]
  }
  next()
})

AccountSchema.methods.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

AccountSchema.methods.getSignedToken = function () {
  return jwt.sign({
    id: this._id,
    pseudo: this.pseudo
  }, process.env.TOKEN_KEY, {
    expiresIn: process.env.TOKEN_EXPIRE
  })
}

AccountSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex")
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
  this.resetPasswordExpire = Date.now() + (60 * 60 * 1000)
  return resetToken;
}

AccountSchema.methods.sendRegisterEmail = async function (options, variables) {
  return await sendEmail(options, "register", variables)
}

AccountSchema.methods.sendResetPasswordEmail = async function (options, variables) {
  return await sendEmail(options, "lostPassword", variables)
}

const Account = mongoose.model('Account', AccountSchema);
module.exports = Account;