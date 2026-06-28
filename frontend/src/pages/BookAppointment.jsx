import React, { useState } from 'react';
import { Calendar as CalendarIcon, User, MapPin, Phone, MessageSquare, Send } from 'lucide-react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../App';

const BookAppointment = () => {
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  // Generador de próximos 14 días
  const getNextDays = () => {
    const days = [];
    for(let i=0; i<14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('es-ES', { weekday: 'long', month: 'short', day: 'numeric' });
      days.push({ value: dateStr, label: display });
    }
    return days;
  };
  const daysOptions = getNextDays();
  const timesOptions = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const handleBook = async (e) => {
    e.preventDefault();
    if(!selectedDay || !selectedTime) return alert('Selecciona día y hora');
    const finalDate = new Date(`${selectedDay}T${selectedTime}`).toISOString();

    try {
      await api.post('/appointments/book', {
        date: finalDate,
        clientName,
        clientPhone,
        clientAddress,
        latitude,
        longitude,
        notes
      });
      alert('¡Turno reservado con éxito! Recibirás confirmación pronto.');
      setSelectedDay(''); setSelectedTime(''); setClientName(''); setClientPhone(''); setClientAddress(''); setNotes(''); setLatitude(null); setLongitude(null); setLocationStatus('');
    } catch (e) {
      alert('Error al reservar turno');
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    try {
      await api.post('/queries', { name: contactName, message: contactMsg });
      alert('¡Mensaje enviado al taller!');
      setContactName(''); setContactMsg('');
    } catch (e) {
      alert('Error enviando consulta');
    }
  };

  return (
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ThemeToggle style={{ position: 'fixed', top: '20px', right: '25px', zIndex: 9999 }} />
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px', alignItems: 'center', borderBottom: '1px solid var(--panel-border)' }}>
        <Link to="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem' }}>← REFRICOP HOME</Link>
      </nav>

      <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        <div className="glass-panel animate-fade-in">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CalendarIcon color="var(--accent-blue)" /> Solicitar Servicio a Domicilio
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Elige una fecha e ingresa tus datos. Un técnico confirmará la visita.</p>
          
          <form onSubmit={handleBook} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group">
              <label>Día Deseado</label>
              <select className="input-field" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} required>
                <option value="">-- Selecciona el Día --</option>
                {daysOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            
            <div className="input-group">
              <label>Rango Horario Recomendado</label>
              <select className="input-field" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} required>
                <option value="">-- Selecciona la Hora --</option>
                {timesOptions.map(t => <option key={t} value={t}>{t} hs</option>)}
              </select>
            </div>

            <div className="input-group">
              <label><User size={14}/> Nombre Completo</label>
              <input type="text" className="input-field" value={clientName} onChange={e => setClientName(e.target.value)} required />
            </div>

            <div className="input-group">
              <label><Phone size={14}/> Celular</label>
              <input type="text" className="input-field" value={clientPhone} onChange={e => setClientPhone(e.target.value)} required />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label><MapPin size={14}/> Dirección (Calle y Número, Barrio)</label>
              <input type="text" className="input-field" value={clientAddress} onChange={e => setClientAddress(e.target.value)} required />
              
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => {
                  if (!navigator.geolocation) {
                    setLocationStatus('Geolocalización no soportada por el navegador.');
                    return;
                  }
                  setLocationStatus('Obteniendo ubicación...');
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setLatitude(position.coords.latitude);
                      setLongitude(position.coords.longitude);
                      setLocationStatus('📍 Ubicación capturada con éxito.');
                    },
                    (error) => {
                      setLocationStatus('❌ Error al obtener ubicación. Revisa los permisos.');
                    }
                  );
                }} style={{ padding: '8px 12px', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '4px', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.9rem' }}>
                  📍 Compartir mi ubicación exacta (Sugerido para el técnico)
                </button>
                {locationStatus && <span style={{ fontSize: '0.85rem', color: locationStatus.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>{locationStatus}</span>}
              </div>
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label><MessageSquare size={14}/> Síntoma del Equipo (Ej: Split no enfría, Lavarropas error E2)</label>
              <textarea className="input-field" rows="3" value={notes} onChange={e => setNotes(e.target.value)} required></textarea>
            </div>

            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}>Finalizar Solicitud de Turno</button>
          </form>
        </div>

        <div className="glass-panel animate-fade-in">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Send color="var(--success)" /> Consultas y Sugerencias
          </h2>
          <form onSubmit={handleQuery} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" placeholder="Tu Nombre o Identificador" className="input-field" value={contactName} onChange={e => setContactName(e.target.value)} required />
            <textarea placeholder="Mensaje, consulta o sugerencia general para el taller..." className="input-field" rows="3" value={contactMsg} onChange={e => setContactMsg(e.target.value)} required></textarea>
            <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-start' }}>Enviar Mensaje</button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default BookAppointment;
