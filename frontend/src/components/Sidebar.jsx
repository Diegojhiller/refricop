import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, Wrench, Calendar, LogOut, Package, PackagePlus, DollarSign } from 'lucide-react';
import { X } from 'lucide-react'; // Añadir X import

const Sidebar = ({ isMobileOpen, closeMobileMenu }) => {
  const { user, logoutContext } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutContext();
    navigate('/login');
  };

  const navStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    marginBottom: '8px',
    borderRadius: '8px',
    background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  });

  return (
    <>
      {isMobileOpen && <div className="sidebar-overlay" onClick={closeMobileMenu}></div>}
      <div className={`glass-panel sidebar ${isMobileOpen ? 'open' : ''}`} style={{ width: '260px', height: '100vh', borderRadius: '0', borderRight: '1px solid var(--panel-border)', borderTop: 'none', borderBottom: 'none', borderLeft: 'none', display: 'flex', flexDirection: 'column' }}>
        
        <button className="mobile-close-btn" onClick={closeMobileMenu}>
          <X size={24} />
        </button>
      
      <div style={{ padding: '0 0 20px 0', borderBottom: '1px solid var(--panel-border)', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wrench size={24} color="var(--accent-cyan)" />
          REFRICOP
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Usuario: {user?.name} ({user?.role})
        </p>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <NavLink to="/dashboard" style={navStyle}>
          <LayoutDashboard size={20} style={{ marginRight: '12px' }} />
          {user?.role === 'Client' ? 'Panel de Control' : 'Dashboard'}
        </NavLink>
        
        {user?.role !== 'Client' && (
          <NavLink to="/clients" style={navStyle}>
            <Users size={20} style={{ marginRight: '12px' }} />
            Clientes
          </NavLink>
        )}

        <NavLink to="/appointments" style={navStyle}>
          <Calendar size={20} style={{ marginRight: '12px' }} />
          {user?.role === 'Client' ? 'Mis Turnos' : 'Turnos'}
        </NavLink>

        {user?.role !== 'Client' && (
          <NavLink to="/works" style={navStyle}>
            <PackagePlus size={20} style={{ marginRight: '12px' }} />
            Órdenes de Trabajo
          </NavLink>
        )}

        {user?.role === 'Admin' && (
          <NavLink to="/finances" style={navStyle}>
            <DollarSign size={20} style={{ marginRight: '12px' }} />
            Finanzas (Caja)
          </NavLink>
        )}

        <NavLink to="/catalog" style={navStyle}>
          <Package size={20} style={{ marginRight: '12px' }} />
          Catálogo y Precios
        </NavLink>
      </nav>

      <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <LogOut size={18} />
        Cerrar Sesión
      </button>

    </div>
    </>
  );
};

export default Sidebar;
