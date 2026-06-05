const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  channel: { type: String, enum: ['in-app', 'email', 'slack', 'sns'], default: 'in-app' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  incident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
