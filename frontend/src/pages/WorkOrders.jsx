import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Camera, FilePlus2, CheckCircle2, Download, Trash2, Eye } from 'lucide-react';
import { generateQuotePDF } from '../utils/pdfGenerator';

const WorkOrders = () => {
  const [works, setWorks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Todas');

  // Estados para Detalle y Edición de Orden
  const [selectedWork, setSelectedWork] = useState(null);
  const [editCost, setEditCost] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Estados del Formulario
  const [appointments, setAppointments] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [appointmentId, setAppointmentId] = useState('');
  const [equipmentType, setEquipmentType] = useState('Aire Split');
  const [equipmentBrand, setEquipmentBrand] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [equipmentFrigocalories, setEquipmentFrigocalories] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [status, setStatus] = useState('En Progreso');
  const [selectedItems, setSelectedItems] = useState([]);

  // Estados para Edición Completa en Detalle
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editFrigocalories, setEditFrigocalories] = useState('');
  const [editDiagnosis, setEditDiagnosis] = useState('');

  // Estados auxiliares para agregar repuestos del catálogo
  const [currentItemId, setCurrentItemId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);

  const handleOpenDetail = (w) => {
    setSelectedWork(w);
    setEditCost(w.totalCost);
    setEditStatus(w.status);
    setEditBrand(w.equipmentBrand || '');
    setEditModel(w.equipmentModel || '');
    setEditFrigocalories(w.equipmentFrigocalories || '');
    setEditDiagnosis(w.diagnosis || '');
  };

  const handleSaveDetailChanges = async () => {
    try {
      const { data } = await api.put(`/works/${selectedWork.id}`, {
        status: editStatus,
        totalCost: parseFloat(editCost) || 0,
        equipmentBrand: editBrand,
        equipmentModel: editModel,
        equipmentFrigocalories: editFrigocalories,
        diagnosis: editDiagnosis
      });
      setSelectedWork({ ...selectedWork, ...data });
      fetchWorks();
      alert('Orden de trabajo actualizada con éxito.');
    } catch (err) {
      alert('Error al actualizar la orden de trabajo.');
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  useEffect(() => {
    if (showModal) {
      // Cargar turnos para asociar
      api.get('/appointments')
        .then(({ data }) => setAppointments(data))
        .catch(err => console.error('Error cargando turnos', err));

      // Cargar catálogo de repuestos
      api.get('/catalog')
        .then(({ data }) => setCatalogItems(data))
        .catch(err => console.error('Error cargando catálogo', err));
    }
  }, [showModal]);

  // Autocompletar datos del equipo desde el turno seleccionado
  useEffect(() => {
    if (appointmentId) {
      const appt = appointments.find(a => a.id === parseInt(appointmentId));
      if (appt) {
        if (appt.equipmentBrand) setEquipmentBrand(appt.equipmentBrand);
        if (appt.equipmentModel) setEquipmentModel(appt.equipmentModel);
        if (appt.equipmentFrigocalories) setEquipmentFrigocalories(appt.equipmentFrigocalories);
        
        // Auto-detectar tipo de equipo en base a notas
        const notes = (appt.notes || '').toLowerCase();
        if (notes.includes('split')) {
          setEquipmentType('Aire Split');
        } else if (notes.includes('ventana')) {
          setEquipmentType('Aire Ventana');
        } else if (notes.includes('lavarropas')) {
          setEquipmentType('Lavarropas Frontal');
        }
      }
    }
  }, [appointmentId, appointments]);

  const fetchWorks = async () => {
    try {
      const { data } = await api.get('/works');
      setWorks(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPDF = (w, isQuote) => {
    const clientData = w.Appointment?.Client ? w.Appointment.Client : {
      name: w.Appointment?.clientNameStr || 'Consumidor Final',
      address: w.Appointment?.clientAddressStr || 'Dato no provisto'
    };
    
    // Mapeo dinámico: lee la descripción real del ServiceCatalog cargada en RepairItem
    const orderFormat = {
      ...w,
      items: w.RepairItems?.length > 0 ? w.RepairItems.map(item => ({
        description: item.ServiceCatalog?.name || 'Repuesto / Mano de Obra general',
        quantity: item.quantity,
        priceApplied: item.priceApplied
      })) : [{
        description: 'Servicio general reportado',
        quantity: 1,
        priceApplied: w.totalCost
      }]
    };
    
    generateQuotePDF(orderFormat, clientData, isQuote);
  };

  const handleFilePreview = (e) => {
    setFiles([...e.target.files]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appointmentId) return alert('Por favor, selecciona un turno.');

    try {
      // 1. Crear la orden de trabajo
      const { data: newWork } = await api.post('/works', {
        appointmentId: parseInt(appointmentId),
        equipmentType,
        equipmentBrand,
        equipmentModel,
        equipmentFrigocalories,
        diagnosis,
        status,
        items: selectedItems.map(item => ({
          serviceCatalogId: item.serviceCatalogId,
          quantity: item.quantity,
          priceApplied: item.priceApplied
        }))
      });

      // 2. Subir fotos si se seleccionaron
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

      alert('Orden de trabajo guardada con éxito.');
      setShowModal(false);

      // Limpiar Formulario
      setAppointmentId('');
      setEquipmentType('Aire Split');
      setEquipmentBrand('');
      setEquipmentModel('');
      setEquipmentFrigocalories('');
      setDiagnosis('');
      setStatus('En Progreso');
      setSelectedItems([]);
      setFiles([]);

      // Recargar listado
      fetchWorks();
    } catch (err) {
      console.error(err);
      alert('Error guardando la orden de trabajo.');
    }
  };

  const filteredWorks = works.filter(w => {
    if (statusFilter === 'Todas') return true;
    return w.status === statusFilter;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Órdenes de Trabajo</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Mantenimientos de Aires y Lavarropas de Carga Frontal en curso.</p>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowModal(!showModal)}>
          <FilePlus2 size={18} />
          {showModal ? 'Ocultar Creador' : 'Crear Orden de Trabajo'}
        </button>
      </div>

      {/* Filtros rápidos por estado */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['Todas', 'En Progreso', 'Esperando Repuestos', 'Finalizado'].map(statusVal => (
          <button
            key={statusVal}
            type="button"
            onClick={() => setStatusFilter(statusVal)}
            className={statusFilter === statusVal ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
          >
            {statusVal}
          </button>
        ))}
      </div>

      {showModal && (
        <form onSubmit={handleSubmit} className="glass-panel animate-fade-in" style={{ marginBottom: '32px', borderLeft: '4px solid var(--accent-cyan)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Generar Nueva Orden de Trabajo</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="input-group">
              <label>Turno Relacionado</label>
              <select className="input-field" value={appointmentId} onChange={e => setAppointmentId(e.target.value)} required>
                <option value="">-- Elige un Turno --</option>
                {appointments.map(a => (
                  <option key={a.id} value={a.id}>
                    #{a.id} - {new Date(a.date).toLocaleDateString()} - {a.clientNameStr || a.Client?.name || 'Cliente'} ({a.notes})
                  </option>
                ))}
              </select>
            </div>

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
              <label>Marca del Equipo</label>
              <input type="text" placeholder="Ej: LG, Carrier, Samsung" className="input-field" value={equipmentBrand} onChange={e => setEquipmentBrand(e.target.value)} required />
            </div>

            <div className="input-group">
              <label>Modelo</label>
              <input type="text" placeholder="Ej: Premium 3000" className="input-field" value={equipmentModel} onChange={e => setEquipmentModel(e.target.value)} />
            </div>

            {(equipmentType.toLowerCase().includes('aire') || equipmentType.toLowerCase().includes('split') || equipmentType.toLowerCase().includes('ventana')) && (
              <div className="input-group">
                <label>Frigorías</label>
                <input type="text" placeholder="Ej: 3000" className="input-field" value={equipmentFrigocalories} onChange={e => setEquipmentFrigocalories(e.target.value)} />
              </div>
            )}

            <div className="input-group">
              <label>Estado de Trabajo</label>
              <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="En Progreso">En Progreso</option>
                <option value="Esperando Repuestos">Esperando Repuestos</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Diagnóstico Inicial</label>
            <textarea placeholder="Escribe los detalles observados del equipo..." className="input-field" rows="2" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required></textarea>
          </div>

          {/* Sección de Selección de Repuestos o Tareas */}
          <div className="input-group" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Repuestos & Mano de Obra</label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <select className="input-field" style={{ flex: 1, minWidth: '200px' }} value={currentItemId} onChange={e => setCurrentItemId(e.target.value)}>
                <option value="">-- Agregar Repuesto o Tarea del Catálogo --</option>
                {catalogItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (${parseFloat(item.defaultPrice).toLocaleString()})
                  </option>
                ))}
              </select>
              <input type="number" min="1" className="input-field" style={{ width: '80px' }} value={currentQty} onChange={e => setCurrentQty(e.target.value)} />
              <button type="button" className="btn-secondary" onClick={handleAddItem}>Añadir Item</button>
            </div>

            {selectedItems.length > 0 && (
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '8px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {selectedItems.map((item, index) => (
                    <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>{item.name} (x{item.quantity})</span>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>${(item.priceApplied * item.quantity).toLocaleString()}</span>
                        <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }} onClick={() => handleRemoveItem(index)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Subida de Fotos */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Subir Evidencia Fotográfica (Antes/Después)</label>
              <label className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Camera size={18} />
                Seleccionar Fotos
                <input type="file" multiple accept="image/*" onChange={handleFilePreview} style={{ display: 'none' }} />
              </label>
              
              {files.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {files.map((f, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} color="var(--success)" />
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', height: 'fit-content' }}>Guardar y Subir Orden</button>
          </div>
        </form>
      )}

      <div className="glass-panel animate-fade-in">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente (Turno)</th>
                <th>Equipo Intervenido</th>
                <th>Diagnóstico</th>
                <th>Evidencias</th>
                <th>Coste</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorks.map(w => (
                <tr key={w.id}>
                  <td data-label="ID" style={{ fontWeight: 600 }}>#{w.id}</td>
                  <td data-label="Cliente">{w.Appointment?.clientNameStr || w.Appointment?.Client?.name || 'Cliente'}</td>
                  <td data-label="Equipo">
                    <div>{w.equipmentType} - {w.equipmentBrand}</div>
                    {(w.equipmentModel || w.equipmentFrigocalories) && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        {w.equipmentModel && <span>{w.equipmentModel}</span>}
                        {w.equipmentFrigocalories && <span> ({w.equipmentFrigocalories} frig.)</span>}
                      </div>
                    )}
                  </td>
                  <td data-label="Diagnóstico">{w.diagnosis || '-'}</td>
                  <td data-label="Evidencias">{w.RepairPhotos?.length || 0} Fotos</td>
                  <td data-label="Costo" style={{ color: 'var(--success)', fontWeight: 'bold' }}>${parseFloat(w.totalCost).toLocaleString()}</td>
                  <td data-label="Estado">
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
                      background: w.status === 'Finalizado' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: w.status === 'Finalizado' ? 'var(--success)' : 'var(--accent-blue)'
                    }}>
                      {w.status}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleOpenDetail(w)} 
                        title="Ver Detalles"
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: '4px' }}>
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDownloadPDF(w, false)} 
                        title="Descargar Ticket PDF"
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', padding: '4px' }}>
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWorks.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>No hay reportes de órdenes generadas aún.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Orden de Trabajo */}
      {selectedWork && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.4rem' }}>Detalle de Orden de Trabajo #{selectedWork.id}</h3>
              <button className="btn-secondary" onClick={() => setSelectedWork(null)} style={{ padding: '6px 12px' }}>Cerrar</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cliente (Turno #{selectedWork.Appointment?.id || 'Sin Turno'})</p>
                <strong style={{ fontSize: '1.05rem' }}>{selectedWork.Appointment?.clientNameStr || selectedWork.Appointment?.Client?.name || 'Consumidor Final'}</strong>
                <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>📞 {selectedWork.Appointment?.clientPhoneStr || selectedWork.Appointment?.Client?.phone || 'Sin teléfono'}</p>
                <p style={{ fontSize: '0.9rem' }}>📍 {selectedWork.Appointment?.clientAddressStr || selectedWork.Appointment?.Client?.address || 'Sin dirección'}</p>
              </div>

              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Equipo & Diagnóstico</p>
                <strong>{selectedWork.equipmentType} - {selectedWork.equipmentBrand}</strong>
                {(selectedWork.equipmentModel || selectedWork.equipmentFrigocalories) && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {selectedWork.equipmentModel && <span>Modelo: <strong>{selectedWork.equipmentModel}</strong> </span>}
                    {selectedWork.equipmentFrigocalories && <span>Frigorías: <strong>{selectedWork.equipmentFrigocalories} frig.</strong></span>}
                  </div>
                )}
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                  "{selectedWork.diagnosis || 'Sin diagnóstico registrado.'}"
                </p>
              </div>
            </div>

            {/* Barra de progreso de etapas del servicio */}
            <div style={{ margin: '0 0 24px 0', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Progreso del Servicio</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: selectedWork.status === 'Finalizado' ? 'var(--success)' : 'var(--accent-blue)' }}>
                  {selectedWork.status}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginTop: '12px' }}>
                {/* Línea gris de fondo */}
                <div style={{ position: 'absolute', top: '10px', left: '10%', right: '10%', height: '3px', background: 'rgba(255,255,255,0.1)', zIndex: 1 }} />
                
                {/* Línea de color rellena */}
                <div style={{ 
                  position: 'absolute', top: '10px', left: '10%', 
                  width: selectedWork.status === 'Finalizado' ? '80%' : selectedWork.status === 'Esperando Repuestos' ? '40%' : '0%', 
                  height: '3px', background: 'var(--accent-cyan)', zIndex: 2, transition: 'width 0.3s ease' 
                }} />

                {/* Paso 1: En Progreso */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '30%' }}>
                  <div style={{ 
                    width: '22px', height: '22px', borderRadius: '50%', 
                    background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: 'white', fontWeight: 'bold',
                    boxShadow: '0 0 10px rgba(59,130,246,0.5)'
                  }}>1</div>
                  <span style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-primary)', fontWeight: 500 }}>En Progreso</span>
                </div>

                {/* Paso 2: Esperando Repuestos */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '30%' }}>
                  <div style={{ 
                    width: '22px', height: '22px', borderRadius: '50%', 
                    background: selectedWork.status === 'Esperando Repuestos' || selectedWork.status === 'Finalizado' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: selectedWork.status === 'Esperando Repuestos' || selectedWork.status === 'Finalizado' ? 'white' : 'var(--text-secondary)', fontWeight: 'bold',
                    boxShadow: selectedWork.status === 'Esperando Repuestos' || selectedWork.status === 'Finalizado' ? '0 0 10px rgba(6,182,212,0.5)' : 'none'
                  }}>2</div>
                  <span style={{ fontSize: '0.75rem', marginTop: '6px', color: selectedWork.status === 'Esperando Repuestos' || selectedWork.status === 'Finalizado' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Esperando Repuestos</span>
                </div>

                {/* Paso 3: Finalizado */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '30%' }}>
                  <div style={{ 
                    width: '22px', height: '22px', borderRadius: '50%', 
                    background: selectedWork.status === 'Finalizado' ? 'var(--success)' : 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: selectedWork.status === 'Finalizado' ? 'white' : 'var(--text-secondary)', fontWeight: 'bold',
                    boxShadow: selectedWork.status === 'Finalizado' ? '0 0 10px rgba(16,185,129,0.5)' : 'none'
                  }}>3</div>
                  <span style={{ fontSize: '0.75rem', marginTop: '6px', color: selectedWork.status === 'Finalizado' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Finalizado</span>
                </div>

              </div>
            </div>

            {/* Repuestos / Mano de Obra Aplicada */}
            <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Items & Costos</h4>
              {selectedWork.RepairItems && selectedWork.RepairItems.length > 0 ? (
                <table style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 12px' }}>Detalle</th>
                      <th style={{ padding: '6px 12px', textAlign: 'center' }}>Cant</th>
                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>Unitario</th>
                      <th style={{ padding: '6px 12px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWork.RepairItems.map((item, idx) => (
                      <tr key={idx} style={{ background: 'transparent' }}>
                        <td style={{ padding: '8px 12px', border: 'none' }}>{item.ServiceCatalog?.name || 'Repuesto/Servicio General'}</td>
                        <td style={{ padding: '8px 12px', border: 'none', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '8px 12px', border: 'none', textAlign: 'right' }}>${parseFloat(item.priceApplied).toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', border: 'none', textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>
                          ${(parseFloat(item.priceApplied) * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>No hay repuestos detallados registrados.</p>
              )}
            </div>

            {/* Evidencia Fotográfica */}
            {selectedWork.RepairPhotos && selectedWork.RepairPhotos.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Evidencias Fotográficas</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedWork.RepairPhotos.map((photo, idx) => {
                    const apiHost = `http://${window.location.hostname}:5000`;
                    const photoUrl = photo.url.startsWith('http') ? photo.url : `${import.meta.env.VITE_API_URL || apiHost}${photo.url}`;
                    return (
                      <img 
                        key={idx} 
                        src={photoUrl} 
                        alt={`Evidencia ${idx + 1}`}
                        style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--panel-border)', cursor: 'pointer' }}
                        onClick={() => window.open(photoUrl, '_blank')}
                      />
                    );
                  })}
                </div>
              </div>
            )}

             {/* Edición Completa de Ficha de Equipo */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Ficha Técnica del Equipo e Informe</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Marca</label>
                  <input type="text" className="input-field" value={editBrand} onChange={e => setEditBrand(e.target.value)} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Modelo</label>
                  <input type="text" className="input-field" value={editModel} onChange={e => setEditModel(e.target.value)} />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label>Frigorías</label>
                  <input type="text" className="input-field" value={editFrigocalories} onChange={e => setEditFrigocalories(e.target.value)} />
                </div>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Diagnóstico / Informe del Técnico</label>
                <textarea className="input-field" rows="2" value={editDiagnosis} onChange={e => setEditDiagnosis(e.target.value)}></textarea>
              </div>
            </div>

            {/* Edición de Costo y Estado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginBottom: '20px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label>Modificar Costo Total ($)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={editCost} 
                  onChange={e => setEditCost(e.target.value)} 
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label>Modificar Estado</label>
                <select 
                  className="input-field" 
                  value={editStatus} 
                  onChange={e => setEditStatus(e.target.value)}
                >
                  <option value="En Progreso">En Progreso</option>
                  <option value="Esperando Repuestos">Esperando Repuestos</option>
                  <option value="Finalizado">Finalizado</option>
                </select>
              </div>
            </div>

            {/* Acciones del Modal */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" onClick={handleSaveDetailChanges} style={{ flex: 2 }}>
                Guardar Modificaciones
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => handleDownloadPDF(selectedWork, false)} 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Download size={18} />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
