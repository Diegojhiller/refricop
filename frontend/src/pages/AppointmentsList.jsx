import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios.js';
import { Calendar, CheckCircle, Edit, CalendarPlus, MapPin, UserCheck, Trash2 } from 'lucide-react';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [newTurn, setNewTurn] = useState({ clientName: '', clientPhone: '', clientAddress: '' });
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [equipmentBrand, setEquipmentBrand] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [equipmentFrigocalories, setEquipmentFrigocalories] = useState('');

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
    status: '',
    equipmentBrand: '',
    equipmentModel: '',
    equipmentFrigocalories: ''
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
      status: a.status || 'Solicitado',
      equipmentBrand: a.equipmentBrand || '',
      equipmentModel: a.equipmentModel || '',
      equipmentFrigocalories: a.equipmentFrigocalories || ''
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
        status: editForm.status,
        equipmentBrand: editForm.equipmentBrand,
        equipmentModel: editForm.equipmentModel,
        equipmentFrigocalories: editForm.equipmentFrigocalories
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

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openId = params.get('open');
    if (openId && appointments.length > 0) {
      const appt = appointments.find(a => a.id === parseInt(openId));
      if (appt) {
        handleOpenEditModal(appt);
      }
    }
  }, [location.search, appointments]);

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

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este turno permanentemente? Se borrarán también las órdenes de trabajo asociadas.')) {
      try {
        await api.delete(`/appointments/${id}`);
        alert('Turno eliminado correctamente.');
        fetchAppointments();
      } catch (err) {
        alert('Error al eliminar el turno.');
      }
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
      clientAddress: client.address
    });
    setShowSuggestions(false);
  };

  const handleBookInternal = async (e) => {
    e.preventDefault();
    if(!selectedDay || !selectedTime) return alert('Selecciona día y hora');
    
    const finalDate = new Date(`${selectedDay}T${selectedTime}`).toISOString();
    const finalNotes = additionalNotes 
      ? `${selectedSymptom} - Detalle: ${additionalNotes}` 
      : selectedSymptom;
    
    try {
      await api.post('/appointments/book', { 
        ...newTurn, 
        notes: finalNotes,
        date: finalDate,
        technicianId: assignedTechnicianId ? parseInt(assignedTechnicianId) : null,
        equipmentBrand,
        equipmentModel,
        equipmentFrigocalories
      });
      setShowModal(false);
      setNewTurn({ clientName: '', clientPhone: '', clientAddress: '' });
      setSelectedSymptom('');
      setAdditionalNotes('');
      setEquipmentBrand('');
      setEquipmentModel('');
      setEquipmentFrigocalories('');
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
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <select className="input-field" value={selectedSymptom} onChange={e => setSelectedSymptom(e.target.value)} required style={{ flex: 1 }}>
                <option value="">-- Selecciona Síntoma/Falla --</option>
                <optgroup label="Aires Acondicionados Split">
                  <option value="Split no enfría / no calienta">Split no enfría / no calienta</option>
                  <option value="Split gotea agua por la unidad interior">Split gotea agua por la unidad interior</option>
                  <option value="Split no enciende (sin señal en placa)">Split no enciende (sin señal en placa)</option>
                  <option value="Split ventilador exterior no gira">Split ventilador exterior no gira</option>
                </optgroup>
                <optgroup label="Aires de Ventana">
                  <option value="Aire Ventana no enfría / motor no arranca">Aire Ventana no enfría / motor no arranca</option>
                  <option value="Aire Ventana hace ruido excesivo o vibración">Aire Ventana hace ruido excesivo o vibración</option>
                  <option value="Aire Ventana congela el radiador (forma hielo)">Aire Ventana congela el radiador (forma hielo)</option>
                  <option value="Aire Ventana tira agua hacia adentro">Aire Ventana tira agua hacia adentro</option>
                </optgroup>
                <optgroup label="Lavarropas">
                  <option value="Lavarropas no centrifuga">Lavarropas no centrifuga</option>
                  <option value="Lavarropas no desagota (bomba rota/tapada)">Lavarropas no desagota (bomba rota/tapada)</option>
                  <option value="Lavarropas hace ruido muy fuerte al centrifugar">Lavarropas hace ruido muy fuerte al centrifugar</option>
                  <option value="Lavarropas pierde agua por debajo / jabonera">Lavarropas pierde agua por debajo / jabonera</option>
                </optgroup>
                <optgroup label="Otros Electrodomésticos">
                  <option value="Heladera no enfría abajo (freezer sí funciona)">Heladera no enfría abajo (freezer sí funciona)</option>
                  <option value="Heladera no arranca / motor recalienta">Heladera no arranca / motor recalienta</option>
                  <option value="Secarropas no gira el tambor">Secarropas no gira el tambor</option>
                  <option value="Microondas no calienta (enciende y gira)">Microondas no calienta (enciende y gira)</option>
                </optgroup>
                <option value="Otro problema">Otro problema (Especificar al lado)</option>
              </select>
              <input type="text" placeholder="Detalles de la falla (Opcional)" className="input-field" value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} style={{ flex: 1 }} />
            </div>

            {/* Campos condicionales para Aires en Creación Manual */}
            {(selectedSymptom.toLowerCase().includes('split') || selectedSymptom.toLowerCase().includes('ventana')) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--panel-border)', marginTop: '4px' }}>
                <div className="input-group">
                  <label>Marca del Aire</label>
                  <input type="text" placeholder="Ej: BGH" className="input-field" value={equipmentBrand} onChange={e => setEquipmentBrand(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Modelo</label>
                  <input type="text" placeholder="Ej: Ventana 3000" className="input-field" value={equipmentModel} onChange={e => setEquipmentModel(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Frigorías</label>
                  <input type="text" placeholder="Ej: 3000" className="input-field" value={equipmentFrigocalories} onChange={e => setEquipmentFrigocalories(e.target.value)} />
                </div>
              </div>
            )}

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
                  <td data-label="Síntomas / Notas" style={{ maxWidth: '250px' }}>
                    <div style={{ fontWeight: '500', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={a.notes}>
                      {a.notes}
                    </div>
                    {(a.equipmentBrand || a.equipmentModel || a.equipmentFrigocalories) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }} title={`${a.equipmentBrand || ''} ${a.equipmentModel || ''} ${a.equipmentFrigocalories ? a.equipmentFrigocalories + ' frig.' : ''}`}>
                        {a.equipmentBrand && <span>🏷️ {a.equipmentBrand}</span>}
                        {a.equipmentModel && <span>📦 {a.equipmentModel}</span>}
                        {a.equipmentFrigocalories && <span>❄️ {a.equipmentFrigocalories} frig.</span>}
                      </div>
                    )}
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
                      <button onClick={() => handleDeleteAppointment(a.id)} title="Eliminar Turno" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                        <Trash2 size={18} />
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
                <label>Autocompletar Síntoma Común (Opcional)</label>
                <select 
                  className="input-field" 
                  onChange={e => { if (e.target.value) setEditForm({...editForm, notes: e.target.value}); }}
                  value=""
                >
                  <option value="">-- Selecciona para reemplazar notas --</option>
                  <optgroup label="Aires Acondicionados Split">
                    <option value="Split no enfría / no calienta">Split no enfría / no calienta</option>
                    <option value="Split gotea agua por la unidad interior">Split gotea agua por la unidad interior</option>
                    <option value="Split no enciende (sin señal en placa)">Split no enciende (sin señal en placa)</option>
                    <option value="Split ventilador exterior no gira">Split ventilador exterior no gira</option>
                  </optgroup>
                  <optgroup label="Aires de Ventana">
                    <option value="Aire Ventana no enfría / motor no arranca">Aire Ventana no enfría / motor no arranca</option>
                    <option value="Aire Ventana hace ruido excesivo o vibración">Aire Ventana hace ruido excesivo o vibración</option>
                    <option value="Aire Ventana congela el radiador (forma hielo)">Aire Ventana congela el radiador (forma hielo)</option>
                    <option value="Aire Ventana tira agua hacia adentro">Aire Ventana tira agua hacia adentro</option>
                  </optgroup>
                  <optgroup label="Lavarropas">
                    <option value="Lavarropas no centrifuga">Lavarropas no centrifuga</option>
                    <option value="Lavarropas no desagota (bomba rota/tapada)">Lavarropas no desagota (bomba rota/tapada)</option>
                    <option value="Lavarropas hace ruido muy fuerte al centrifugar">Lavarropas hace ruido muy fuerte al centrifugar</option>
                    <option value="Lavarropas pierde agua por debajo / jabonera">Lavarropas pierde agua por debajo / jabonera</option>
                  </optgroup>
                  <optgroup label="Otros Electrodomésticos">
                    <option value="Heladera no enfría abajo (freezer sí funciona)">Heladera no enfría abajo (freezer sí funciona)</option>
                    <option value="Heladera no arranca / motor recalienta">Heladera no arranca / motor recalienta</option>
                    <option value="Secarropas no gira el tambor">Secarropas no gira el tambor</option>
                    <option value="Microondas no calienta (enciende y gira)">Microondas no calienta (enciende y gira)</option>
                  </optgroup>
                </select>
              </div>
              <div className="input-group">
                <label>Notas / Síntoma Completo</label>
                <input type="text" className="input-field" value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
              </div>

              {/* Campos condicionales para Aires en Edición */}
              {(editForm.notes.toLowerCase().includes('split') || editForm.notes.toLowerCase().includes('ventana') || editForm.equipmentBrand || editForm.equipmentModel || editForm.equipmentFrigocalories) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                  <div className="input-group">
                    <label>Marca del Aire</label>
                    <input type="text" className="input-field" value={editForm.equipmentBrand} onChange={e => setEditForm({...editForm, equipmentBrand: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Modelo</label>
                    <input type="text" className="input-field" value={editForm.equipmentModel} onChange={e => setEditForm({...editForm, equipmentModel: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Frigorías</label>
                    <input type="text" className="input-field" value={editForm.equipmentFrigocalories} onChange={e => setEditForm({...editForm, equipmentFrigocalories: e.target.value})} />
                  </div>
                </div>
              )}
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
