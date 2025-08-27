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

  // Actualizar
  async update(id, data) {
    return await SensorData.findByIdAndUpdate(id, data, { new: true });
  }

  // Eliminar
  async delete(id) {
    return await SensorData.findByIdAndDelete(id);
  }
}

module.exports = new SensorProvider();
