require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Incident = require('../src/models/Incident');
const Notification = require('../src/models/Notification');

async function run() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Incident.deleteMany({}), Notification.deleteMany({})]);
  const users = await User.create([
    { name: 'Nure Admin', email: 'admin@auto-reliability.com', password: 'hello123', role: 'admin', team: 'Platform', isOnCall: true },
    { name: 'Ayesha Reliability', email: 'ayesha@auto-reliability.com', password: 'hello123', role: 'engineer', team: 'SRE', isOnCall: true },
    { name: 'Rahim Backend', email: 'rahim@auto-reliability.com', password: 'hello123', role: 'engineer', team: 'Backend', isOnCall: false },
    { name: 'Disha DevOps', email: 'disha@auto-reliability.com', password: 'hello123', role: 'engineer', team: 'DevOps', isOnCall: false }
  ]);
  const [admin, ayesha, rahim] = users;
  await Incident.create([
    {
      title: 'Checkout API latency spike', service: 'checkout-api', description: 'p95 latency increased after deployment.', severity: 'high', status: 'investigating', assignedTo: ayesha._id, reportedBy: admin._id, impact: 'Customers see slow checkout.',
      timeline: [
        { type: 'created', message: 'Incident created from monitoring alert.', author: admin._id },
        { type: 'assignment', message: 'Ayesha assigned as incident commander.', author: admin._id },
        { type: 'comment', message: 'Rollback is being evaluated. Database CPU looks normal.', author: ayesha._id }
      ]
    },
    {
      title: 'Image upload failures', service: 'media-service', description: 'Some upload requests return 500.', severity: 'medium', status: 'open', assignedTo: rahim._id, reportedBy: admin._id, impact: 'Content team cannot upload a few images.',
      timeline: [{ type: 'created', message: 'Incident reported by support.', author: admin._id }]
    },
    {
      title: 'Nightly job missed schedule', service: 'report-worker', description: 'Daily report was delayed by 22 minutes.', severity: 'low', status: 'resolved', assignedTo: rahim._id, reportedBy: admin._id, impact: 'Internal dashboard was stale for a short time.', rootCause: 'Worker pod restarted during maintenance.', resolution: 'Restart policy adjusted.', resolvedAt: new Date(),
      timeline: [
        { type: 'created', message: 'Incident created.', author: admin._id },
        { type: 'status', message: 'Status changed to resolved.', author: rahim._id },
        { type: 'postmortem', message: 'Postmortem completed with action items.', author: rahim._id }
      ],
      actionItems: [{ text: 'Add retry alert for report-worker.', owner: 'Rahim', dueDate: new Date(Date.now() + 7 * 86400000), done: false }]
    }
  ]);
  console.log('Seed complete. Login: admin@auto-reliability.com / hello123');
  await mongoose.connection.close();
}
run().catch(err => { console.error(err); process.exit(1); });
