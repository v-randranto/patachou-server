'use strict';

const express = require('express');
const router = express.Router();
const recipes = require('../controllers/recipes');

router.delete('/:id', recipes.deleteRecipe);
router.get('', recipes.getRecipes);
router.get('/:id', recipes.getOneRecipe);
router.get('/search', recipes.searchRecipes);
router.post('', recipes.addRecipe);
router.put('/:id', recipes.updateRecipe);

module.exports = router;
