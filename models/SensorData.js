const mongoose = require('mongoose');
const paginate = require('./plugins/paginate');

const sensorDataSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    required: [true, 'La fecha es requerida']
    // Removido el default para permitir fechas del Arduino
  },
  temperatura: {
    type: Number,
    required: [true, 'La temperatura es requerida'],
    min: [-50, 'La temperatura no puede ser menor a -50°C'],
    max: [100, 'La temperatura no puede ser mayor a 100°C']
  },
  humedad: {
    type: Number,
    required: [true, 'La humedad es requerida'],
    min: [0, 'La humedad no puede ser menor a 0%'],
    max: [100, 'La humedad no puede ser mayor a 100%']
  },
  estado: {
    type: String,
    enum: ['bajo', 'normal', 'alto'],
    required: true,
    default: 'normal'
  },
  actuador: {
    type: String,
    enum: ['calefactor', 'ninguno', 'ventilador'],
    required: true,
    default: 'ninguno'
  }
}, {
  timestamps: { 
    createdAt: true,    // Solo mantener fecha de creación
    updatedAt: false    // No necesitamos fecha de actualización
  },
  versionKey: false
});

// Índices para mejorar el rendimiento de las consultas
sensorDataSchema.index({ fecha: -1 });
sensorDataSchema.index({ temperatura: 1 });
sensorDataSchema.index({ humedad: 1 });
sensorDataSchema.index({ estado: 1 });
sensorDataSchema.index({ actuador: 1 });

// Aplicar plugin de paginación
sensorDataSchema.plugin(paginate);

// Método estático para obtener estadísticas
sensorDataSchema.statics.getStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: null,
        totalRegistros: { $sum: 1 },
        temperaturaPromedio: { $avg: '$temperatura' },
        humedadPromedio: { $avg: '$humedad' },
        temperaturaMaxima: { $max: '$temperatura' },
        temperaturaMinima: { $min: '$temperatura' },
        humedadMaxima: { $max: '$humedad' },
        humedadMinima: { $min: '$humedad' },
        estadoBajo: { $sum: { $cond: [{ $eq: ['$estado', 'bajo'] }, 1, 0] } },
        estadoNormal: { $sum: { $cond: [{ $eq: ['$estado', 'normal'] }, 1, 0] } },
        estadoAlto: { $sum: { $cond: [{ $eq: ['$estado', 'alto'] }, 1, 0] } },
        actuadorCalefactor: { $sum: { $cond: [{ $eq: ['$actuador', 'calefactor'] }, 1, 0] } },
        actuadorNinguno: { $sum: { $cond: [{ $eq: ['$actuador', 'ninguno'] }, 1, 0] } },
        actuadorVentilador: { $sum: { $cond: [{ $eq: ['$actuador', 'ventilador'] }, 1, 0] } }
      }
    }
  ]);
};

// Método estático para obtener datos por rango de fechas
sensorDataSchema.statics.getDataByDateRange = async function(startDate, endDate) {
  return await this.find({
    fecha: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ fecha: -1 });
};

module.exports = mongoose.model('SensorData', sensorDataSchema);
