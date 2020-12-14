'use strict';

const mongoose = require('mongoose');

const recipeSchema = mongoose.Schema({
  accountId: { type: String, required: true },
  title: { type: String, required: true, lowercase: true, trim: true },
  category: { type: String, required: true },
  realisation: { 
    difficulty: { type: Number, required: true },
    preparationTime: { type: Number, required: true },
    bakingTime: { type: Number, required: true }
  },
  nbOfPeople: { type: Number, required: true },
  ingredients: [String],
  instructions: [String],
  privacyLevel: { type: Number, required: true },
  creationDate: { type: Date, default: Date.now },
  modificationDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recipe', recipeSchema);