const fs = require('fs');
const path = require('path');

// Resolve path to exercises.json using process.cwd() for reliable local & serverless execution
const datasetPath = path.join(process.cwd(), 'data/exercises.json');

let exercises = [];
let idMap = new Map();
let categoriesSet = new Set();
let equipmentsSet = new Set();
let targetsSet = new Set();

function loadDataset() {
  if (exercises.length > 0) return;

  try {
    const rawData = fs.readFileSync(datasetPath, 'utf8');
    const data = JSON.parse(rawData);

    exercises = data.map((item) => {
      return {
        id: String(item.id),
        name: item.name,
        category: item.category || item.body_part,
        body_part: item.body_part || item.category,
        equipment: item.equipment,
        instructions: item.instructions || {},
        instruction_steps: item.instruction_steps || {},
        muscle_group: item.muscle_group,
        secondary_muscles: Array.isArray(item.secondary_muscles) ? item.secondary_muscles : [],
        target: item.target,
        rep_kcal: item.rep_kcal ?? null,
        min_kcal: item.min_kcal ?? null,
        media_id: item.media_id,
        image: item.image,
        gif_url: item.gif_url,
        attribution: item.attribution || '© Gym visual — https://gymvisual.com/',
        created_at: item.created_at || new Date().toISOString()
      };
    });

    // Populate lookup map and sets
    exercises.forEach((ex) => {
      idMap.set(ex.id, ex);

      const unpaddedId = String(parseInt(ex.id, 10));
      if (!idMap.has(unpaddedId)) {
        idMap.set(unpaddedId, ex);
      }

      if (ex.body_part) categoriesSet.add(ex.body_part.toLowerCase());
      if (ex.equipment) equipmentsSet.add(ex.equipment.toLowerCase());
      if (ex.target) targetsSet.add(ex.target.toLowerCase());
    });

    console.log(`[exerciseService] Successfully loaded ${exercises.length} exercises.`);
  } catch (err) {
    console.error('[exerciseService] Error loading dataset:', err);
    exercises = [];
  }
}

// Ensure dataset is loaded at startup
loadDataset();

function parseCommaValues(val) {
  if (!val) return [];
  return String(val)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function selectFields(item, fieldsList) {
  if (!fieldsList || fieldsList.length === 0) return item;
  const projected = {};
  fieldsList.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(item, field)) {
      projected[field] = item[field];
    }
  });
  return projected;
}

function getPaginatedExercises(query = {}) {
  loadDataset();

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));

  const bodyPartFilters = parseCommaValues(query.body_part);
  const equipmentFilters = parseCommaValues(query.equipment);
  const targetFilters = parseCommaValues(query.target);
  const qFilter = query.q ? String(query.q).trim().toLowerCase() : null;
  const sortOption = query.sort ? String(query.sort).trim().toLowerCase() : 'id_asc';
  const selectedFields = parseCommaValues(query.fields);

  let filtered = [...exercises];

  if (bodyPartFilters.length > 0) {
    filtered = filtered.filter((ex) => {
      const bp = ex.body_part ? ex.body_part.toLowerCase() : '';
      const cat = ex.category ? ex.category.toLowerCase() : '';
      return bodyPartFilters.includes(bp) || bodyPartFilters.includes(cat);
    });
  }

  if (equipmentFilters.length > 0) {
    filtered = filtered.filter((ex) => {
      const eq = ex.equipment ? ex.equipment.toLowerCase() : '';
      return equipmentFilters.includes(eq);
    });
  }

  if (targetFilters.length > 0) {
    filtered = filtered.filter((ex) => {
      const tgt = ex.target ? ex.target.toLowerCase() : '';
      return targetFilters.includes(tgt);
    });
  }

  if (qFilter) {
    filtered = filtered.filter((ex) => {
      const nameMatch = ex.name && ex.name.toLowerCase().includes(qFilter);
      const targetMatch = ex.target && ex.target.toLowerCase().includes(qFilter);
      const equipMatch = ex.equipment && ex.equipment.toLowerCase().includes(qFilter);
      const bodyPartMatch = ex.body_part && ex.body_part.toLowerCase().includes(qFilter);
      const muscleMatch = ex.muscle_group && ex.muscle_group.toLowerCase().includes(qFilter);
      const secMuscleMatch = ex.secondary_muscles.some((m) => m.toLowerCase().includes(qFilter));
      return nameMatch || targetMatch || equipMatch || bodyPartMatch || muscleMatch || secMuscleMatch;
    });
  }

  switch (sortOption) {
    case 'name_asc':
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name_desc':
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'id_desc':
      filtered.sort((a, b) => b.id.localeCompare(a.id));
      break;
    case 'id_asc':
    default:
      filtered.sort((a, b) => a.id.localeCompare(b.id));
      break;
  }

  const totalItems = filtered.length;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0;
  const startIndex = (page - 1) * limit;
  let paginatedItems = filtered.slice(startIndex, startIndex + limit);

  if (selectedFields.length > 0) {
    paginatedItems = paginatedItems.map((item) => selectFields(item, selectedFields));
  }

  return {
    meta: {
      pagination: {
        total_items: totalItems,
        returned_items: paginatedItems.length,
        current_page: page,
        total_pages: totalPages,
        limit: limit,
        has_next: page < totalPages,
        has_prev: page > 1 && totalPages > 0
      },
      filters: {
        body_part: query.body_part || null,
        equipment: query.equipment || null,
        target: query.target || null,
        q: query.q || null,
        sort: sortOption,
        fields: query.fields || null
      }
    },
    data: paginatedItems
  };
}

