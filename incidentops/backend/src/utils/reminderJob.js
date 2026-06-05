const Incident = require('../models/Incident');
const createNotification = require('./createNotification');

function startReminderJob() {
  const minutes = Number(process.env.REMINDER_INTERVAL_MINUTES || 15);
  const intervalMs = Math.max(minutes, 1) * 60 * 1000;
  async function check() {
    const threshold = new Date(Date.now() - 30 * 60 * 1000);
    const incidents = await Incident.find({ status: { $ne: 'resolved' }, severity: { $in: ['high', 'critical'] }, updatedAt: { $lte: threshold } });
    for (const incident of incidents) {
      await createNotification({
        title: 'Incident reminder',
        message: `${incident.title} is still ${incident.status}. Add a timeline update.`,
        targetUser: incident.assignedTo,
        incident: incident._id,
        channel: 'in-app'
      });
      incident.timeline.push({ type: 'system', message: 'Automated reminder generated for stale high-severity incident.' });
      await incident.save();
    }
  }
  setInterval(() => check().catch(err => console.error('Reminder job failed:', err.message)), intervalMs);
  console.log(`Reminder job started. Interval: ${minutes} minute(s).`);
}

module.exports = startReminderJob;
