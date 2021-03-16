'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  pseudo: {
    type: String,
    required: [true, 'Le pseudo est obligatoire'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, "L'email est obligatoire"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Le mot de passe est obligatoire"],
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified) {
    next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
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

const User = mongoose.model('User', UserSchema);
module.exports = User;