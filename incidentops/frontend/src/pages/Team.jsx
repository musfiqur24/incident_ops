import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Team() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: 'hello123', role: 'engineer', team: 'Reliability', isOnCall: false });
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);

  async function load() { const res = await api.get('/auth/users'); setUsers(res.data.users); }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/users', form);
      showToast('User added successfully.', 'success');
      setForm({ ...form, name: '', email: '' });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Only admin can add users.', 'error');
    }
  }

  async function deleteUser() {
    if (!pendingDeleteUser) return;
    try {
      const res = await api.delete(`/auth/users/${pendingDeleteUser.id}`);
      showToast(res.data.message || 'User removed.', 'success');
      setPendingDeleteUser(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to delete this user.', 'error');
    }
  }

  return <section>
    <div className="team-grid">
      <div className="panel">
        <h2>On-Call Roster</h2>
        {users.map(u => <div className="user-row" key={u.id}>
          <div><b>{u.name}</b><span>{u.email} · {u.team}</span></div>
          <div className="roster-actions">
            <span className={u.isOnCall ? 'oncall' : 'offcall'}>{u.isOnCall ? 'ON CALL' : 'BACKUP'}</span>
            {user?.role === 'admin' && user?.id !== u.id && <button className="danger-mini" onClick={() => setPendingDeleteUser(u)}>Delete</button>}
          </div>
        </div>)}
      </div>
      <form className="panel" onSubmit={submit}><h2>Add Engineer</h2><p className="muted">Admin only. Current role: {user?.role}</p>
        <label>Name<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Email<input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Password<input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label>
        <div className="grid2"><label>Role<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option>engineer</option><option>admin</option></select></label><label>Team<input value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} /></label></div>
        <label className="check"><input type="checkbox" checked={form.isOnCall} onChange={e => setForm({ ...form, isOnCall: e.target.checked })} /> On-call now</label>
        <button className="primary">Add User</button>
      </form>
    </div>

    {pendingDeleteUser && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
      <div className="confirm-modal">
        <h3 id="delete-user-title">Delete user?</h3>
        <p>Remove <b>{pendingDeleteUser.name}</b> from the roster? Assigned incidents will become unassigned.</p>
        <div className="modal-actions">
          <button className="ghost" type="button" onClick={() => setPendingDeleteUser(null)}>Cancel</button>
          <button className="danger-btn" type="button" onClick={deleteUser}>Delete User</button>
        </div>
      </div>
    </div>}
  </section>;
}
