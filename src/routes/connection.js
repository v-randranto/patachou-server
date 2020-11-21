'use strict'

const express = require('express');
const router = express.Router();
const register = require('../controllers/register');

router.post('/register', register.addAccount);

module.exports = router;
