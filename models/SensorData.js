const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    default: Date.now
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
  }
}, {
  timestamps: false,
  versionKey: false
});

module.exports = mongoose.model('SensorData', sensorDataSchema);
