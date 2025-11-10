const sensorProvider = require('../providers/sensorProvider');

// Crear sensor
const createSensor = async (req, res) => {
  try {
    const sensor = await sensorProvider.create(req.body);
    res.status(201).json(sensor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos
const getAllSensors = async (req, res) => {
  try {
    const sensors = await sensorProvider.getAll();
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener por ID
const getSensorById = async (req, res) => {
  try {
    const sensor = await sensorProvider.getById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }
    res.json(sensor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener sensores por rango de fechas
const getSensorsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sensors = await sensorProvider.getByDateRange(startDate, endDate);
    res.json(sensors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSensor,
  getAllSensors,
  getSensorById,
  getSensorsByDateRange
};
