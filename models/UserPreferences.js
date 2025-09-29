const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  preferredLocation: {
    type: String,
    default: null
  },
  customNotifications: [{
    id: String,
    name: String,
    enabled: Boolean,
    type: {
      type: String,
      enum: ['temperature', 'humidity', 'actuator', 'status']
    },
    condition: {
      type: String,
      enum: ['mayor_que', 'menor_que', 'igual_a', 'cambia_a']
    },
    value: mongoose.Schema.Types.Mixed, // Puede ser number o string
    message: String,
    locationScope: {
      type: String,
      enum: ['all', 'specific']
    },
    specificLocation: String,
    createdAt: String,
    lastTriggered: String
  }],
  activeNotifications: [{
    id: String,
    name: String,
    enabled: Boolean,
    type: {
      type: String,
      enum: ['temperature', 'humidity', 'actuator', 'status']
    },
    condition: {
      type: String,
      enum: ['mayor_que', 'menor_que', 'igual_a', 'cambia_a']
    },
    value: mongoose.Schema.Types.Mixed,
    message: String,
    locationScope: {
      type: String,
      enum: ['all', 'specific']
    },
    specificLocation: String,
    createdAt: String,
    lastTriggered: String
  }],
  totalNotifications: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índice para búsquedas rápidas por userId
userPreferencesSchema.index({ userId: 1 });

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
