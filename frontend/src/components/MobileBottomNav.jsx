import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, PackagePlus, Menu } from 'lucide-react';

const MobileBottomNav = ({ onMenuClick }) => {
  const navStyle = ({ isActive }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '8px 0',
    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.75rem',
    gap: '4px',
    transition: 'color 0.2s ease',
  });

  return (
    <nav className="mobile-bottom-nav">
      <NavLink to="/dashboard" style={navStyle}>
        <LayoutDashboard size={22} />
        Inicio
      </NavLink>
      <NavLink to="/appointments" style={navStyle}>
        <Calendar size={22} />
        Turnos
      </NavLink>
      <NavLink to="/works" style={navStyle}>
        <PackagePlus size={22} />
        Órdenes
      </NavLink>
      <button 
        onClick={onMenuClick} 
        style={{ 
          background: 'none', border: 'none', 
          display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', flex: 1, 
          color: 'var(--text-secondary)', cursor: 'pointer', gap: '4px', fontSize: '0.75rem' 
        }}
      >
        <Menu size={22} />
        Más
      </button>
    </nav>
  );
};

export default MobileBottomNav;
