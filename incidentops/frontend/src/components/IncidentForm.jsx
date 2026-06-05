import { useState } from 'react';
import api from '../services/api';

export default function IncidentForm({ users, onClose, onSaved, initial }) {
  const [form, setForm] = useState(initial || { title: '', service: '', description: '', severity: 'low', assignedTo: '', impact: '' });
  const [error, setError] = useState('');
  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })); }
  async function submit(e) {
    e.preventDefault(); setError('');
    try {
      if (initial?._id) await api.patch(`/incidents/${initial._id}`, form);
      else await api.post('/incidents', form);
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
  }
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}>
    <div className="modal-head"><h2>{initial ? 'Update Incident' : 'Create Incident'}</h2><button type="button" onClick={onClose}>✕</button></div>
    {error && <div className="error">{error}</div>}
    <label>Title<input value={form.title} onChange={e => set('title', e.target.value)} required /></label>
    <label>Service<input value={form.service} onChange={e => set('service', e.target.value)} placeholder="payment-api, worker, db..." required /></label>
    <label>Description<textarea value={form.description} onChange={e => set('description', e.target.value)} required /></label>
    <label>Impact<textarea value={form.impact || ''} onChange={e => set('impact', e.target.value)} /></label>
    <div className="grid2"><label>Severity<select value={form.severity} onChange={e => set('severity', e.target.value)}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label>
    <label>Assign Engineer<select value={form.assignedTo || ''} onChange={e => set('assignedTo', e.target.value)}><option value="">Unassigned</option>{users.map(u => <option key={u.id} value={u.id}>{u.name} {u.isOnCall ? '(on-call)' : ''}</option>)}</select></label></div>
    <button className="primary">Save Incident</button>
  </form></div>;
}
