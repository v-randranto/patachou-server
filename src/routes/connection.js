'use strict'

const express = require('express');
const router = express.Router();
const login = require('../controllers/login');
const register = require('../controllers/register');

router.post('/login', login.authenticate);
router.post('/register', register.addAccount);

module.exports = router;
