const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true
  },
  ubicacion: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    required: true
  },
  modelo: {
    type: String,
    required: true
  },
  temperatura: {
    type: Number,
    required: true
  },
  humedad: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    default: 'normal'
  },
  actuador: {
    type: String,
    default: 'ninguno'
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  versionKey: false,
  _id: true
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
