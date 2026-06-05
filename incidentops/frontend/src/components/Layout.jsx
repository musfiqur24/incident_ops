import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Notifications from './Notifications.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  return <div className="shell">
    <header className="hero">
      <div className="brand-logo"><span>/</span>AutoReliability</div>
      <div className="eyebrow">INCIDENTOPS</div>
      <h1>Reliability Command Center</h1>
      <p>Don’t let incidents stay open - focus on fast resolution.</p>
      <nav className="tabs">
        <NavLink to="/" end>▣ Dashboard</NavLink>
        <NavLink to="/team">⚙ On-Call Team</NavLink>
        <button onClick={logout}>↪ Logout</button>
      </nav>
    </header>
    <main className="content">
      <div className="welcome-card">
        <span>Incident Management</span>
        <h2>Remember your SLA!</h2>
        <p>Detect fast, respond faster, resolve like a PRO!</p>
      </div>
      <div className="topbar"><div>Signed in as <b>{user?.name}</b></div><Notifications /></div>
      <Outlet />
    </main>
  </div>;
}
