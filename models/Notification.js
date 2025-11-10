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
  id: {
    type: String,
    unique: true,
    sparse: true // Permite que algunos documentos no tengan 'id' temporalmente
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
      // Asegurar que siempre haya un 'id' en la respuesta JSON
      if (!ret.id && ret._id) {
        ret.id = ret._id.toString();
      }
      return ret;
    }
  }
});

// Middleware para generar automáticamente el campo 'id' antes de guardar
// El 'id' se genera como string del '_id' de MongoDB
// Mongoose asigna el _id automáticamente antes de ejecutar el pre-save hook
notificationSchema.pre('save', function(next) {
  // Solo generar 'id' si no existe y el documento es nuevo
  if (this.isNew && !this.id) {
    // El _id siempre existe en documentos nuevos antes de save()
    this.id = this._id.toString();
  }
  next();
});

// Índices para optimizar consultas
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ id: 1 }, { unique: true, sparse: true }); // Índice único en 'id'

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
