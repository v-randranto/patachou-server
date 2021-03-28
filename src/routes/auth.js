'use strict'

const express = require('express');
const router = express.Router();
const {register, login, lostPassword, resetPassword} = require('../controllers/auth');

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/lost-password').post(lostPassword)
router.route('/reset-password/:resetToken').put(resetPassword)

module.exports = router;
