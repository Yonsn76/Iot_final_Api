const sensorProvider = require('../providers/sensorProvider');
const ResponseService = require('../services/responseService');
const CONSTANTS = require('../config/constants');

// @desc    Crear nuevo dato de sensor
// @route   POST /api/sensors
// @access  Public
const createSensorData = async (req, res, next) => {
  try {
    const sensorData = await sensorProvider.create(req.body);
    
    return ResponseService.success(
      res, 
      CONSTANTS.HTTP_STATUS.CREATED, 
      CONSTANTS.MESSAGES.SUCCESS.CREATED, 
      sensorData
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener todos los datos de sensores (datos puros)
// @route   GET /api/sensors
// @access  Public
const getAllSensorData = async (req, res, next) => {
  try {
    const { page, limit, sort } = req.query;
    const sensors = await sensorProvider.getAll({ page, limit, sort });
    
    // Devolver directamente el array de sensores sin wrapper
    return res.status(CONSTANTS.HTTP_STATUS.OK).json(sensors);
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener dato de sensor por ID
// @route   GET /api/sensors/:id
// @access  Public
const getSensorDataById = async (req, res, next) => {
  try {
    const sensorData = await sensorProvider.getById(req.params.id);
    
    return ResponseService.success(
      res, 
      CONSTANTS.HTTP_STATUS.OK, 
      CONSTANTS.MESSAGES.SUCCESS.RETRIEVED, 
      sensorData
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar dato de sensor
// @route   PUT /api/sensors/:id
// @access  Public
const updateSensorData = async (req, res, next) => {
  try {
    const sensorData = await sensorProvider.updateById(req.params.id, req.body);
    
    return ResponseService.success(
      res, 
      CONSTANTS.HTTP_STATUS.OK, 
      CONSTANTS.MESSAGES.SUCCESS.UPDATED, 
      sensorData
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar dato de sensor
// @route   DELETE /api/sensors/:id
// @access  Public
const deleteSensorData = async (req, res, next) => {
  try {
    const sensorData = await sensorProvider.deleteById(req.params.id);
    
    return ResponseService.success(
      res, 
      CONSTANTS.HTTP_STATUS.OK, 
      CONSTANTS.MESSAGES.SUCCESS.DELETED, 
      sensorData
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener estadísticas de los datos
// @route   GET /api/sensors/stats/overview
// @access  Public
const getSensorStats = async (req, res, next) => {
  try {
    const stats = await sensorProvider.getStats();
    
    return ResponseService.success(
      res, 
      CONSTANTS.HTTP_STATUS.OK, 
      CONSTANTS.MESSAGES.SUCCESS.STATS_RETRIEVED, 
      stats
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener datos por rango de fechas
// @route   GET /api/sensors/range
// @access  Public
const getDataByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await sensorProvider.getByDateRange(startDate, endDate);
    
    return ResponseService.success(
      res, 
      CONSTANTS.HTTP_STATUS.OK, 
      CONSTANTS.MESSAGES.SUCCESS.RETRIEVED, 
      { count: data.length, data }
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Obtener datos más recientes
// @route   GET /api/sensors/latest
// @access  Public
const getLatestData = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const data = await sensorProvider.getLatest(limit);
    
    return ResponseService.success(
      res, 
      CONSTANTS.HTTP_STATUS.OK, 
      CONSTANTS.MESSAGES.SUCCESS.RETRIEVED, 
      { count: data.length, data }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSensorData,
  getAllSensorData,
  getSensorDataById,
  updateSensorData,
  deleteSensorData,
  getSensorStats,
  getDataByDateRange,
  getLatestData
};
