const SensorData = require('../models/SensorData');

class SensorProvider {
  // Crear sensor
  async create(data) {
    return await SensorData.create(data);
  }

  // Obtener todos
  async getAll() {
    return await SensorData.find().sort({ fecha: -1 });
  }

  // Obtener por ID
  async getById(id) {
    return await SensorData.findById(id);
  }

  // Obtener por rango de fechas
  async getByDateRange(startDate, endDate) {
    const query = {};
    if (startDate && endDate) {
      query.fecha = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    return await SensorData.find(query).sort({ fecha: -1 });
  }
}

module.exports = new SensorProvider();
