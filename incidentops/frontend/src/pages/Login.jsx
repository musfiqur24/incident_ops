import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('admin@auto-reliability.com');
  const [password, setPassword] = useState('hello123');
  const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  async function submit(e) {
    e.preventDefault(); setError('');
    try { await login(email, password); } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
  }
  return <div className="login-page">
    <form className="login-card" onSubmit={submit}>
      <div className="brand-logo login-logo"><span>/</span>AutoReliability</div>
      <div className="eyebrow">INCIDENTOPS</div>
      <h1>Automating Reliability</h1>
      <p>PagerDuty-style incident tracker.</p>
      {error && <div className="error">{error}</div>}
      <label>Email<input value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button className="primary">Enter Command Center</button>
      <small>Seed login: admin@auto-reliability.com / hello123</small>
    </form>
  </div>;
}
