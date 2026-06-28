import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { ThemeToggle } from '../App';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginContext } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      loginContext(data.user, data.token);
      navigate('/dashboard');
    } catch (error) {
      alert('Error al iniciar sesión. Comprueba tus credenciales.');
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
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <ShieldCheck size={56} color="var(--accent-cyan)" />
          <h2 style={{ marginTop: '12px', fontSize: '1.8rem' }}>REFRICOP</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gestión de Mantenimiento</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ textAlign: 'left' }}>
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

          <div className="input-group" style={{ textAlign: 'left' }}>
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

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
