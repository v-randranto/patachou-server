'use strict';

const express = require('express');
const router = express.Router();
const accounts = require('../controllers/accounts');
const recipes = require('../controllers/recipes');

router.get('', accounts.getAccounts);
router.get('/:id', accounts.getOneAccount);
router.put('/:id', accounts.updateAccount);
router.delete('/:id', accounts.deleteAccount);
router.get('/search', accounts.searchAccounts);

router.get('/:id/recipes', recipes.getAccountRecipes);

module.exports = router;