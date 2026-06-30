import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { PackagePlus, Tag } from 'lucide-react';

const CatalogManager = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'General', defaultPrice: '', description: '', stock: 0 });

  // Estados para Modal de Detalles y Solicitud de Stock
  const [selectedItem, setSelectedItem] = useState(null);
  const [replenishQty, setReplenishQty] = useState(1);
  const [replenishNotes, setReplenishNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [requests, setRequests] = useState(() => JSON.parse(localStorage.getItem('refricop_replenish_requests')) || []);

  const handleSendRequest = (e) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    setTimeout(() => {
      const newReq = {
        id: Date.now(),
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        qty: replenishQty,
        notes: replenishNotes || 'Ninguna',
        date: new Date().toISOString(),
        status: 'Pendiente',
        requester: user?.name || 'Técnico'
      };
      const updated = [newReq, ...requests];
      setRequests(updated);
      localStorage.setItem('refricop_replenish_requests', JSON.stringify(updated));

      alert(`¡Solicitud enviada!\n\nSe ha solicitado la cantidad de ${replenishQty} unidad(es) de "${selectedItem.name}" al proveedor/administrador.`);
      setIsSubmittingOrder(false);
      setReplenishQty(1);
      setReplenishNotes('');
      setSelectedItem(null);
    }, 500);
  };

  const handleApproveRequest = async (reqId, itemId, qty) => {
    try {
      const targetItem = items.find(i => i.id === itemId);
      if (targetItem) {
        const newStock = (targetItem.stock || 0) + qty;
        await api.put(`/catalog/${itemId}`, { stock: newStock });
        fetchCatalog();
      }
      const updated = requests.map(r => r.id === reqId ? { ...r, status: 'Aprobado' } : r);
      setRequests(updated);
      localStorage.setItem('refricop_replenish_requests', JSON.stringify(updated));
      alert('Solicitud de abastecimiento aprobada e inventario actualizado.');
    } catch (err) {
      alert('Error al actualizar el inventario.');
    }
  };

  const handleRejectRequest = (reqId) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'Rechazado' } : r);
    setRequests(updated);
    localStorage.setItem('refricop_replenish_requests', JSON.stringify(updated));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const { data } = await api.get('/catalog');
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/catalog', newItem);
      setShowModal(false);
      setNewItem({ name: '', category: 'General', defaultPrice: '', description: '', stock: 0 });
      fetchCatalog();
    } catch (e) {
      alert('Error creando ítem (Solo Admins pueden crear)');
    }
  };

  const outOfStockCount = items.filter(item => item.category !== 'General' && item.stock === 0).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Catálogo de Tareas y Repuestos</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Fijación de los costos estándar de taller.</p>
        </div>
        {user?.role === 'Admin' && (
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={18} />
            Agregar Ítem
          </button>
        )}
      </div>

      {outOfStockCount > 0 && (
        <div className="glass-panel animate-fade-in" style={{ borderLeft: '4px solid var(--danger)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.05)' }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <strong style={{ color: 'var(--danger)' }}>Alertas de Stock Crítico</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Tienes {outOfStockCount} repuestos sin stock disponible. Aprueba solicitudes de abastecimiento pendientes para reponer stock.
            </p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="glass-panel animate-fade-in" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <h3 style={{ marginBottom: '16px' }}>Nuevo Ítem del Catálogo</h3>
          <form style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flexDirection: 'column' }} onSubmit={handleAddItem}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="text" placeholder="Nombre (Ej: Cambio Capacitor)" className="input-field" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required style={{ flex: 1 }}/>
              <select className="input-field" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                <option value="Aire Split">Aire Split</option>
                <option value="Aire Ventana">Aire Ventana</option>
                <option value="Lavarropas Frontal">Lavarropas Frontal</option>
                <option value="General">General</option>
              </select>
              <input type="number" placeholder="Precio ($)" className="input-field" value={newItem.defaultPrice} onChange={e => setNewItem({...newItem, defaultPrice: e.target.value})} required style={{ width: '120px' }} />
              <input type="number" placeholder="Stock" min="0" className="input-field" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: e.target.value})} style={{ width: '100px' }} />
            </div>
            <textarea placeholder="Descripción del Trabajo o Repuesto..." className="input-field" rows="2" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})}></textarea>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary">Guardar al Cartel</button>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Lado Izquierdo: Catálogo */}
        <div style={{ flex: user?.role === 'Client' ? '1 1 100%' : 3, minWidth: '300px' }}>
          <div className="glass-panel animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', background: 'transparent', border: 'none', padding: 0 }}>
            {items.map(item => (
              <div key={item.id} className="glass-panel" style={{ position: 'relative', borderLeft: item.stock === 0 && item.category !== 'General' ? '3px solid var(--danger)' : '1px solid var(--panel-border)' }}>
                <Tag size={20} color="var(--accent-blue)" style={{ position: 'absolute', top: 24, right: 24 }} />
                {item.category !== 'General' && item.stock === 0 && (
                   <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger)', color: 'white', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                     Sin Stock
                   </div>
                )}
                {item.category !== 'General' && item.stock > 0 && item.stock < 5 && (
                   <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--warning)', color: 'black', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                     Stock Bajo ({item.stock})
                   </div>
                )}
                <h3 style={{ marginBottom: '8px' }}>{item.name}</h3>
                <span style={{ 
                  display: 'inline-block', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', 
                  color: 'var(--accent-blue)', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '12px' 
                }}>
                  {item.category}
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', minHeight: '40px' }}>
                  {item.description || 'Sin descripción detallada.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--success)' }}>${parseFloat(item.defaultPrice).toLocaleString()}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.category !== 'General' && <span style={{ fontSize: '0.8rem', color: item.stock === 0 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: item.stock === 0 ? 'bold' : 'normal' }}>Stock: {item.stock} u.</span>}
                    <button 
                      onClick={() => setSelectedItem(item)} 
                      className="btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>No hay ítems en el catálogo.</div>
            )}
          </div>
        </div>

        {/* Lado Derecho: Panel de Solicitudes */}
        {user?.role !== 'Client' && (
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div className="glass-panel" style={{ position: 'sticky', top: '24px' }}>
              <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                📋 Solicitudes de Stock
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
                Seguimiento de pedidos de reabastecimiento para técnicos.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                {requests.map(r => (
                  <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--panel-border)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{r.itemName}</strong>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                        background: r.status === 'Aprobado' ? 'rgba(16, 185, 129, 0.15)' : r.status === 'Rechazado' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: r.status === 'Aprobado' ? 'var(--success)' : r.status === 'Rechazado' ? 'var(--danger)' : 'var(--warning)',
                        fontWeight: 'bold'
                      }}>
                        {r.status}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '6px' }}>
                      Cantidad: <strong>{r.qty} u.</strong> • Solicitó: {r.requester}
                    </div>
                    {r.notes && (
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '6px', borderRadius: '4px' }}>
                        "{r.notes}"
                      </p>
                    )}

                    {user?.role === 'Admin' && r.status === 'Pendiente' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button 
                          onClick={() => handleApproveRequest(r.id, r.itemId, r.qty)} 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', flex: 1 }}
                        >
                          Aprobar
                        </button>
                        <button 
                          onClick={() => handleRejectRequest(r.id)} 
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {requests.length === 0 && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center', display: 'block', padding: '16px' }}>
                    No hay solicitudes de stock.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal de Detalles del Ítem del Catálogo */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.3rem' }}>Detalle de Catálogo</h3>
              <button className="btn-secondary" onClick={() => setSelectedItem(null)} style={{ padding: '6px 12px' }}>Cerrar</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ 
                display: 'inline-block', padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', 
                color: 'var(--accent-blue)', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold'
              }}>
                {selectedItem.category}
              </span>
              <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{selectedItem.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-line', marginBottom: '16px' }}>
                {selectedItem.description || 'Sin descripción detallada registrada.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--panel-border)', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Precio Estándar</span>
                  <strong style={{ fontSize: '1.3rem', color: 'var(--success)' }}>${parseFloat(selectedItem.defaultPrice).toLocaleString()}</strong>
                </div>
                {selectedItem.category !== 'General' && (
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Stock Disponible</span>
                    <strong style={{ fontSize: '1.3rem', color: selectedItem.stock < 5 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {selectedItem.stock} unidades
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Formulario de Solicitud de Stock */}
            {selectedItem.category !== 'General' && user?.role !== 'Client' && (
              <form onSubmit={handleSendRequest} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📦 Solicitar Abastecimiento o Detalles
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Envía una solicitud al administrador del taller para encargar más repuestos o consultar detalles específicos.
                </p>

                <div className="input-group">
                  <label>Cantidad a Solicitar</label>
                  <input 
                    type="number" 
                    min="1" 
                    className="input-field" 
                    value={replenishQty} 
                    onChange={e => setReplenishQty(Number(e.target.value))} 
                    required 
                  />
                </div>

                <div className="input-group">
                  <label>Notas / Especificaciones</label>
                  <textarea 
                    placeholder="Ej: Necesitamos capacitor de 35uF 450V para aire LG..." 
                    className="input-field" 
                    rows="3" 
                    value={replenishNotes} 
                    onChange={e => setReplenishNotes(e.target.value)}
                  ></textarea>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={isSubmittingOrder}>
                  {isSubmittingOrder ? 'Enviando...' : 'Enviar Solicitud al Administrador'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogManager;
