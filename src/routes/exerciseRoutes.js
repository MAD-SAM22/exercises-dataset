const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');

// Specific resource & utility routes
router.get('/categories', exerciseController.getCategories);
router.get('/equipments', exerciseController.getEquipments);
router.get('/targets', exerciseController.getTargets);
router.get('/random', exerciseController.getRandomExercises);
router.get('/suggestions', exerciseController.getSuggestions);
router.get('/stats', exerciseController.getDatasetStats);
router.get('/batch', exerciseController.getBatchExercises);
router.post('/batch', exerciseController.getBatchExercises);

// Single exercise lookup by ID
router.get('/:id', exerciseController.getExerciseById);

// Root exercises collection route with pagination & search
router.get('/', exerciseController.getExercises);

module.exports = router;
