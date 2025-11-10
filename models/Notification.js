const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'El nombre de la notificación es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  type: {
    type: String,
    enum: {
      values: ['temperature', 'humidity', 'actuator', 'status'],
      message: 'Tipo de notificación inválido'
    },
    required: [true, 'El tipo de notificación es requerido']
  },
  condition: {
    type: String,
    enum: {
      values: ['mayor_que', 'menor_que', 'igual_a', 'cambia_a'],
      message: 'Condición de notificación inválida'
    },
    required: [true, 'La condición es requerida']
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'El valor es requerido']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'El mensaje no puede exceder 500 caracteres']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'La ubicación no puede exceder 100 caracteres'],
    default: 'Todas las ubicaciones'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: 'Estado de notificación inválido'
    },
    default: 'inactive'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform: function(doc, ret) {
      // Agregar campo 'id' como alias de '_id' para compatibilidad con el frontend
      ret.id = ret._id.toString();
      return ret;
    }
  }
});

// Índices para optimizar consultas
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

// Método para obtener notificaciones activas de un usuario
notificationSchema.statics.getActiveByUserId = function(userId) {
  return this.find({ 
    userId: userId, 
    status: 'active'
  }).sort({ createdAt: -1 });
};

// Método para obtener notificaciones inactivas de un usuario
notificationSchema.statics.getInactiveByUserId = function(userId) {
  return this.find({ 
    userId: userId, 
    status: 'inactive' 
  }).sort({ createdAt: -1 });
};

// Método para activar una notificación
notificationSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

// Método para desactivar una notificación
notificationSchema.methods.deactivate = function() {
  this.status = 'inactive';
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
