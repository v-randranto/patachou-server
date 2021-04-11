'use strict';

const express = require('express');
const router = express.Router();
const {addRecipe, getAccountRecipes} = require('../controllers/recipes');

router.route('/accounts/:id').get(getAccountRecipes)
router.route('').post(addRecipe)
// router.get('/accounts/:id', recipes.getAccountRecipes);
// router.post('', recipes.addRecipe);

module.exports = router;
