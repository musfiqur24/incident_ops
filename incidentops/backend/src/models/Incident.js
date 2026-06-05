const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  type: { type: String, enum: ['created', 'comment', 'status', 'assignment', 'severity', 'postmortem', 'system'], default: 'comment' },
  message: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  service: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  status: { type: String, enum: ['open', 'investigating', 'resolved'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  rootCause: { type: String, default: '' },
  impact: { type: String, default: '' },
  resolution: { type: String, default: '' },
  actionItems: [{ text: String, owner: String, dueDate: Date, done: { type: Boolean, default: false } }],
  timeline: [timelineSchema]
}, { timestamps: true });

incidentSchema.virtual('mttrMinutes').get(function() {
  if (!this.resolvedAt || !this.startedAt) return null;
  return Math.round((this.resolvedAt - this.startedAt) / 60000);
});
incidentSchema.set('toJSON', { virtuals: true });
incidentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Incident', incidentSchema);
