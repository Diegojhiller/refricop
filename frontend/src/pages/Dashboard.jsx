import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Wrench, Calendar, Users, DollarSign, MapPin, Phone, Trash2, Camera, CheckCircle, ArrowUpRight, PlusCircle, Activity, Clock, TrendingUp, Snowflake } from 'lucide-react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, gradient, to }) => {
  const content = (
    <>
      <div style={{ 
        background: gradient || `linear-gradient(135deg, ${color} 0%, rgba(255,255,255,0.05) 100%)`, 
        padding: '16px', 
        borderRadius: '12px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 8px 20px -8px ${color || 'rgba(0,0,0,0.3)'}`
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
        <p style={{ 
          fontSize: '1.9rem', 
          fontWeight: 'bold', 
          margin: 0, 
          letterSpacing: '-0.02em', 
          background: 'linear-gradient(180deg, #ffffff 0%, #b0b0b0 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>{value}</p>
      </div>
      {to && (
        <ArrowUpRight size={18} style={{ color: 'var(--text-secondary)', opacity: 0.5, alignSelf: 'flex-start', marginTop: '2px' }} />
      )}
    </>
  );

  const cardStyle = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px', 
    textDecoration: 'none', 
    color: 'inherit', 
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
    cursor: to ? 'pointer' : 'default',
    borderLeft: `4px solid ${color || 'var(--panel-border)'}`
  };

  if (to) {
    return (
      <Link to={to} className="glass-panel animate-fade-in stat-card-hover" style={cardStyle}>
        {content}
      </Link>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={cardStyle}>
      {content}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const isTechnician = user?.role === 'Technician';
  const isClient = user?.role === 'Client';

  // Estados de Administrador
  const [stats, setStats] = useState({
    activeWorksCount: 0,
    appointmentsTodayCount: 0,
    registeredClientsCount: 0,
    estimatedRevenue: 0,
    upcomingAppointments: []
  });
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Estados de Técnico y Cliente
  const [appointments, setAppointments] = useState([]);
  const [loadingTech, setLoadingTech] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Estados específicos de Cliente
  const [showBookModal, setShowBookModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewApptId, setReviewApptId] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptSymptom, setNewApptSymptom] = useState('');
  const [newApptAdditionalNotes, setNewApptAdditionalNotes] = useState('');
  const [clientEquipmentBrand, setClientEquipmentBrand] = useState('');
  const [clientEquipmentModel, setClientEquipmentModel] = useState('');
  const [clientEquipmentFrigocalories, setClientEquipmentFrigocalories] = useState('');

  // Cierre de órdenes rápido para técnico
  const [catalogItems, setCatalogItems] = useState([]);
  const [equipmentType, setEquipmentType] = useState('Aire Split');
  const [equipmentBrand, setEquipmentBrand] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [files, setFiles] = useState([]);
  
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  useEffect(() => {
    if (isClient) {
      // Cargar turnos del cliente
      api.get('/appointments')
        .then(({ data }) => {
          setAppointments(data);
          setLoadingTech(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingTech(false);
        });

      // Cargar catálogo para ver precios
      api.get('/catalog')
        .then(({ data }) => setCatalogItems(data))
        .catch(err => console.error(err));

    } else if (!isTechnician) {
      // Cargar panel administrador
      api.get('/dashboard/stats')
        .then(({ data }) => {
          setStats(data);
          setLoadingAdmin(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingAdmin(false);
        });
    } else {
      // Cargar panel técnico (agenda propia)
      api.get('/appointments')
        .then(({ data }) => {
          setAppointments(data);
          setLoadingTech(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingTech(false);
        });

      // Cargar catálogo de repuestos
      api.get('/catalog')
        .then(({ data }) => setCatalogItems(data))
        .catch(err => console.error(err));
    }
  }, [isTechnician, isClient]);

  // Manejadores de Cliente
  const handleClientBook = async (e) => {
    e.preventDefault();
    try {
      const finalNotes = newApptAdditionalNotes 
        ? `${newApptSymptom} - Detalle: ${newApptAdditionalNotes}` 
        : newApptSymptom;

      await api.post('/appointments', {
        date: newApptDate,
        notes: finalNotes,
        equipmentBrand: clientEquipmentBrand,
        equipmentModel: clientEquipmentModel,
        equipmentFrigocalories: clientEquipmentFrigocalories
      });
      alert('¡Turno solicitado con éxito! El administrador lo revisará pronto.');
      setShowBookModal(false);
      setNewApptDate('');
      setNewApptSymptom('');
      setNewApptAdditionalNotes('');
      setClientEquipmentBrand('');
      setClientEquipmentModel('');
      setClientEquipmentFrigocalories('');
      
      // Recargar turnos
      const { data } = await api.get('/appointments');
      setAppointments(data);
    } catch (err) {
      alert('Error al solicitar el turno.');
    }
  };

  const handleClientReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        rating,
        comment: reviewComment,
        appointmentId: reviewApptId
      });
      alert('¡Muchas gracias por tu reseña! Tu opinión nos ayuda a mejorar.');
      setShowReviewModal(false);
      setReviewApptId(null);
      setRating(5);
      setReviewComment('');
      
      // Recargar turnos
      const { data } = await api.get('/appointments');
      setAppointments(data);
    } catch (err) {
      alert('Error al enviar la reseña.');
    }
  };

  // Manejadores para Técnico
  const handleStartService = async (apptId) => {
    try {
      await api.put(`/appointments/${apptId}`, { status: 'En Curso' });
      const { data } = await api.get('/appointments');
      setAppointments(data);
    } catch (err) {
      alert('Error al iniciar servicio');
    }
  };

  const handleOpenCompleteModal = (appt) => {
    setSelectedAppt(appt);
    setShowOrderModal(true);
  };

  const handleAddItem = () => {
    if (!currentItemId) return;
    const catItem = catalogItems.find(i => i.id === parseInt(currentItemId));
    if (!catItem) return;

    const existsIdx = selectedItems.findIndex(i => i.serviceCatalogId === catItem.id);
    if (existsIdx > -1) {
      const updated = [...selectedItems];
      updated[existsIdx].quantity += parseInt(currentQty);
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          serviceCatalogId: catItem.id,
          name: catItem.name,
          priceApplied: parseFloat(catItem.defaultPrice),
          quantity: parseInt(currentQty)
        }
      ]);
    }
    setCurrentItemId('');
    setCurrentQty(1);
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;

    try {
      // 1. Crear Orden de trabajo finalizada
      const { data: newWork } = await api.post('/works', {
        appointmentId: selectedAppt.id,
        equipmentType,
        equipmentBrand,
        diagnosis,
        status: 'Finalizado',
        items: selectedItems.map(item => ({
          serviceCatalogId: item.serviceCatalogId,
          quantity: item.quantity,
          priceApplied: item.priceApplied
        }))
      });

      // 2. Subir fotos si existen
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('repairWorkId', newWork.id);
        files.forEach(file => {
          formData.append('photos', file);
        });

        await api.post('/works/photos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      // 3. Marcar turno como completado
      await api.put(`/appointments/${selectedAppt.id}`, { status: 'Completado' });

      alert('¡Servicio cerrado y orden guardada correctamente!');
      setShowOrderModal(false);

      // Limpiar
      setSelectedAppt(null);
      setEquipmentBrand('');
      setDiagnosis('');
      setSelectedItems([]);
      setFiles([]);

      // Recargar lista de turnos
      const { data } = await api.get('/appointments');
      setAppointments(data);
    } catch (err) {
      console.error(err);
      alert('Error guardando el reporte del servicio.');
    }
  };

  // --- RENDER VISTA CLIENTE ---
  if (isClient) {
    if (loadingTech) {
      return <div style={{ color: 'var(--text-secondary)', padding: '24px' }}>Cargando tus datos...</div>;
    }

    const requestedCount = appointments.filter(a => a.status === 'Solicitado').length;
    const confirmedCount = appointments.filter(a => a.status === 'Confirmado' || a.status === 'En Curso').length;
    const completedCount = appointments.filter(a => a.status === 'Completado').length;

    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <style>{`
          .client-action-card {
            transition: all 0.2s ease-out;
            cursor: pointer;
          }
          .client-action-card:hover {
            transform: translateY(-2px);
            border-color: var(--accent-cyan) !important;
            background: rgba(255,255,255,0.04) !important;
          }
        `}</style>

        {/* Modal: Solicitar Turno */}
        {showBookModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '450px', padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                🗓️ Solicitar Visita Técnica
              </h3>
              <form onSubmit={handleClientBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <label>Fecha y Hora Propuesta</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    value={newApptDate}
                    onChange={e => setNewApptDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="input-group">
                  <label>Síntoma o Falla del Equipo</label>
                  <select 
                    className="input-field" 
                    value={newApptSymptom} 
                    onChange={e => setNewApptSymptom(e.target.value)} 
                    required
                  >
                    <option value="">-- Selecciona el error o síntoma principal --</option>
                    <optgroup label="Aires Acondicionados / Split">
                      <option value="Split no enfría / no calienta">Split no enfría / no calienta</option>
                      <option value="Split pierde agua (gotea por dentro)">Split pierde agua (gotea por dentro)</option>
                      <option value="Split no enciende / no responde">Split no enciende / no responde</option>
                      <option value="Split hace un ruido extraño o vibra">Split hace un ruido extraño o vibra</option>
                      <option value="Split larga olor desagradable">Split larga olor desagradable</option>
                      <option value="Split se apaga solo al poco tiempo">Split se apaga solo al poco tiempo</option>
                    </optgroup>
                    <optgroup label="Lavarropas (Carga Frontal / Superior)">
                      <option value="Lavarropas no centrifuga">Lavarropas no centrifuga</option>
                      <option value="Lavarropas no carga agua">Lavarropas no carga agua</option>
                      <option value="Lavarropas no desagota (se queda con agua)">Lavarropas no desagota (se queda con agua)</option>
                      <option value="Lavarropas hace ruido muy fuerte al centrifugar">Lavarropas hace ruido muy fuerte al centrifugar</option>
                      <option value="Lavarropas pierde agua por debajo">Lavarropas pierde agua por debajo</option>
                      <option value="Lavarropas no traba la puerta (error de blocapuerta)">Lavarropas no traba la puerta (error de blocapuerta)</option>
                      <option value="Lavarropas no enciende o parpadean las luces">Lavarropas no enciende o parpadean las luces</option>
                    </optgroup>
                    <option value="Otro problema">Otro problema (Especificar abajo)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Detalles adicionales (Opcional)</label>
                  <textarea 
                    placeholder="Comentarios de lo que le ocurre al equipo..." 
                    className="input-field" 
                    rows="2" 
                    value={newApptAdditionalNotes}
                    onChange={e => setNewApptAdditionalNotes(e.target.value)}
                  ></textarea>
                </div>

                {/* Campos condicionales para Aires (Split y Ventana) */}
                {(newApptSymptom.toLowerCase().includes('split') || newApptSymptom.toLowerCase().includes('ventana')) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--panel-border)', marginTop: '4px' }}>
                    <div className="input-group">
                      <label>Marca del Aire</label>
                      <input type="text" placeholder="Ej: LG" className="input-field" value={clientEquipmentBrand} onChange={e => setClientEquipmentBrand(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Modelo</label>
                      <input type="text" placeholder="Ej: Split" className="input-field" value={clientEquipmentModel} onChange={e => setClientEquipmentModel(e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label>Frigorías</label>
                      <input type="text" placeholder="Ej: 3000" className="input-field" value={clientEquipmentFrigocalories} onChange={e => setClientEquipmentFrigocalories(e.target.value)} />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Solicitar Turno</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowBookModal(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Escribir Reseña */}
        {showReviewModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
            <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '450px', padding: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>⭐ Calificar Servicio</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Tu calificación nos ayuda a mantener los más altos estándares de calidad.
              </p>
              
              <form onSubmit={handleClientReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '8px 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '2.5rem', color: star <= rating ? 'var(--warning)' : 'rgba(255,255,255,0.15)' }}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <div className="input-group">
                  <label>Comentario / Experiencia</label>
                  <textarea 
                    placeholder="Cuéntanos qué te pareció la puntualidad, prolijidad y trato del técnico..." 
                    className="input-field" 
                    rows="3" 
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>Enviar Calificación</button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowReviewModal(false); setReviewApptId(null); }}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ marginBottom: '8px' }}>¡Hola, {user?.name}!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Bienvenido a tu panel de control de Refricop.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.3rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.35)'
            }}>
              <Snowflake size={18} color="white" />
            </div>
            <span style={{ letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
              REFRI<span style={{ color: 'var(--accent-cyan)' }}>COP</span>
            </span>
          </div>
        </div>

        {/* Mini Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--warning)' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Turnos Solicitados</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{requestedCount}</p>
          </div>
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Visitas Confirmadas</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{confirmedCount}</p>
          </div>
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--success)' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Servicios Completados</h3>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{completedCount}</p>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones Rápidas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-panel client-action-card" onClick={() => setShowBookModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <PlusCircle color="var(--accent-cyan)" size={24} />
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>Solicitar Visita Técnica</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Agendar revisión de equipo</span>
              </div>
            </div>
            
            <Link to="/catalog" className="glass-panel client-action-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', textDecoration: 'none', color: 'inherit' }}>
              <Wrench color="var(--accent-blue)" size={24} />
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>Catálogo de Precios</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ver tarifas de reparaciones</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Listado de Turnos del Cliente */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity color="var(--accent-cyan)" size={20} />
            Mis Turnos y Reparaciones
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            {appointments.map(appt => (
              <div key={appt.id} className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', borderLeft: `4px solid ${appt.status === 'Solicitado' ? 'var(--warning)' : appt.status === 'Confirmado' ? 'var(--success)' : appt.status === 'En Curso' ? 'var(--accent-blue)' : 'var(--text-secondary)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Turno #{appt.id}</span>
                    <h3 style={{ fontSize: '1.1rem', marginTop: '2px', color: 'var(--text-primary)' }}>🛠️ {appt.notes}</h3>
                  </div>
                  <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                    background: appt.status === 'Solicitado' ? 'rgba(245, 158, 11, 0.15)' : 
                               appt.status === 'Confirmado' ? 'rgba(16, 185, 129, 0.15)' : 
                               appt.status === 'En Curso' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                    color: appt.status === 'Solicitado' ? 'var(--warning)' : 
                           appt.status === 'Confirmado' ? 'var(--success)' : 
                           appt.status === 'En Curso' ? 'var(--accent-blue)' : 'var(--text-secondary)'
                  }}>
                    {appt.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '12px 0 12px 0', flexWrap: 'wrap' }}>
                  <span>📅 Fecha: <strong>{new Date(appt.date).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs</strong></span>
                  <span>📍 Dirección registrada: {appt.clientAddressStr || appt.Client?.address}</span>
                  {appt.User && <span>👨‍🔧 Técnico: <strong>{appt.User.name}</strong></span>}
                </div>

                {(appt.equipmentBrand || appt.equipmentModel || appt.equipmentFrigocalories) && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.04)', padding: '8px 12px', borderRadius: '6px', display: 'flex', gap: '16px', margin: '0 0 16px 0', flexWrap: 'wrap', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                    {appt.equipmentBrand && <span>🏷️ Marca: <strong>{appt.equipmentBrand}</strong></span>}
                    {appt.equipmentModel && <span>📦 Modelo: <strong>{appt.equipmentModel}</strong></span>}
                    {appt.equipmentFrigocalories && <span>❄️ Frigorías: <strong>{appt.equipmentFrigocalories} frig.</strong></span>}
                  </div>
                )}

                {/* Acciones para Cliente */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {appt.status === 'Completado' && (
                    <button 
                      onClick={() => { setReviewApptId(appt.id); setShowReviewModal(true); }}
                      className="btn-primary" 
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', background: 'var(--warning)', borderColor: 'var(--warning)', color: 'black', fontWeight: 'bold' }}
                    >
                      ★ Calificar Servicio / Dejar Reseña
                    </button>
                  )}
                  {appt.status === 'Solicitado' && (
                    <button 
                      onClick={async () => {
                        if (window.confirm("¿Seguro que deseas cancelar esta solicitud de turno?")) {
                          try {
                            await api.put(`/appointments/${appt.id}`, { status: 'Cancelado' });
                            alert('Turno cancelado correctamente.');
                            const { data } = await api.get('/appointments');
                            setAppointments(data);
                          } catch (err) {
                            alert('Error al cancelar el turno.');
                          }
                        }
                      }}
                      className="btn-secondary" 
                      style={{ fontSize: '0.85rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                    >
                      Cancelar Solicitud
                    </button>
                  )}
                </div>
              </div>
            ))}

            {appointments.length === 0 && (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>
                No tienes turnos agendados. Haz clic en "Solicitar Visita Técnica" para comenzar.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER VISTA TÉCNICO ---
  if (isTechnician) {
    if (loadingTech) {
      return <div style={{ color: 'var(--text-secondary)', padding: '24px' }}>Cargando agenda técnica...</div>;
    }

    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <style>{`
          .quick-action-card {
            transition: all 0.2s ease-out;
          }
          .quick-action-card:hover {
            transform: scale(1.02);
            border-color: rgba(255,255,255,0.15) !important;
            background: rgba(255,255,255,0.04) !important;
          }
        `}</style>
        <h1 style={{ marginBottom: '8px' }}>Mi Agenda de Visitas</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Técnico asignado: <strong style={{ color: 'var(--accent-cyan)' }}>{user?.name}</strong>
        </p>

        {showOrderModal && selectedAppt && (
          <div className="glass-panel animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--success)', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Reporte de Cierre - Turno #{selectedAppt.id}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Cliente: {selectedAppt.clientNameStr || selectedAppt.Client?.name}
            </p>

            <form onSubmit={handleSaveOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label>Tipo de Equipo</label>
                  <select className="input-field" value={equipmentType} onChange={e => setEquipmentType(e.target.value)} required>
                    <option value="Aire Split">Aire Split</option>
                    <option value="Aire Ventana">Aire Ventana</option>
                    <option value="Lavarropas Frontal">Lavarropas Frontal</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Marca</label>
                  <input type="text" placeholder="Ej: LG, Samsung" className="input-field" value={equipmentBrand} onChange={e => setEquipmentBrand(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label>Diagnóstico de la Reparación</label>
                <textarea placeholder="Explica detalladamente la intervención..." className="input-field" rows="2" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required></textarea>
              </div>

              {/* Repuestos del Catálogo */}
              <div className="input-group">
                <label style={{ fontWeight: 'bold' }}>Repuestos / Servicios Aplicados</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <select className="input-field" style={{ flex: 1 }} value={currentItemId} onChange={e => setCurrentItemId(e.target.value)}>
                    <option value="">-- Añadir desde Catálogo --</option>
                    {catalogItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name} (${parseFloat(item.defaultPrice).toLocaleString()})</option>
                    ))}
                  </select>
                  <input type="number" min="1" className="input-field" style={{ width: '70px' }} value={currentQty} onChange={e => setCurrentQty(e.target.value)} />
                  <button type="button" className="btn-secondary" onClick={handleAddItem}>Añadir</button>
                </div>

                {selectedItems.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                    {selectedItems.map((item, index) => (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                        <span>{item.name} (x{item.quantity})</span>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>${(item.priceApplied * item.quantity).toLocaleString()}</span>
                          <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} onClick={() => handleRemoveItem(index)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fotos */}
              <div className="input-group">
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Evidencia Fotográfica</label>
                <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Camera size={16} />
                  Seleccionar Fotos
                  <input type="file" multiple accept="image/*" onChange={(e) => setFiles([...e.target.files])} style={{ display: 'none' }} />
                </label>
                {files.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {files.map((f, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-primary">Finalizar y Guardar Reporte</button>
                <button type="button" className="btn-secondary" onClick={() => setShowOrderModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {appointments.map(appt => (
            <div key={appt.id} className="glass-panel quick-action-card" style={{ borderLeft: `4px solid ${appt.status === 'Confirmado' ? 'var(--success)' : appt.status === 'En Curso' ? 'var(--accent-blue)' : 'var(--panel-border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Turno #{appt.id}</span>
                  <h3 style={{ fontSize: '1.1rem', marginTop: '2px' }}>{appt.clientNameStr || appt.Client?.name}</h3>
                </div>
                <span style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                  background: appt.status === 'Confirmado' ? 'rgba(16, 185, 129, 0.15)' : 
                             appt.status === 'En Curso' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                  color: appt.status === 'Confirmado' ? 'var(--success)' : 
                         appt.status === 'En Curso' ? 'var(--accent-blue)' : 'var(--text-secondary)'
                }}>
                  {appt.status}
                </span>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                📝 Falla reportada: <strong>{appt.notes}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                <a href={`tel:${appt.clientPhoneStr || appt.Client?.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', textDecoration: 'none' }}>
                  <Phone size={14} /> Llamar: {appt.clientPhoneStr || appt.Client?.phone}
                </a>
                
                {(appt.clientAddressStr || appt.Client?.address) && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.clientAddressStr || appt.Client?.address)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                    <MapPin size={14} /> Dirección: {appt.clientAddressStr || appt.Client?.address}
                  </a>
                )}
                
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} /> Pactado para: {new Date(appt.date).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs
                </span>
              </div>

              {/* Acciones Rápidas */}
              {appt.status !== 'Completado' && appt.status !== 'Cancelado' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {appt.status === 'Confirmado' && (
                    <button className="btn-primary" onClick={() => handleStartService(appt.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <CheckCircle size={14} /> Iniciar Servicio
                  </button>
                  )}
                  {appt.status === 'En Curso' && (
                    <button className="btn-primary" onClick={() => handleOpenCompleteModal(appt)} style={{ background: 'var(--success)', borderColor: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <Wrench size={14} /> Completar y Reportar
                    </button>
                  )}
                  <button className="btn-secondary" onClick={() => {
                    if (window.confirm("¿Seguro que deseas cancelar esta visita?")) {
                      api.put(`/appointments/${appt.id}`, { status: 'Cancelado' })
                        .then(() => api.get('/appointments').then(({ data }) => setAppointments(data)))
                        .catch(() => alert('Error al cancelar turno'));
                    }
                  }} style={{ fontSize: '0.85rem' }}>
                    Cancelar Visita
                  </button>
                </div>
              )}
            </div>
          ))}
          {appointments.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>No tienes visitas asignadas en tu agenda para hoy.</p>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER VISTA ADMINISTRADOR ---
  if (loadingAdmin) {
    return <div style={{ color: 'var(--text-secondary)', padding: '24px' }}>Cargando estadísticas...</div>;
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`
        .stat-card-hover:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 12px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.15) !important;
          border-color: var(--accent-blue) !important;
        }
        .quick-action-card {
          transition: all 0.2s ease-out;
        }
        .quick-action-card:hover {
          transform: scale(1.02);
          border-color: rgba(255,255,255,0.15) !important;
          background: rgba(255,255,255,0.04) !important;
        }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Bienvenido, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Panel ejecutivo y resumen general de operaciones - Refricop.</p>
        </div>

        {/* Banner de Marca en el Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.3rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.35)'
          }}>
            <Snowflake size={18} color="white" />
          </div>
          <span style={{ letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
            REFRI<span style={{ color: 'var(--accent-cyan)' }}>COP</span>
          </span>
        </div>
      </div>

      {/* Grid de Tarjetas de Estadísticas Rediseñadas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <StatCard 
          title="Órdenes Activas" 
          value={stats.activeWorksCount} 
          icon={<Wrench size={26} color="white" />} 
          color="var(--accent-blue)" 
          gradient="linear-gradient(135deg, rgba(59, 130, 246, 0.45) 0%, rgba(59, 130, 246, 0.05) 100%)"
          to="/works"
        />
        <StatCard 
          title="Turnos Hoy" 
          value={stats.appointmentsTodayCount} 
          icon={<Calendar size={26} color="white" />} 
          color="var(--accent-cyan)" 
          gradient="linear-gradient(135deg, rgba(6, 182, 212, 0.45) 0%, rgba(6, 182, 212, 0.05) 100%)"
          to="/appointments"
        />
        <StatCard 
          title="Clientes Registrados" 
          value={stats.registeredClientsCount} 
          icon={<Users size={26} color="white" />} 
          color="var(--success)" 
          gradient="linear-gradient(135deg, rgba(16, 185, 129, 0.45) 0%, rgba(16, 185, 129, 0.05) 100%)"
          to="/clients"
        />
        {user?.role === 'Admin' && (
          <StatCard 
            title="Facturación Histórica" 
            value={`$${stats.estimatedRevenue.toLocaleString()}`} 
            icon={<DollarSign size={26} color="white" />} 
            color="var(--warning)" 
            gradient="linear-gradient(135deg, rgba(245, 158, 11, 0.45) 0%, rgba(245, 158, 11, 0.05) 100%)"
            to="/finances"
          />
        )}
      </div>

      {/* Panel de Accesos Rápidos Premium */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accesos Rápidos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Link to="/appointments" className="glass-panel quick-action-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,0.05)' }}>
            <PlusCircle color="var(--accent-cyan)" size={20} />
            <div>
              <strong style={{ fontSize: '0.9rem', display: 'block' }}>Nuevo Turno</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Agendar visita técnica</span>
            </div>
          </Link>
          <Link to="/finances" className="glass-panel quick-action-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,0.05)' }}>
            <DollarSign color="var(--success)" size={20} />
            <div>
              <strong style={{ fontSize: '0.9rem', display: 'block' }}>Caja y Finanzas</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ver ingresos y gastos</span>
            </div>
          </Link>
          <Link to="/works" className="glass-panel quick-action-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Wrench color="var(--accent-blue)" size={20} />
            <div>
              <strong style={{ fontSize: '0.9rem', display: 'block' }}>Órdenes de Trabajo</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ver reparaciones activas</span>
            </div>
          </Link>
          <Link to="/catalog" className="glass-panel quick-action-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', textDecoration: 'none', color: 'inherit', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Users color="var(--warning)" size={20} />
            <div>
              <strong style={{ fontSize: '0.9rem', display: 'block' }}>Repuestos / Catálogo</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ver stock disponible</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Próximos Turnos */}
      <div className="glass-panel animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity color="var(--accent-cyan)" size={20} />
            Próximos Turnos Agendados
          </h2>
          <span style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
            Total: {stats.upcomingAppointments.length}
          </span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Síntomas / Detalle del Trabajo</th>
                <th>Técnico Asignado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {stats.upcomingAppointments.map(appt => (
                <tr key={appt.id}>
                  <td style={{ fontWeight: 500 }}>
                    {new Date(appt.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{appt.clientNameStr || appt.Client?.name || 'Cliente sin nombre'}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📞 {appt.clientPhoneStr || appt.Client?.phone || 'Sin tel'}</span>
                  </td>
                  <td>{appt.notes || 'Revisión técnica general'}</td>
                  <td style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>{appt.User?.name || 'Sin asignar'}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                      background: appt.status === 'Solicitado' ? 'rgba(239, 68, 68, 0.15)' : 
                                 appt.status === 'Confirmado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: appt.status === 'Solicitado' ? 'var(--danger)' : 
                             appt.status === 'Confirmado' ? 'var(--success)' : 'var(--accent-blue)' 
                    }}>
                      {appt.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.upcomingAppointments.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No hay próximos turnos agendados en la agenda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
