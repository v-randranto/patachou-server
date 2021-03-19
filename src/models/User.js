'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken');

const cloudinary = require('cloudinary').v2;
const sendEmail = require('../utils/sendEmail');

const {
  getRandomInt
} = require('../utils/randomNumber')

const UserSchema = new mongoose.Schema({
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
  photo: {
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

UserSchema.pre("save", async function (next) {
  if (!this.isModified) {
    next()
  }

  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }
  
  if (!this.isModified("photo")) {
    if (this.photo) {
      this.storePhoto(this.photo.content)
    } else {
      this.photo = process.env[`DEFAULT_AVATAR_${getRandomInt(4)}`]
    }
  }
  
  next()
})

UserSchema.methods.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

UserSchema.methods.getSignedToken = function () {
  return jwt.sign({
    id: this._id,
    pseudo: this.pseudo
  }, process.env.TOKEN_KEY, {
    expiresIn: process.env.TOKEN_EXPIRE
  })
}

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex")
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
  this.resetPasswordExpire = Date.now() + (60 * 60 * 1000)
  return resetToken;
}

UserSchema.methods.sendRegisterEmail = async function (options, variables) {
  return await sendEmail(options, "register", variables)
}

UserSchema.methods.sendResetPasswordEmail = async function (options, variables) {
  return await sendEmail(options, "forgotPassword", variables)
}

UserSchema.methods.storePhoto = async function (content) {
  const folder = 'patachou';
  try {
    const result = await cloudinary.uploader.upload(content, {
      folder
    })
    this.photo = result.secure_url;
  } catch (error) {
    this.photo = process.env[`DEFAULT_AVATAR_${getRandomInt(4)}`]
  }
}

const User = mongoose.model('User', UserSchema);
module.exports = User;