function getExerciseById(id) {
  loadDataset();
  if (!id) return null;

  const strId = String(id).trim();

  if (idMap.has(strId)) {
    return idMap.get(strId);
  }

  const paddedId = strId.padStart(4, '0');
  if (idMap.has(paddedId)) {
    return idMap.get(paddedId);
  }

  return null;
}

function getExercisesByIds(idsArray = []) {
  loadDataset();
  const results = [];
  const notFound = [];

  idsArray.forEach((id) => {
    const ex = getExerciseById(id);
    if (ex) {
      results.push(ex);
    } else {
      notFound.push(id);
    }
  });

  return {
    found_count: results.length,
    not_found_ids: notFound,
    data: results
  };
}

function getRandomExercises(query = {}) {
  loadDataset();
  const count = Math.min(50, Math.max(1, parseInt(query.count, 10) || 5));

  const bodyPartFilter = query.body_part ? String(query.body_part).trim().toLowerCase() : null;
  const equipmentFilter = query.equipment ? String(query.equipment).trim().toLowerCase() : null;
  const targetFilter = query.target ? String(query.target).trim().toLowerCase() : null;

  let pool = exercises;

  if (bodyPartFilter) {
    pool = pool.filter((ex) => ex.body_part && ex.body_part.toLowerCase() === bodyPartFilter);
  }
  if (equipmentFilter) {
    pool = pool.filter((ex) => ex.equipment && ex.equipment.toLowerCase() === equipmentFilter);
  }
  if (targetFilter) {
    pool = pool.filter((ex) => ex.target && ex.target.toLowerCase() === targetFilter);
  }

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

function getSuggestions(qStr, limit = 10) {
  loadDataset();
  if (!qStr) return [];
  const q = String(qStr).trim().toLowerCase();
  const maxResults = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));

  const matches = [];
  for (const ex of exercises) {
    if (ex.name.toLowerCase().includes(q)) {
      matches.push({
        id: ex.id,
        name: ex.name,
        body_part: ex.body_part,
        target: ex.target,
        equipment: ex.equipment,
        image: ex.image
      });
      if (matches.length >= maxResults) break;
    }
  }

  return matches;
}

function getDatasetStats() {
  loadDataset();

  const bodyPartCounts = {};
  const equipmentCounts = {};
  const targetCounts = {};

  exercises.forEach((ex) => {
    if (ex.body_part) {
      const bp = ex.body_part.toLowerCase();
      bodyPartCounts[bp] = (bodyPartCounts[bp] || 0) + 1;
    }
    if (ex.equipment) {
      const eq = ex.equipment.toLowerCase();
      equipmentCounts[eq] = (equipmentCounts[eq] || 0) + 1;
    }
    if (ex.target) {
      const tgt = ex.target.toLowerCase();
      targetCounts[tgt] = (targetCounts[tgt] || 0) + 1;
    }
  });

  return {
    total_exercises: exercises.length,
    total_categories: Object.keys(bodyPartCounts).length,
    total_equipment_types: Object.keys(equipmentCounts).length,
    total_targets: Object.keys(targetCounts).length,
    breakdown: {
      body_part: bodyPartCounts,
      equipment: equipmentCounts,
      target: targetCounts
    }
  };
}

function getCategories() {
  loadDataset();
  return Array.from(categoriesSet).sort();
}

function getEquipments() {
  loadDataset();
  return Array.from(equipmentsSet).sort();
}

function getTargets() {
  loadDataset();
  return Array.from(targetsSet).sort();
}

module.exports = {
  getPaginatedExercises,
  getExerciseById,
  getExercisesByIds,
  getRandomExercises,
  getSuggestions,
  getDatasetStats,
  getCategories,
  getEquipments,
  getTargets
};
