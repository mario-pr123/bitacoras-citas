import { Link } from 'react-router-dom';
import { useData } from '../lib/DataContext.jsx';

export function SiteHeader({ right }) {
  const { data, admin } = useData();
  const name = data?.settings?.siteName || 'Bitácora';
  const count = data ? data.citas.reduce((n, c) => n + c.photos.length, 0) : 0;
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        {name}
        <sup>©{new Date().getFullYear()}</sup>
      </Link>
      <nav className="site-nav" aria-label="Principal">
        <Link to="/#citas">+Citas</Link>
        <Link to="/#listas">+Listas</Link>
        <Link to="/#archivo">+Archivo</Link>
      </nav>
      <div className="header-right">
        {right ?? <span>{count} fotografías</span>}
        {admin && (
          <Link to="/admin" className="admin-pill">
            Panel
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { data } = useData();
  const s = data?.settings || {};
  return (
    <footer className="site-footer">
      <p className="footer-statement">{s.siteName || 'Bitácora'}</p>
      <div className="footer-meta">
        <span>
          ©{new Date().getFullYear()} {s.author}
        </span>
      </div>
    </footer>
  );
}

export function Label({ children, className = '' }) {
  return <p className={`label ${className}`}>{children}</p>;
}

export function StatusScreen({ loading, error }) {
  return (
    <div className="status-screen">
      {loading ? <p className="label">Revelando…</p> : <p>{error}</p>}
    </div>
  );
}
