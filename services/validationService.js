const CONSTANTS = require('../config/constants');

/**
 * Servicio de validación para datos de sensores
 */
class ValidationService {
  /**
   * Validar datos de sensor
   * @param {Object} data - Datos a validar
   * @returns {Object} Resultado de la validación
   */
  static validateSensorData(data) {
    const errors = [];

    // Validar temperatura
    if (data.temperatura === undefined || data.temperatura === null) {
      errors.push('La temperatura es requerida');
    } else if (typeof data.temperatura !== 'number') {
      errors.push('La temperatura debe ser un número');
    } else if (data.temperatura < CONSTANTS.VALIDATION.TEMPERATURE.MIN || 
               data.temperatura > CONSTANTS.VALIDATION.TEMPERATURE.MAX) {
      errors.push(`La temperatura debe estar entre ${CONSTANTS.VALIDATION.TEMPERATURE.MIN}°C y ${CONSTANTS.VALIDATION.TEMPERATURE.MAX}°C`);
    }

    // Validar humedad
    if (data.humedad === undefined || data.humedad === null) {
      errors.push('La humedad es requerida');
    } else if (typeof data.humedad !== 'number') {
      errors.push('La humedad debe ser un número');
    } else if (data.humedad < CONSTANTS.VALIDATION.HUMIDITY.MIN || 
               data.humedad > CONSTANTS.VALIDATION.HUMIDITY.MAX) {
      errors.push(`La humedad debe estar entre ${CONSTANTS.VALIDATION.HUMIDITY.MIN}% y ${CONSTANTS.VALIDATION.HUMIDITY.MAX}%`);
    }

    // Validar estado (opcional, se calcula automáticamente)
    if (data.estado && !['bajo', 'normal', 'alto'].includes(data.estado)) {
      errors.push('El estado debe ser: bajo, normal o alto');
    }

    // Validar actuador (opcional, se calcula automáticamente)
    if (data.actuador && !['calefactor', 'ninguno', 'ventilador'].includes(data.actuador)) {
      errors.push('El actuador debe ser: calefactor, ninguno o ventilador');
    }

    // Validar fecha (opcional, se asigna automáticamente)
    if (data.fecha && !this.isValidDate(data.fecha)) {
      errors.push('La fecha debe ser una fecha válida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar rango de fechas
   * @param {string} startDate - Fecha de inicio
   * @param {string} endDate - Fecha de fin
   * @returns {Object} Resultado de la validación
   */
  static validateDateRange(startDate, endDate) {
    const errors = [];

    if (!startDate) {
      errors.push('La fecha de inicio es requerida');
    } else if (!this.isValidDate(startDate)) {
      errors.push('La fecha de inicio debe ser una fecha válida');
    }

    if (!endDate) {
      errors.push('La fecha de fin es requerida');
    } else if (!this.isValidDate(endDate)) {
      errors.push('La fecha de fin debe ser una fecha válida');
    }

    if (startDate && endDate && this.isValidDate(startDate) && this.isValidDate(endDate)) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar ID de MongoDB
   * @param {string} id - ID a validar
   * @returns {boolean} True si es válido
   */
  static validateMongoId(id) {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    return mongoIdRegex.test(id);
  }

  /**
   * Validar parámetros de paginación
   * @param {Object} params - Parámetros a validar
   * @returns {Object} Parámetros validados
   */
  static validatePaginationParams(params) {
    const { page = CONSTANTS.VALIDATION.PAGINATION.DEFAULT_PAGE, 
            limit = CONSTANTS.VALIDATION.PAGINATION.DEFAULT_LIMIT, 
            sort = '-fecha' } = params;
    
    const validated = {
      page: Math.max(1, parseInt(page) || CONSTANTS.VALIDATION.PAGINATION.DEFAULT_PAGE),
      limit: Math.min(CONSTANTS.VALIDATION.PAGINATION.MAX_LIMIT, 
                     Math.max(1, parseInt(limit) || CONSTANTS.VALIDATION.PAGINATION.DEFAULT_LIMIT)),
      sort: sort
    };

    // Validar orden de clasificación
    if (!CONSTANTS.SORT_FIELDS.includes(validated.sort)) {
      validated.sort = '-fecha';
    }

    return validated;
  }

  /**
   * Validar si una fecha es válida
   * @param {string|Date} date - Fecha a validar
   * @returns {boolean} True si es válida
   */
  static isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  /**
   * Sanitizar datos de entrada
   * @param {Object} data - Datos a sanitizar
   * @returns {Object} Datos sanitizados
   */
  static sanitizeSensorData(data) {
    const sanitized = {};

    if (data.temperatura !== undefined) {
      sanitized.temperatura = parseFloat(data.temperatura);
    }

    if (data.humedad !== undefined) {
      sanitized.humedad = parseFloat(data.humedad);
    }

    if (data.estado && ['bajo', 'normal', 'alto'].includes(data.estado)) {
      sanitized.estado = data.estado;
    }

    if (data.actuador && ['calefactor', 'ninguno', 'ventilador'].includes(data.actuador)) {
      sanitized.actuador = data.actuador;
    }

    if (data.fecha && this.isValidDate(data.fecha)) {
      sanitized.fecha = new Date(data.fecha);
    }

    return sanitized;
  }
}

module.exports = ValidationService;
