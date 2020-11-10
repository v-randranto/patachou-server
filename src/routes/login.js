'use strict';

const express = require('express');
const router = express.Router();
const accounts = require('../controllers/accounts');

router.post('', accounts.login);
router.get('', accounts.logout);

module.exports = router;
