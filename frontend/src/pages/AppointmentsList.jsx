import React, { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { Calendar, CheckCircle, Edit, CalendarPlus, MapPin, UserCheck } from 'lucide-react';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [newTurn, setNewTurn] = useState({ clientName: '', clientPhone: '', clientAddress: '', notes: '' });

  // Autocomplete y Técnicos
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Estados para Edición
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editForm, setEditForm] = useState({
    id: '',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    date: '',
    notes: '',
    technicianId: '',
    status: ''
  });

  const formatDatetimeLocal = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
  };

  const handleOpenEditModal = (a) => {
    setEditingAppointment(a);
    setEditForm({
      id: a.id,
      clientName: a.clientNameStr || a.Client?.name || '',
      clientPhone: a.clientPhoneStr || a.Client?.phone || '',
      clientAddress: a.clientAddressStr || a.Client?.address || '',
      date: formatDatetimeLocal(a.date),
      notes: a.notes || '',
      technicianId: a.technicianId || '',
      status: a.status || 'Solicitado'
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/appointments/${editForm.id}`, {
        clientName: editForm.clientName,
        clientPhone: editForm.clientPhone,
        clientAddress: editForm.clientAddress,
        date: new Date(editForm.date).toISOString(),
        notes: editForm.notes,
        technicianId: editForm.technicianId ? parseInt(editForm.technicianId) : null,
        status: editForm.status
      });
      setEditingAppointment(null);
      fetchAppointments();
    } catch (err) {
      alert('Error al actualizar el turno');
    }
  };

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
  
  useEffect(() => {
    fetchAppointments();
    
    // Cargar clientes registrados para autocompletado
    api.get('/clients')
      .then(({ data }) => setClients(data))
      .catch(err => console.error('Error cargando clientes', err));

    // Cargar técnicos registrados
    api.get('/technicians')
      .then(({ data }) => setTechnicians(data))
      .catch(err => console.error('Error cargando técnicos', err));
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments');
      setAppointments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'Confirmado' });
      fetchAppointments();
    } catch (e) {
      alert('Error confirmando el turno');
    }
  };

  const handleClientNameChange = (val) => {
    setNewTurn({ ...newTurn, clientName: val });
    if (val.trim().length > 1) {
      const filtered = clients.filter(c => 
        c.name.toLowerCase().includes(val.toLowerCase())
      );
      setClientSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setClientSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectClient = (client) => {
    setNewTurn({
      clientName: client.name,
      clientPhone: client.phone,
      clientAddress: client.address,
      notes: newTurn.notes
    });
    setShowSuggestions(false);
  };

  const handleBookInternal = async (e) => {
    e.preventDefault();
    if(!selectedDay || !selectedTime) return alert('Selecciona día y hora');
    
    const finalDate = new Date(`${selectedDay}T${selectedTime}`).toISOString();
    
    try {
      await api.post('/appointments/book', { 
        ...newTurn, 
        date: finalDate,
        technicianId: assignedTechnicianId ? parseInt(assignedTechnicianId) : null
      });
      setShowModal(false);
      setNewTurn({ clientName: '', clientPhone: '', clientAddress: '', notes: '' });
      setAssignedTechnicianId('');
      setSelectedDay('');
      setSelectedTime('');
      fetchAppointments();
    } catch (e) {
      alert('Error al agendar el turno');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Gestión de Turnos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Agenda de visitas a domicilio.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarPlus size={18} />
          Agendar Manual
        </button>
      </div>

      {showModal && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-blue)', position: 'relative', zIndex: 10 }}>
          <h3 style={{ marginBottom: '16px' }}>Agendar Nuevo Turno Rápidamente (Llamada)</h3>
          <form style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flexDirection: 'column' }} onSubmit={handleBookInternal}>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <select className="input-field" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} required style={{ flex: 1 }}>
                <option value="">-- Elige un Día --</option>
                {daysOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
              <select className="input-field" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} required style={{ flex: 1 }}>
                <option value="">-- Elige la Hora --</option>
                {timesOptions.map(t => <option key={t} value={t}>{t} hs</option>)}
              </select>
              
              {/* Asignar Técnico */}
              <select className="input-field" value={assignedTechnicianId} onChange={e => setAssignedTechnicianId(e.target.value)} style={{ flex: 1 }}>
                <option value="">-- Asignar Técnico --</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>🛠️ {t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
              {/* Autocomplete de Clientes */}
              <div style={{ flex: 1, position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Escribe el nombre del cliente..." 
                  className="input-field" 
                  value={newTurn.clientName} 
                  onChange={e => handleClientNameChange(e.target.value)} 
                  required 
                  style={{ width: '100%' }}
                  onFocus={() => { if(newTurn.clientName) setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && clientSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--panel-bg)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    zIndex: 99,
                    maxHeight: '150px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    backdropFilter: 'blur(8px)'
                  }}>
                    {clientSuggestions.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => handleSelectClient(c)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          fontSize: '0.85rem'
                        }}
                      >
                        👥 {c.name} - 📞 {c.phone} ({c.address})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input type="text" placeholder="Celular" className="input-field" value={newTurn.clientPhone} onChange={e => setNewTurn({...newTurn, clientPhone: e.target.value})} required style={{ flex: 1 }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="text" placeholder="Domicilio / Localidad" className="input-field" value={newTurn.clientAddress} onChange={e => setNewTurn({...newTurn, clientAddress: e.target.value})} required style={{ flex: 1 }} />
              <input type="text" placeholder="Síntoma o Notas..." className="input-field" value={newTurn.notes} onChange={e => setNewTurn({...newTurn, notes: e.target.value})} required style={{ flex: 1 }} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary">Guardar Turno en Agenda</button>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel animate-fade-in">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Dirección</th>
                <th>Síntomas / Notas</th>
                <th>Técnico</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td data-label="Fecha/Hora" style={{ fontWeight: 500 }}>{new Date(a.date).toLocaleString()}</td>
                  <td data-label="Cliente">{a.clientNameStr || a.Client?.name}</td>
                  <td data-label="Contacto">{a.clientPhoneStr || a.Client?.phone}</td>
                  <td data-label="Dirección">
                    {(a.clientAddressStr || a.Client?.address) ? (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.clientAddressStr || a.Client?.address)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}
                        title="Abrir en Google Maps"
                      >
                        <MapPin size={14} />
                        {a.clientAddressStr || a.Client?.address}
                      </a>
                    ) : (
                      'Sin domicilio'
                    )}
                  </td>
                  <td data-label="Síntomas / Notas" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.notes}
                  </td>
                  <td data-label="Técnico" style={{ fontWeight: 500, color: 'var(--accent-blue)' }}>
                    {a.User?.name || <span style={{ color: 'var(--text-secondary)' }}>Sin asignar</span>}
                  </td>
                  <td data-label="Estado">
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                      background: a.status === 'Solicitado' ? 'rgba(239, 68, 68, 0.2)' : 
                                 a.status === 'Confirmado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: a.status === 'Solicitado' ? 'var(--danger)' : 
                             a.status === 'Confirmado' ? 'var(--success)' : 'var(--accent-blue)'
                    }}>
                      {a.status}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {a.status === 'Solicitado' && (
                        <button onClick={() => handleConfirm(a.id)} title="Confirmar Turno" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--success)' }}>
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button onClick={() => handleOpenEditModal(a)} title="Editar Turno" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)' }}>
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>No hay turnos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición de Turno */}
      {editingAppointment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px' }}>Editar Turno #{editingAppointment.id}</h3>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group">
                <label>Nombre del Cliente</label>
                <input type="text" className="input-field" value={editForm.clientName} onChange={e => setEditForm({...editForm, clientName: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Celular</label>
                <input type="text" className="input-field" value={editForm.clientPhone} onChange={e => setEditForm({...editForm, clientPhone: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Domicilio</label>
                <input type="text" className="input-field" value={editForm.clientAddress} onChange={e => setEditForm({...editForm, clientAddress: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Fecha y Hora</label>
                <input type="datetime-local" className="input-field" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>Notas / Síntoma</label>
                <input type="text" className="input-field" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Técnico Asignado</label>
                <select className="input-field" value={editForm.technicianId} onChange={e => setEditForm({...editForm, technicianId: e.target.value})}>
                  <option value="">-- Sin asignar --</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Estado del Turno</label>
                <select className="input-field" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                  <option value="Solicitado">Solicitado</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="En Curso">En Curso</option>
                  <option value="Completado">Completado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Cambios</button>
                <button type="button" className="btn-secondary" onClick={() => setEditingAppointment(null)} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
