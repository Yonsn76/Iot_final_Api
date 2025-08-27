const ValidationService = require('../services/validationService');
const ResponseService = require('../services/responseService');

/**
 * Middleware para validar datos de sensor
 */
const validateSensorData = (req, res, next) => {
  const validation = ValidationService.validateSensorData(req.body);
  
  if (!validation.isValid) {
    return ResponseService.validationError(res, validation.errors);
  }

  // Sanitizar datos antes de continuar
  req.body = ValidationService.sanitizeSensorData(req.body);
  next();
};

/**
 * Middleware para validar rango de fechas
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  const validation = ValidationService.validateDateRange(startDate, endDate);
  
  if (!validation.isValid) {
    return ResponseService.validationError(res, validation.errors);
  }

  next();
};

/**
 * Middleware para validar ID de MongoDB
 */
const validateMongoId = (req, res, next) => {
  const { id } = req.params;
  
  if (!ValidationService.validateMongoId(id)) {
    return ResponseService.error(res, 400, 'ID de sensor inválido');
  }

  next();
};

/**
 * Middleware para validar parámetros de paginación
 */
const validatePagination = (req, res, next) => {
  const validatedParams = ValidationService.validatePaginationParams(req.query);
  req.query = validatedParams;
  next();
};

module.exports = {
  validateSensorData,
  validateDateRange,
  validateMongoId,
  validatePagination
};
