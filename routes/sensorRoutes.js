const express = require('express');
const router = express.Router();
const {
  createSensorData,
  getAllSensorData,
  getSensorDataById,
  updateSensorData,
  deleteSensorData,
  getSensorStats,
  getDataByDateRange,
  getLatestData
} = require('../controllers/sensorController');

const { 
  validateSensorData, 
  validateDateRange, 
  validateMongoId,
  validatePagination 
} = require('../middleware/validation');

// Rutas principales
router.route('/')
  .post(validateSensorData, createSensorData)
  .get(validatePagination, getAllSensorData);

// Rutas especiales (DEBEN ir ANTES de las rutas con parámetros)
router.get('/stats/overview', getSensorStats);
router.get('/range', validateDateRange, getDataByDateRange);
router.get('/latest', getLatestData);

// Rutas con ID (DEBEN ir DESPUÉS de las rutas especiales)
router.route('/:id')
  .get(validateMongoId, getSensorDataById)
  .put(validateMongoId, validateSensorData, updateSensorData)
  .delete(validateMongoId, deleteSensorData);

module.exports = router;
