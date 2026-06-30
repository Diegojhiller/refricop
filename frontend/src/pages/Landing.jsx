import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ShieldCheck, Clock, Zap, Snowflake } from 'lucide-react';
import { ThemeToggle } from '../App';
import api from '../api/axios';

const Landing = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get('/reviews')
      .then(({ data }) => setReviews(data))
      .catch(err => console.error('Error cargando reseñas en landing:', err));
  }, []);

  return (
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ThemeToggle style={{ position: 'fixed', top: '20px', right: '25px', zIndex: 9999 }} />
      
      {/* Header / Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px', alignItems: 'center', borderBottom: '1px solid var(--panel-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Wrench size={28} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 700, letterSpacing: '2px' }}>REFRICOP</h2>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none' }}>Iniciar Sesión</Link>
          <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Registrarse</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex-center" style={{ flex: 1, flexDirection: 'column', textAlign: 'center', padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="animate-fade-in">
          <h1 style={{ fontSize: '3.5rem', marginBottom: '24px', background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-cyan) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Servicio Técnico de Excelencia
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.6' }}>
            La plataforma líder para gestión de reparaciones y mantenimientos de 
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}> Aires Acondicionados</span> y 
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}> Lavarropas de Carga Frontal</span>. 
            Agilidad, transparencia y resultados en tiempo real.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <Link to="/reservar" className="btn-primary" style={{ fontSize: '1.1rem', padding: '16px 32px' }}>Agendar un Servicio (Nuevo Turno)</Link>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '80px', width: '100%' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <ShieldCheck size={40} color="var(--accent-blue)" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>Control Total</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestiona clientes, turnos y presupuestos desde un solo lugar.</p>
          </div>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <Zap size={40} color="var(--warning)" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>Evidencia en Tiempo Real</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sube fotografías del proceso para transparentar tu trabajo.</p>
          </div>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <Clock size={40} color="var(--success)" style={{ marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>Historial Completo</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registra qué componentes se usaron en cada equipo intervenido.</p>
          </div>
        </div>

        {/* Testimonials Section */}
        {reviews.length > 0 && (
          <div style={{ marginTop: '80px', width: '100%' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '24px', textAlign: 'center', color: 'var(--text-primary)' }}>
              Opiniones de nuestros Clientes
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', textAlign: 'left' }}>
              {reviews.slice(0, 3).map((rev) => (
                <div key={rev.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: 'var(--warning)', fontSize: '1.25rem', marginBottom: '8px' }}>
                      {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                    </div>
                    <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                      "{rev.comment || 'Excelente atención y servicio técnico.'}"
                    </p>
                  </div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                    - {rev.Client?.name || 'Cliente de Refricop'}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        padding: '32px 40px',
        borderTop: '1px solid var(--panel-border)',
        background: 'var(--panel-bg)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
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
        
        <div>
          <span>© {new Date().getFullYear()} REFRICOP. Todos los derechos reservados.</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
          <a href="#privacidad" style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>Privacidad</a>
          <a href="#terminos" style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>Términos</a>
          <a href="#contacto" style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>Soporte</a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
