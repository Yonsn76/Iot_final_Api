/**
 * Constantes de la aplicación
 */
module.exports = {
  // Límites de validación
  VALIDATION: {
    TEMPERATURE: {
      MIN: -50,
      MAX: 100
    },
    HUMIDITY: {
      MIN: 0,
      MAX: 100
    },
    PAGINATION: {
      DEFAULT_PAGE: 1,
      DEFAULT_LIMIT: 10,
      MAX_LIMIT: 100
    }
  },

  // Mensajes de respuesta
  MESSAGES: {
    SUCCESS: {
      CREATED: 'Dato de sensor creado exitosamente',
      UPDATED: 'Dato de sensor actualizado exitosamente',
      DELETED: 'Dato de sensor eliminado exitosamente',
      RETRIEVED: 'Datos obtenidos exitosamente',
      STATS_RETRIEVED: 'Estadísticas obtenidas exitosamente'
    },
    ERROR: {
      NOT_FOUND: 'Sensor no encontrado',
      INVALID_ID: 'ID de sensor inválido',
      VALIDATION_FAILED: 'Error de validación',
      INTERNAL_ERROR: 'Error interno del servidor'
    }
  },

  // Códigos de estado HTTP
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },

  // Campos de ordenamiento permitidos
  SORT_FIELDS: [
    'fecha',
    '-fecha',
    'temperatura',
    '-temperatura',
    'humedad',
    '-humedad'
  ],

  // Configuración de paginación
  PAGINATION: {
    CUSTOM_LABELS: {
      docs: 'data',
      totalDocs: 'total',
      totalPages: 'totalPages',
      hasNextPage: 'hasNext',
      hasPrevPage: 'hasPrev',
      nextPage: 'nextPage',
      prevPage: 'prevPage'
    }
  }
};
