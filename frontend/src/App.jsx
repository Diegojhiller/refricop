import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Sun, Moon, Snowflake } from 'lucide-react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';

import ClientsBoard from './pages/ClientsBoard';
import CatalogManager from './pages/CatalogManager';
import WorkOrders from './pages/WorkOrders';
import BookAppointment from './pages/BookAppointment';
import AppointmentsList from './pages/AppointmentsList';
import FinanceDashboard from './pages/FinanceDashboard';

import { io } from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ThemeToggle = ({ style = {} }) => {
  const [isLight, setIsLight] = React.useState(() => document.documentElement.classList.contains('light-theme'));

  const toggleTheme = () => {
    const newVal = !isLight;
    setIsLight(newVal);
    document.documentElement.classList.toggle('light-theme', newVal);
  };

  return (
    <button 
      onClick={toggleTheme}
      style={{
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
        borderRadius: '50%',
        width: '42px',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease',
        ...style
      }}
      title="Alternar Modo Claro/Oscuro"
    >
      {isLight ? <Moon size={20} /> : <Sun size={20} color="var(--warning)" />}
    </button>
  );
};

import MobileBottomNav from './components/MobileBottomNav';

const NotificationsPanel = ({ socket, style = {} }) => {
  const [notifications, setNotifications] = React.useState([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Cargar las notificaciones iniciales (últimos 5 turnos registrados)
  React.useEffect(() => {
    import('./api/axios.js').then(({ default: api }) => {
      api.get('/appointments')
        .then(({ data }) => {
          const appts = data.slice(-5).reverse().map(a => ({
            id: a.id,
            notes: a.notes || 'Revisión técnica',
            address: a.clientAddressStr || a.Client?.address || 'Sin domicilio',
            date: new Date(a.date).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
            read: true
          }));
          setNotifications(appts);
        })
        .catch(err => console.error('Error cargando notificaciones iniciales', err));
    });
  }, []);

  // Escuchar nuevas reservas en tiempo real
  React.useEffect(() => {
    if (socket) {
      const handleNewReservation = (data) => {
        const newNotif = {
          id: data.id,
          notes: data.notes || 'Revisión técnica',
          address: data.clientAddressStr || 'Sin domicilio',
          date: new Date(data.date).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          read: false
        };
        setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
        setUnreadCount(prev => prev + 1);
      };

      socket.on('nueva_reserva', handleNewReservation);
      return () => {
        socket.off('nueva_reserva', handleNewReservation);
      };
    }
  }, [socket]);

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      <button 
        onClick={togglePanel}
        style={{
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          borderRadius: '50%',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          transition: 'all 0.3s ease'
        }}
        title="Bandeja de Notificaciones"
      >
        <span style={{ fontSize: '1.1rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            background: 'var(--danger)',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="glass-panel animate-fade-in" style={{
          position: 'absolute',
          top: '50px',
          right: '0',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          border: '1px solid var(--panel-border)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'left',
          zIndex: 9999
        }}>
          <h4 style={{ margin: '0 0 12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', fontSize: '0.95rem', fontWeight: 600 }}>
            Últimas Solicitudes Cargadas
          </h4>
          {notifications.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, padding: '12px 0', textAlign: 'center' }}>No hay alertas recientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((n, i) => (
                <div key={i} style={{ 
                  fontSize: '0.85rem', 
                  borderBottom: i < notifications.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  paddingBottom: '8px',
                  color: n.read ? 'var(--text-primary)' : 'var(--accent-cyan)'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>🛠️ {n.notes}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '3px' }}>📍 Asistir a: {n.address}</div>
                  <div style={{ color: 'var(--accent-blue)', fontSize: '0.75rem', fontWeight: 500 }}>📅 Pactado: {n.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Utilizando un Layout para cuando el usuario está logueado
const PrivateLayout = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [socket, setSocket] = React.useState(null);

  React.useEffect(() => {
    if (user) {
      const apiHost = `http://${window.location.hostname}:5000`;
      const s = io(import.meta.env.VITE_API_URL || apiHost);
      setSocket(s);

      s.on('nueva_reserva', (data) => {
        toast.success(
          <div>
            <strong>¡Nueva Reserva!</strong><br />
            Cliente: {data.clientNameStr || 'Sin Nombre'}<br />
            Dir: {data.clientAddressStr}<br />
            {data.latitude && data.longitude && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`} 
                target="_blank" 
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: '8px', color: 'var(--accent-blue)', fontWeight: 'bold' }}
              >
                📍 Ver en Google Maps
              </a>
            )}
          </div>,
          { autoClose: false, position: "top-right", theme: "dark" }
        );
      });

      return () => s.disconnect();
    }
  }, [user]);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar isMobileOpen={isMobileMenuOpen} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <header className="top-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 2rem',
          height: '64px',
          borderBottom: '1px solid var(--panel-border)',
          background: 'var(--panel-bg)',
          backdropFilter: 'blur(8px)',
          gap: '12px',
          zIndex: 100
        }}>
          {/* Logo en el Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)'
            }}>
              <Snowflake size={16} color="white" />
            </div>
            <span style={{ letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
              REFRI<span style={{ color: 'var(--accent-cyan)' }}>COP</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NotificationsPanel socket={socket} />
            <ThemeToggle />
          </div>
        </header>
        <main className="main-content" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {children}
        </main>
        <footer style={{
          padding: '24px 2rem',
          background: 'var(--panel-bg)',
          borderTop: '1px solid var(--panel-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          zIndex: 10
        }}>
          {/* Logo en el Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '0.95rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)',
              padding: '3px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(6, 182, 212, 0.25)'
            }}>
              <Snowflake size={12} color="white" />
            </div>
            <span style={{ letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              REFRI<span style={{ color: 'var(--accent-cyan)' }}>COP</span>
            </span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span>© {new Date().getFullYear()} REFRICOP. Todos los derechos reservados.</span>
            <span style={{ display: 'block', marginTop: '4px', opacity: 0.8 }}>Refricop Manager v1.2.0 • Soluciones en Refrigeración y Lavarropas</span>
          </div>
        </footer>
      </div>
      <MobileBottomNav onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reservar" element={<BookAppointment />} />
          
          <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
          <Route path="/clients" element={<PrivateLayout><ClientsBoard /></PrivateLayout>} />
          <Route path="/catalog" element={<PrivateLayout><CatalogManager /></PrivateLayout>} />
          <Route path="/works" element={<PrivateLayout><WorkOrders /></PrivateLayout>} />
          <Route path="/appointments" element={<PrivateLayout><AppointmentsList /></PrivateLayout>} />
          <Route path="/finances" element={<PrivateLayout><FinanceDashboard /></PrivateLayout>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export { ThemeToggle };
export default App;
