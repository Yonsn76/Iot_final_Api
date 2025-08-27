const SensorData = require('../models/SensorData');
const CONSTANTS = require('../config/constants');

class SensorProvider {
  /**
   * Crear nuevo dato de sensor
   * @param {Object} sensorData - Datos del sensor
   * @returns {Promise<Object>} Sensor creado
   */
  async create(sensorData) {
    try {
      return await SensorData.create(sensorData);
    } catch (error) {
      throw new Error(`Error al crear sensor: ${error.message}`);
    }
  }

  /**
   * Obtener todos los datos de sensores (datos limpios)
   * @param {Object} options - Opciones de paginación
   * @returns {Promise<Array>} Array de sensores limpios
   */
  async getAll(options = {}) {
    try {
      const { page = CONSTANTS.VALIDATION.PAGINATION.DEFAULT_PAGE, 
              limit = CONSTANTS.VALIDATION.PAGINATION.DEFAULT_LIMIT, 
              sort = '-fecha' } = options;
      
      // Calcular el offset para la paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Obtener solo los datos esenciales sin información de paginación
      const sensors = await SensorData.find({})
        .select('_id fecha temperatura humedad estado actuador createdAt updatedAt')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      return sensors;
    } catch (error) {
      throw new Error(`Error al obtener sensores: ${error.message}`);
    }
  }

  /**
   * Obtener sensor por ID
   * @param {string} id - ID del sensor
   * @returns {Promise<Object>} Sensor encontrado
   */
  async getById(id) {
    try {
      const sensor = await SensorData.findById(id);
      if (!sensor) {
        throw new Error(CONSTANTS.MESSAGES.ERROR.NOT_FOUND);
      }
      return sensor;
    } catch (error) {
      throw new Error(`Error al obtener sensor: ${error.message}`);
    }
  }

  /**
   * Actualizar sensor por ID
   * @param {string} id - ID del sensor
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Sensor actualizado
   */
  async updateById(id, updateData) {
    try {
      const sensor = await SensorData.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      );
      
      if (!sensor) {
        throw new Error(CONSTANTS.MESSAGES.ERROR.NOT_FOUND);
      }
      
      return sensor;
    } catch (error) {
      throw new Error(`Error al actualizar sensor: ${error.message}`);
    }
  }

  /**
   * Eliminar sensor por ID
   * @param {string} id - ID del sensor
   * @returns {Promise<Object>} Sensor eliminado
   */
  async deleteById(id) {
    try {
      const sensor = await SensorData.findByIdAndDelete(id);
      if (!sensor) {
        throw new Error(CONSTANTS.MESSAGES.ERROR.NOT_FOUND);
      }
      return sensor;
    } catch (error) {
      throw new Error(`Error al eliminar sensor: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de los sensores
   * @returns {Promise<Object>} Estadísticas
   */
  async getStats() {
    try {
      const stats = await SensorData.getStats();
      return stats.length > 0 ? stats[0] : {
        totalRegistros: 0,
        temperaturaPromedio: 0,
        humedadPromedio: 0,
        temperaturaMaxima: 0,
        temperaturaMinima: 0,
        humedadMaxima: 0,
        humedadMinima: 0,
        estadoBajo: 0,
        estadoNormal: 0,
        estadoAlto: 0,
        actuadorCalefactor: 0,
        actuadorNinguno: 0,
        actuadorVentilador: 0
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener datos por rango de fechas
   * @param {string} startDate - Fecha de inicio
   * @param {string} endDate - Fecha de fin
   * @returns {Promise<Array>} Datos filtrados
   */
  async getByDateRange(startDate, endDate) {
    try {
      return await SensorData.getDataByDateRange(startDate, endDate);
    } catch (error) {
      throw new Error(`Error al obtener datos por rango: ${error.message}`);
    }
  }

  /**
   * Obtener datos más recientes
   * @param {number} limit - Límite de registros
   * @returns {Promise<Array>} Datos más recientes
   */
  async getLatest(limit = 5) {
    try {
      return await SensorData.find()
        .select('_id fecha temperatura humedad estado actuador createdAt updatedAt')
        .sort({ fecha: -1 })
        .limit(parseInt(limit));
    } catch (error) {
      throw new Error(`Error al obtener datos recientes: ${error.message}`);
    }
  }
}

module.exports = new SensorProvider();
