import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { UserPlus, User, Mail, Lock, Phone, MapPin } from 'lucide-react';
import { ThemeToggle } from '../App';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Registramos al usuario como Cliente con sus datos de contacto
      await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role: 'Client', 
        phone, 
        address 
      });
      alert('Registro completado. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert('Ese correo ya está registrado.');
      } else {
        alert('Error conectando con el servidor. ¿Iniciaste la API Backend en puerto 5000?');
      }
    }
  };

  return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column' }}>
      <ThemeToggle style={{ position: 'fixed', top: '20px', right: '25px', zIndex: 9999 }} />
      <div style={{ marginBottom: '24px' }}>
        <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
           ← Volver al inicio
        </Link>
      </div>

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <UserPlus size={48} color="var(--accent-blue)" />
          <h2 style={{ marginTop: '10px', fontSize: '1.6rem' }}>Crear tu Cuenta</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Únete a la red Refricop como Cliente</p>
        </div>

        <form onSubmit={handleRegister}>
          <div className="input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
            <label>Nombre Completo</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '40px', width: '100%' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
            <label>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                className="input-field" 
                style={{ paddingLeft: '40px', width: '100%' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
            <label>Teléfono de Contacto</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="tel" 
                className="input-field" 
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="Ej: +54 9 11 2345-6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ textAlign: 'left', marginBottom: '12px' }}>
            <label>Dirección</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '40px', width: '100%' }}
                placeholder="Ej: Av. Siempreviva 742"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '40px', width: '100%' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '5px' }}>
            Registrarme y Solicitar Turno
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
