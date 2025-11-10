const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferredSensorId: {
    type: String,
    default: null
  },
  allNotificationIds: [{
    type: String,
    ref: 'Notification'
  }],
  activeNotificationIds: [{
    type: String,
    ref: 'Notification'
  }],
  totalNotifications: {
    type: Number,
    default: 0
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'auto'
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índice para búsquedas rápidas por userId
userPreferencesSchema.index({ userId: 1 });

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
