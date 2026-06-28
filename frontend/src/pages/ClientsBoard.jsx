import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { UserPlus, Search, Clock } from 'lucide-react';

const ClientsBoard = () => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', address: '', email: '' });
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', newClient);
      setShowModal(false);
      setNewClient({ name: '', phone: '', address: '', email: '' });
      fetchClients();
    } catch (e) {
      alert('Error creando cliente');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Gestión de Clientes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Directorio de personas y domicilios a asistir.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {showModal && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-blue)' }}>
          <h3 style={{ marginBottom: '16px' }}>Registrar Nuevo Cliente</h3>
          <form style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} onSubmit={handleAddClient}>
            <input type="text" placeholder="Nombre completo" className="input-field" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required />
            <input type="text" placeholder="Celular" className="input-field" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} required />
            <input type="text" placeholder="Domicilio / Dpto" className="input-field" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} required />
            <input type="email" placeholder="Correo (opcional)" className="input-field" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
            <button type="submit" className="btn-primary">Guardar</button>
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
          </form>
        </div>
      )}

      <div className="glass-panel animate-fade-in" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <Search size={20} color="var(--text-secondary)" style={{ alignSelf: 'center' }} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o teléfono..." 
          className="input-field"
          style={{ flex: 1, backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glass-panel animate-fade-in">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Email</th>
                <th style={{ textAlign: 'center' }}>Historial</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelectedClient(c)} style={{ cursor: 'pointer' }} className="stat-card-hover">
                  <td data-label="Nombre" style={{ fontWeight: 500 }}>{c.name}</td>
                  <td data-label="Teléfono">{c.phone}</td>
                  <td data-label="Dirección">{c.address}</td>
                  <td data-label="Email" style={{ color: 'var(--text-secondary)' }}>{c.email || 'N/A'}</td>
                  <td data-label="Historial" style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setSelectedClient(c)} 
                      className="btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Clock size={12} /> Ver Historial
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>No hay clientes registrados aún.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Historial Clínico/Técnico de Cliente */}
      {selectedClient && (() => {
        // Calcular métricas
        const appointmentsCount = selectedClient.Appointments?.length || 0;
        let totalSpend = 0;
        selectedClient.Appointments?.forEach(a => {
          if (a.RepairWork && a.RepairWork.status === 'Finalizado') {
            totalSpend += parseFloat(a.RepairWork.totalCost) || 0;
          }
        });

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    Ficha de Historial Técnico
                  </span>
                  <h2 style={{ margin: '4px 0 0 0', fontSize: '1.5rem' }}>{selectedClient.name}</h2>
                </div>
                <button className="btn-secondary" onClick={() => setSelectedClient(null)}>Cerrar</button>
              </div>

              {/* Grid de Información de Contacto */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Teléfono</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 500 }}>{selectedClient.phone}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 500 }}>{selectedClient.email || 'N/A'}</p>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dirección</span>
                  <p style={{ margin: '2px 0 0 0', fontWeight: 500 }}>{selectedClient.address}</p>
                </div>
              </div>

              {/* Tarjetas de Resumen del Cliente */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ flex: 1, padding: '12px', textAlign: 'center', borderLeft: '3px solid var(--accent-blue)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Servicios Programados</span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem' }}>{appointmentsCount} Visitas</h3>
                </div>
                <div className="glass-panel" style={{ flex: 1, padding: '12px', textAlign: 'center', borderLeft: '3px solid var(--success)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fidelidad / Inversión</span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', color: 'var(--success)' }}>${totalSpend.toLocaleString()}</h3>
                </div>
              </div>

              {/* Línea de Tiempo de Turnos */}
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>
                Línea de Tiempo de Visitas y Trabajos
              </h3>

              {selectedClient.Appointments && selectedClient.Appointments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid rgba(255,255,255,0.08)' }}>
                  {selectedClient.Appointments.map((appt, index) => (
                    <div key={appt.id} style={{ position: 'relative' }}>
                      {/* Punto de la línea de tiempo */}
                      <div style={{
                        position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px',
                        borderRadius: '50%', background: appt.status === 'Confirmado' ? 'var(--success)' : 'var(--accent-blue)',
                        border: '2px solid var(--panel-bg)', boxShadow: '0 0 8px rgba(6,182,212,0.3)'
                      }} />
                      
                      <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            {new Date(appt.date).toLocaleDateString()} {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span style={{
                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                            background: appt.status === 'Confirmado' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                            color: appt.status === 'Confirmado' ? 'var(--success)' : 'var(--accent-blue)'
                          }}>
                            {appt.status}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <strong>Problema reportado:</strong> {appt.notes}
                        </p>

                        {/* Detalle del trabajo de reparación vinculado */}
                        {appt.RepairWork ? (
                          <div style={{ marginTop: '10px', padding: '8px', borderLeft: '3px solid var(--success)', background: 'rgba(16,185,129,0.03)', borderRadius: '0 4px 4px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>
                              <span>{appt.RepairWork.equipmentType} ({appt.RepairWork.equipmentBrand})</span>
                              <span style={{ color: 'var(--success)' }}>${parseFloat(appt.RepairWork.totalCost).toLocaleString()}</span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              <strong>Diagnóstico:</strong> {appt.RepairWork.diagnosis || 'Ninguno'}
                            </p>
                            <span style={{
                              display: 'inline-block', marginTop: '6px', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px',
                              background: appt.RepairWork.status === 'Finalizado' ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)',
                              color: appt.RepairWork.status === 'Finalizado' ? 'var(--success)' : 'var(--warning)'
                            }}>
                              Orden: {appt.RepairWork.status}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontStyle: 'italic', marginTop: '4px' }}>
                            Aún sin orden de trabajo generada.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Este cliente no registra visitas ni turnos aún.
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ClientsBoard;
