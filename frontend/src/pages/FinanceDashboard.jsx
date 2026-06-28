import React, { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { DollarSign, TrendingUp, Briefcase, Target, Edit3, Plus, Trash2 } from 'lucide-react';

const FinanceDashboard = () => {
  const [finances, setFinances] = useState({ totalHistorico: 0, totalMensual: 0, trabajosFinalizados: 0, completedWorks: [], manualTransactions: [] });
  const [loading, setLoading] = useState(true);
  const [monthlyGoal, setMonthlyGoal] = useState(() => Number(localStorage.getItem('refricop_monthly_goal')) || 1500000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalVal, setNewGoalVal] = useState('');

  // Estados para Modal de Transacciones Manuales (Crear / Editar)
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txForm, setTxForm] = useState({
    description: '',
    amount: '',
    type: 'Ingreso',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchFinances = async () => {
    try {
      const { data } = await api.get('/finances');
      setFinances(data);
    } catch (error) {
      console.error('Error cargando finanzas', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const handleSaveGoal = (e) => {
    e.preventDefault();
    const val = parseFloat(newGoalVal);
    if (val > 0) {
      setMonthlyGoal(val);
      localStorage.setItem('refricop_monthly_goal', val);
      setIsEditingGoal(false);
    }
  };

  // Guardar o Crear Transacción Manual
  const handleSaveTx = async (e) => {
    e.preventDefault();
    try {
      if (editingTx) {
        // Editar
        await api.put(`/finances/transactions/${editingTx.id}`, {
          description: txForm.description,
          amount: parseFloat(txForm.amount) || 0,
          type: txForm.type,
          date: new Date(txForm.date)
        });
      } else {
        // Crear
        await api.post('/finances/transactions', {
          description: txForm.description,
          amount: parseFloat(txForm.amount) || 0,
          type: txForm.type,
          date: new Date(txForm.date)
        });
      }
      setShowTxModal(false);
      setEditingTx(null);
      setTxForm({
        description: '',
        amount: '',
        type: 'Ingreso',
        date: new Date().toISOString().split('T')[0]
      });
      fetchFinances();
    } catch (error) {
      alert('Error al guardar movimiento de caja');
    }
  };

  // Abrir Modal para Crear
  const handleOpenCreateTx = () => {
    setEditingTx(null);
    setTxForm({
      description: '',
      amount: '',
      type: 'Ingreso',
      date: new Date().toISOString().split('T')[0]
    });
    setShowTxModal(true);
  };

  // Abrir Modal para Editar
  const handleOpenEditTx = (tx) => {
    setEditingTx(tx);
    setTxForm({
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      date: new Date(tx.date).toISOString().split('T')[0]
    });
    setShowTxModal(true);
  };

  // Eliminar Transacción Manual
  const handleDeleteTx = async (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este movimiento de caja?')) {
      try {
        await api.delete(`/finances/transactions/${id}`);
        fetchFinances();
      } catch (error) {
        alert('Error al eliminar movimiento de caja');
      }
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Calculando contabilidad...</div>;

  // Cálculos dinámicos
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  // Proyección de ingresos a fin de mes (Run-rate)
  const projectedRevenue = currentDay > 0 ? (finances.totalMensual / currentDay) * daysInMonth : 0;
  
  // Progreso de la meta
  const progressPercent = Math.min(100, Math.round((finances.totalMensual / monthlyGoal) * 100));

  // Desglose de Ingresos y Egresos de este mes
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let monthlyIngresos = 0;
  let monthlyEgresos = 0;

  if (finances.completedWorks) {
    finances.completedWorks.forEach(w => {
      if (new Date(w.updatedAt) >= startOfMonth) {
        monthlyIngresos += parseFloat(w.totalCost) || 0;
      }
    });
  }

  if (finances.manualTransactions) {
    finances.manualTransactions.forEach(t => {
      if (new Date(t.date) >= startOfMonth) {
        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'Ingreso') {
          monthlyIngresos += amt;
        } else {
          monthlyEgresos += amt;
        }
      }
    });
  }

  const monthlyNet = monthlyIngresos - monthlyEgresos;

  // Desglose de ingresos reales agrupados por tipo de equipo
  const breakdown = {};
  let totalWorkRevenue = 0;
  if (finances.completedWorks && finances.completedWorks.length > 0) {
    finances.completedWorks.forEach(w => {
      const type = w.equipmentType || 'General / Otro';
      const cost = parseFloat(w.totalCost) || 0;
      totalWorkRevenue += cost;
      if (!breakdown[type]) {
        breakdown[type] = { count: 0, total: 0 };
      }
      breakdown[type].count += 1;
      breakdown[type].total += cost;
    });
  }

  const breakdownList = Object.keys(breakdown).map(type => {
    const count = breakdown[type].count;
    const total = breakdown[type].total;
    const avg = count > 0 ? total / count : 0;
    const share = totalWorkRevenue > 0 ? (total / totalWorkRevenue) * 100 : 0;
    return {
      type,
      count,
      total,
      avg,
      share
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>Caja y Finanzas</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Métricas contables y proyecciones de facturación basadas en datos reales.</p>
        </div>

        {/* Sección Meta Mensual */}
        <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
          <Target color="var(--accent-cyan)" size={20} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Meta de Facturación</span>
            {isEditingGoal ? (
              <form onSubmit={handleSaveGoal} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <input 
                  type="number" 
                  className="input-field" 
                  style={{ padding: '4px 8px', fontSize: '0.85rem', width: '100px', height: '28px' }} 
                  placeholder={monthlyGoal}
                  value={newGoalVal}
                  onChange={e => setNewGoalVal(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="btn-primary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>Fijar</button>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <strong style={{ fontSize: '1.1rem' }}>${monthlyGoal.toLocaleString()}</strong>
                <button 
                  onClick={() => { setNewGoalVal(monthlyGoal); setIsEditingGoal(true); }} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  <Edit3 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <DollarSign color="var(--success)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Ingresos Brutos (Mes)</p>
            <h2 style={{ fontSize: '1.7rem', margin: 0 }}>${monthlyIngresos.toLocaleString()}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <DollarSign color="var(--danger)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Egresos / Gastos (Mes)</p>
            <h2 style={{ fontSize: '1.7rem', margin: 0, color: 'var(--danger)' }}>${monthlyEgresos.toLocaleString()}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <TrendingUp color="var(--accent-cyan)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Balance Neto (Mes)</p>
            <h2 style={{ fontSize: '1.7rem', margin: 0, color: 'var(--accent-cyan)' }}>${monthlyNet.toLocaleString()}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '12px' }}>
            <DollarSign color="var(--warning)" size={28} />
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Caja Histórica Total</p>
            <h2 style={{ fontSize: '1.7rem', margin: 0 }}>${finances.totalHistorico.toLocaleString()}</h2>
          </div>
        </div>

      </div>

      {/* Barra de Progreso de Meta de Facturación */}
      <div className="glass-panel" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '0.95rem' }}>Progreso de la Meta Mensual</strong>
          <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{progressPercent}% completado</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
          <div style={{
            background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)',
            width: `${progressPercent}%`,
            borderRadius: '6px',
            transition: 'width 0.5s ease-out'
          }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Actual: ${finances.totalMensual.toLocaleString()}</span>
          <span>Objetivo: ${monthlyGoal.toLocaleString()}</span>
        </div>
      </div>

      {/* Desglose de Servicios & Movimientos Manuales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Rendimiento por Categoría */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp color="var(--accent-cyan)" size={18} />
            Desglose de Facturación por Equipo
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.85rem' }}>
            Servicios completados agrupados por tipo de equipo.
          </p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th style={{ textAlign: 'center' }}>Servicios</th>
                  <th style={{ textAlign: 'right' }}>Participación / Total</th>
                </tr>
              </thead>
              <tbody>
                {breakdownList.map((item, idx) => (
                  <tr key={idx}>
                    <td data-label="Categoría">
                      <div style={{ fontWeight: 500 }}>{item.type}</div>
                      <div style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden', marginTop: '6px', width: '100px' }}>
                        <div style={{ background: 'var(--accent-cyan)', height: '100%', width: `${item.share}%` }} />
                      </div>
                    </td>
                    <td data-label="Servicios" style={{ textAlign: 'center' }}>{item.count}</td>
                    <td data-label="Participación / Total" style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'block' }}>${item.total.toLocaleString()}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{Math.round(item.share)}% del total</span>
                    </td>
                  </tr>
                ))}
                {breakdownList.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No hay órdenes completadas para desglosar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Movimientos de Caja Manuales */}
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <DollarSign color="var(--success)" size={18} />
              Ajustes y Movimientos de Caja
            </h2>
            <button className="btn-primary" onClick={handleOpenCreateTx} style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={14} /> Registrar
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.85rem' }}>
            Montos recibidos en efectivo o egresos por gastos de taller.
          </p>

          <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Detalle</th>
                  <th style={{ textAlign: 'right' }}>Monto</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {finances.manualTransactions && finances.manualTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td data-label="Fecha" style={{ fontSize: '0.8rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                    <td data-label="Detalle">
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{tx.description}</div>
                      <span style={{ 
                        fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                        background: tx.type === 'Ingreso' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: tx.type === 'Ingreso' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td data-label="Monto" style={{ 
                      textAlign: 'right', fontWeight: 'bold', 
                      color: tx.type === 'Ingreso' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {tx.type === 'Ingreso' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
                    </td>
                    <td data-label="Acciones" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEditTx(tx)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', padding: '2px' }}
                          title="Editar Movimiento"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTx(tx.id)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                          title="Eliminar Movimiento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!finances.manualTransactions || finances.manualTransactions.length === 0) && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No hay movimientos de caja registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal para Crear/Editar Movimiento de Caja */}
      {showTxModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px' }}>{editingTx ? 'Editar Movimiento' : 'Registrar Movimiento de Caja'}</h3>
            <form onSubmit={handleSaveTx} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="input-group">
                <label>Descripción / Detalle</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej: Cobro en efectivo service adicional"
                  value={txForm.description}
                  onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Monto ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  className="input-field" 
                  placeholder="0.00"
                  value={txForm.amount}
                  onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Tipo de Movimiento</label>
                <select 
                  className="input-field"
                  value={txForm.type}
                  onChange={e => setTxForm({ ...txForm, type: e.target.value })}
                >
                  <option value="Ingreso">Ingreso (+)</option>
                  <option value="Egreso">Egreso (-)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Fecha</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={txForm.date}
                  onChange={e => setTxForm({ ...txForm, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
                <button type="button" className="btn-secondary" onClick={() => setShowTxModal(false)} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDashboard;
