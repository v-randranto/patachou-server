'use strict';

const express = require('express');
const router = express.Router();
const accounts = require('../controllers/accounts');

router.get('', accounts.getAccounts);
router.post('', accounts.addAccount);
router.put('', accounts.updateAccount);
router.delete('', accounts.deleteAccount);
router.get('/search', accounts.searchAccounts);

module.exports = router;
