'use strict';

const express = require('express');
const router = express.Router();
const accounts = require('../controllers/accounts');
const register = require('../controllers/register');

router.post('', accounts.addAccount);
router.get('', accounts.getAccounts);
router.get('/id/:id', accounts.getOneAccount);
router.put('/id/:id', accounts.updateAccount);
router.delete('/id/:id', accounts.deleteAccount);
router.get('/search', accounts.searchAccounts);

module.exports = router;
