import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import IncidentForm from '../components/IncidentForm.jsx';

const columns = [
  { key: 'open', label: 'Open', hint: 'Drop new incidents here' },
  { key: 'investigating', label: 'Investigating', hint: 'Active debugging' },
  { key: 'resolved', label: 'Resolved', hint: 'Postmortem ready' }
];

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');

  async function load() {
    const [i, s, u] = await Promise.all([api.get('/incidents'), api.get('/incidents/stats'), api.get('/auth/users')]);
    setIncidents(i.data.incidents); setStats(s.data); setUsers(u.data.users);
  }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => incidents.filter(i => `${i.title} ${i.service} ${i.severity}`.toLowerCase().includes(query.toLowerCase())), [incidents, query]);

  async function changeStatus(id, status) { await api.patch(`/incidents/${id}`, { status }); load(); }

  return <section>
    <div className="action-row">
      <input className="search" placeholder="Search incident, service, severity..." value={query} onChange={e => setQuery(e.target.value)} />
      <button className="cyan-pill" onClick={() => setShowForm(true)}>+ Create Incident</button>
    </div>
    {stats && <div className="metrics">
      <Metric title="Total Incidents" value={stats.total} />
      <Metric title="Avg MTTR" value={`${stats.avgMttr}m`} />
      <Metric title="Critical" value={stats.bySeverity.critical} />
      <Metric title="On-Call" value={stats.onCall.length} />
    </div>}
    {showForm && <IncidentForm users={users} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    <div className="kanban">
      {columns.map(col => <div className="column" key={col.key} onDragOver={e => e.preventDefault()} onDrop={e => changeStatus(e.dataTransfer.getData('id'), col.key)}>
        <div className="column-head"><h2>{col.label}</h2><span>{filtered.filter(i => i.status === col.key).length}</span></div>
        <div className="dropzone">{col.hint}</div>
        {filtered.filter(i => i.status === col.key).map(incident => <IncidentCard key={incident._id} incident={incident} />)}
      </div>)}
    </div>
  </section>;
}
function Metric({ title, value }) { return <div className="metric"><span>{title}</span><strong>{value}</strong></div>; }
function IncidentCard({ incident }) {
  return <Link draggable onDragStart={e => e.dataTransfer.setData('id', incident._id)} to={`/incidents/${incident._id}`} className={`incident-card sev-${incident.severity}`}>
    <div className="card-top"><span className="badge">{incident.severity}</span><span>{incident.service}</span></div>
    <h3>{incident.title}</h3>
    <p>{incident.description}</p>
    <div className="card-footer"><span>👤 {incident.assignedTo?.name || 'Unassigned'}</span><span>MTTR {incident.mttrMinutes ?? '—'}m</span></div>
  </Link>;
}
