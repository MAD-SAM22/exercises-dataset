const exerciseService = require('../services/exerciseService');

/**
 * Controller to handle GET /exercises
 */
function getExercises(req, res) {
  try {
    const result = exerciseService.getPaginatedExercises(req.query);

    return res.status(200).json({
      success: true,
      meta: result.meta,
      data: result.data
    });
  } catch (error) {
    console.error('[getExercises Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve exercises'
    });
  }
}

/**
 * Controller to handle GET /exercises/random
 */
function getRandomExercises(req, res) {
  try {
    const data = exerciseService.getRandomExercises(req.query);
    return res.status(200).json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('[getRandomExercises Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve random exercises'
    });
  }
}

/**
 * Controller to handle GET /exercises/suggestions
 */
function getSuggestions(req, res) {
  try {
    const { q, limit } = req.query;
    const suggestions = exerciseService.getSuggestions(q, limit);
    return res.status(200).json({
      success: true,
      query: q || '',
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('[getSuggestions Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve search suggestions'
    });
  }
}

/**
 * Controller to handle GET /exercises/stats
 */
function getDatasetStats(req, res) {
  try {
    const stats = exerciseService.getDatasetStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[getDatasetStats Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve dataset statistics'
    });
  }
}

/**
 * Controller to handle POST /exercises/batch and GET /exercises/batch
 */
function getBatchExercises(req, res) {
  try {
    let ids = [];
    if (req.method === 'POST' && req.body && Array.isArray(req.body.ids)) {
      ids = req.body.ids;
    } else if (req.query && req.query.ids) {
      ids = String(req.query.ids).split(',').map((s) => s.trim()).filter(Boolean);
    }

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array or comma-separated list of exercise IDs under "ids".'
      });
    }

    const result = exerciseService.getExercisesByIds(ids);
    return res.status(200).json({
      success: true,
      found_count: result.found_count,
      not_found_ids: result.not_found_ids,
      data: result.data
    });
  } catch (error) {
    console.error('[getBatchExercises Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve batch exercises'
    });
  }
}

/**
 * Controller to handle GET /exercises/categories
 */
function getCategories(req, res) {
  try {
    const categories = exerciseService.getCategories();
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('[getCategories Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories'
    });
  }
}

/**
 * Controller to handle GET /exercises/equipments
 */
function getEquipments(req, res) {
  try {
    const equipments = exerciseService.getEquipments();
    return res.status(200).json({
      success: true,
      data: equipments
    });
  } catch (error) {
    console.error('[getEquipments Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve equipment list'
    });
  }
}

/**
 * Controller to handle GET /exercises/targets
 */
function getTargets(req, res) {
  try {
    const targets = exerciseService.getTargets();
    return res.status(200).json({
      success: true,
      data: targets
    });
  } catch (error) {
    console.error('[getTargets Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve target muscles'
    });
  }
}

/**
 * Controller to handle GET /exercises/:id
 */
function getExerciseById(req, res) {
  try {
    const { id } = req.params;

    // Check for special reserved paths
    if (id === 'categories') return getCategories(req, res);
    if (id === 'equipments') return getEquipments(req, res);
    if (id === 'targets') return getTargets(req, res);
    if (id === 'random') return getRandomExercises(req, res);
    if (id === 'suggestions') return getSuggestions(req, res);
    if (id === 'stats') return getDatasetStats(req, res);
    if (id === 'batch') return getBatchExercises(req, res);

    const exercise = exerciseService.getExerciseById(id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: `Exercise with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('[getExerciseById Controller Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve exercise record'
    });
  }
}

module.exports = {
  getExercises,
  getExerciseById,
  getRandomExercises,
  getSuggestions,
  getDatasetStats,
  getBatchExercises,
  getCategories,
  getEquipments,
  getTargets
};
