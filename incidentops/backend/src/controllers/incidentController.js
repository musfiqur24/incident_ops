const Incident = require('../models/Incident');
const User = require('../models/User');
const createNotification = require('../utils/createNotification');

const populate = [
  { path: 'assignedTo', select: 'name email role team isOnCall' },
  { path: 'reportedBy', select: 'name email role team isOnCall' },
  { path: 'timeline.author', select: 'name email' }
];

function mentionKey(value = '') {
  return String(value).toLowerCase().replace(/^@/, '').replace(/[^a-z0-9]/g, '');
}

async function findMentionedUsers(message = '') {
  const users = await User.find().select('name email role team isOnCall');
  const tokens = [...String(message).matchAll(/@([\w.-]+(?:@[\w.-]+)?)/g)].map(match => mentionKey(match[1]));
  if (!tokens.length) return [];

  return users.filter(user => {
    const nameKey = mentionKey(user.name);
    const emailKey = mentionKey(user.email);
    const firstNameKey = mentionKey(String(user.name).split(/\s+/)[0]);
    return tokens.some(token => token === nameKey || token === emailKey || token === firstNameKey);
  });
}

async function notifyMentionedUsers({ message, incident, author }) {
  const mentionedUsers = await findMentionedUsers(message);
  const authorName = author?.name || 'A teammate';
  await Promise.all(mentionedUsers.map(user => createNotification({
    title: `You were mentioned by ${authorName}`,
    message: `${incident.title}: ${message}`,
    targetUser: user._id,
    incident: incident._id
  })));
  return mentionedUsers;
}

exports.createIncident = async (req, res) => {
  const { title, service, description, severity, assignedTo, impact } = req.body;
  if (!title || !service || !description) return res.status(400).json({ message: 'Title, service, and description are required.' });
  const incident = await Incident.create({
    title, service, description, severity, assignedTo: assignedTo || undefined, impact: impact || '', reportedBy: req.user._id,
    timeline: [{ type: 'created', message: `Incident created with ${severity || 'low'} severity.`, author: req.user._id }]
  });
  if (assignedTo) {
    await createNotification({ title: 'New incident assigned', message: title, targetUser: assignedTo, incident: incident._id });
  }
  const output = await Incident.findById(incident._id).populate(populate);
  res.status(201).json({ incident: output });
};

exports.getIncidents = async (req, res) => {
  const { status, severity, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (q) filter.$or = [
    { title: new RegExp(q, 'i') },
    { service: new RegExp(q, 'i') },
    { description: new RegExp(q, 'i') }
  ];
  const incidents = await Incident.find(filter).sort({ status: 1, severity: -1, createdAt: -1 }).populate(populate);
  res.json({ incidents });
};

exports.getIncident = async (req, res) => {
  const incident = await Incident.findById(req.params.id).populate(populate);
  if (!incident) return res.status(404).json({ message: 'Incident not found.' });
  res.json({ incident });
};

exports.updateIncident = async (req, res) => {
  const incident = await Incident.findById(req.params.id);
  if (!incident) return res.status(404).json({ message: 'Incident not found.' });
  const fields = ['title', 'service', 'description', 'severity', 'status', 'assignedTo', 'rootCause', 'impact', 'resolution'];
  const changes = [];
  for (const field of fields) {
    if (req.body[field] !== undefined && String(incident[field] || '') !== String(req.body[field] || '')) {
      changes.push(field);
      incident[field] = req.body[field] || undefined;
    }
  }
  if (req.body.actionItems) incident.actionItems = req.body.actionItems;
  if (changes.includes('status')) {
    incident.timeline.push({ type: 'status', message: `Status changed to ${incident.status}.`, author: req.user._id });
    if (incident.status === 'resolved' && !incident.resolvedAt) incident.resolvedAt = new Date();
    if (incident.status !== 'resolved') incident.resolvedAt = undefined;
  }
  if (changes.includes('assignedTo') && incident.assignedTo) {
    incident.timeline.push({ type: 'assignment', message: 'Incident assignment changed.', author: req.user._id });
    await createNotification({ title: 'Incident assigned to you', message: incident.title, targetUser: incident.assignedTo, incident: incident._id });
  }
  if (changes.includes('severity')) incident.timeline.push({ type: 'severity', message: `Severity changed to ${incident.severity}.`, author: req.user._id });
  await incident.save();
  const output = await Incident.findById(incident._id).populate(populate);
  res.json({ incident: output });
};

exports.addComment = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'Comment message is required.' });
  const incident = await Incident.findById(req.params.id);
  if (!incident) return res.status(404).json({ message: 'Incident not found.' });
  incident.timeline.push({ type: 'comment', message, author: req.user._id });
  await incident.save();
  await notifyMentionedUsers({ message, incident, author: req.user });
  const output = await Incident.findById(incident._id).populate(populate);
  res.status(201).json({ incident: output });
};

exports.deleteIncident = async (req, res) => {
  const incident = await Incident.findByIdAndDelete(req.params.id);
  if (!incident) return res.status(404).json({ message: 'Incident not found.' });
  res.json({ message: 'Incident deleted.' });
};

exports.getStats = async (req, res) => {
  const incidents = await Incident.find();
  const resolved = incidents.filter(i => i.status === 'resolved' && i.resolvedAt);
  const mttrs = resolved.map(i => (i.resolvedAt - i.startedAt) / 60000);
  const avgMttr = mttrs.length ? Math.round(mttrs.reduce((a, b) => a + b, 0) / mttrs.length) : 0;
  const bySeverity = ['low', 'medium', 'high', 'critical'].reduce((acc, s) => ({ ...acc, [s]: incidents.filter(i => i.severity === s).length }), {});
  const byStatus = ['open', 'investigating', 'resolved'].reduce((acc, s) => ({ ...acc, [s]: incidents.filter(i => i.status === s).length }), {});
  const onCall = await User.find({ isOnCall: true }).select('name email team role isOnCall');
  res.json({ total: incidents.length, avgMttr, bySeverity, byStatus, onCall });
};
