'use strict'

const express = require('express');
const router = express.Router();
// const login = require('../controllers/login');
// const register = require('../controllers/register');
const {register, login, forgotPassword, resetPassword} = require('../controllers/auth');

// router.post('/login', login.authenticate);
// router.post('/register', register.addAccount);

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/forgot-password').post(forgotPassword)
router.route('/reset-password/:resetToken').put(resetPassword)

module.exports = router;
