const Notification = require('../models/Notification');

async function createNotification({ title, message, targetUser, incident, channel = 'in-app' }) {
  const notification = await Notification.create({ title, message, targetUser, incident, channel });
  console.log(`[Notification:${channel}] ${title} - ${message}`);
  return notification;
}

module.exports = createNotification;
