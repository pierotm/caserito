import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

function Navigation() {
  const location = useLocation();
  const links = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Productos' },
    { to: '/reports', label: 'Reportes' },
    { to: '/settings', label: 'Ajustes' }
  ];

  return (
    <nav className="tabs">
      {links.map((link) => (
        <Link key={link.to} className={location.pathname === link.to ? 'active' : ''} to={link.to}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('token')));

  function logout() {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <LoginPage onLoggedIn={() => setIsLoggedIn(true)} />;
  }

  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage onLogout={logout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
