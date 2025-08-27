/**
 * Servicio para estandarizar las respuestas de la API
 */
class ResponseService {
  /**
   * Respuesta exitosa
   * @param {Object} res - Objeto response de Express
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} message - Mensaje de respuesta
   * @param {*} data - Datos de la respuesta
   */
  static success(res, statusCode = 200, message = 'Operación exitosa', data = null) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Respuesta de error
   * @param {Object} res - Objeto response de Express
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} message - Mensaje de error
   * @param {*} error - Detalles del error
   */
  static error(res, statusCode = 500, message = 'Error interno del servidor', error = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (error && process.env.NODE_ENV === 'development') {
      response.error = error;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Respuesta de validación
   * @param {Object} res - Objeto response de Express
   * @param {Array} errors - Array de errores de validación
   */
  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de recurso no encontrado
   * @param {Object} res - Objeto response de Express
   * @param {string} resource - Nombre del recurso
   */
  static notFound(res, resource = 'Recurso') {
    return res.status(404).json({
      success: false,
      message: `${resource} no encontrado`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de conflicto
   * @param {Object} res - Objeto response de Express
   * @param {string} message - Mensaje de conflicto
   */
  static conflict(res, message = 'Conflicto con el estado actual del recurso') {
    return res.status(409).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ResponseService;
