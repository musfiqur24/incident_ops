const Notification = require('../models/Notification');

exports.listNotifications = async (req, res) => {
  const notifications = await Notification.find({ $or: [{ targetUser: req.user._id }, { targetUser: null }] })
    .populate('incident', 'title severity status')
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ notifications });
};

exports.markRead = async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, targetUser: req.user._id }, { read: true });
  res.json({ message: 'Notification marked as read.' });
};
