import { Appointment, RepairWork, RepairItem, RepairPhoto, Client, User, CustomerQuery, ServiceCatalog, FinanceTransaction, Review, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

// --- Turnos (Nuevos Endpoints) ---

// POST: Cliente solicita un turno
export const bookAppointment = async (req, res) => {
  try {
    const { date, notes, clientName, clientPhone, clientAddress, latitude, longitude, technicianId, equipmentBrand, equipmentModel, equipmentFrigocalories } = req.body;
    
    const newAppointment = await Appointment.create({ 
      date, 
      notes, 
      clientNameStr: clientName, 
      clientPhoneStr: clientPhone, 
      clientAddressStr: clientAddress,
      latitude,
      longitude,
      technicianId: technicianId ? parseInt(technicianId) : null,
      status: technicianId ? 'Confirmado' : 'Solicitado',
      equipmentBrand,
      equipmentModel,
      equipmentFrigocalories
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('nueva_reserva', newAppointment);
    }
    
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: 'Error al reservar el turno', details: error.message });
  }
};

// PUT: Técnico confirma o edita un turno
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, clientId, date, notes, clientName, clientPhone, clientAddress, technicianId, equipmentBrand, equipmentModel, equipmentFrigocalories } = req.body;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ error: 'Turno no encontrado' });

    // Validar permisos para clientes
    if (req.user && req.user.role === 'Client') {
      if (appointment.clientId !== req.user.clientId) {
        return res.status(403).json({ error: 'No tienes permisos para modificar este turno' });
      }
      // Solo puede cambiar a cancelado o modificar la fecha/notas si todavía no está en curso/completado
      if (status !== undefined && status !== 'Cancelado') {
        return res.status(403).json({ error: 'No puedes cambiar el estado a este valor' });
      }
    }

    if (status !== undefined) appointment.status = status;
    if (clientId !== undefined) appointment.clientId = clientId;
    if (date !== undefined) appointment.date = date;
    if (notes !== undefined) appointment.notes = notes;
    if (clientName !== undefined) appointment.clientNameStr = clientName;
    if (clientPhone !== undefined) appointment.clientPhoneStr = clientPhone;
    if (clientAddress !== undefined) appointment.clientAddressStr = clientAddress;
    if (technicianId !== undefined) appointment.technicianId = technicianId ? parseInt(technicianId) : null;
    if (equipmentBrand !== undefined) appointment.equipmentBrand = equipmentBrand;
    if (equipmentModel !== undefined) appointment.equipmentModel = equipmentModel;
    if (equipmentFrigocalories !== undefined) appointment.equipmentFrigocalories = equipmentFrigocalories;

    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el turno', details: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return res.status(404).json({ error: 'Turno no encontrado' });

    // Validar permisos para clientes
    if (req.user && req.user.role === 'Client') {
      if (appointment.clientId !== req.user.clientId) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este turno' });
      }
    }

    // Borrar todas las órdenes de trabajo asociadas si existen
    const repairWorks = await RepairWork.findAll({ where: { appointmentId: id } });
    for (const repairWork of repairWorks) {
      await RepairPhoto.destroy({ where: { repairWorkId: repairWork.id } });
      await RepairItem.destroy({ where: { repairWorkId: repairWork.id } });
      await repairWork.destroy();
    }

    // Borrar reseñas vinculadas
    await Review.destroy({ where: { appointmentId: id } });

    await appointment.destroy();
    res.json({ message: 'Turno eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el turno', details: error.message });
  }
};

// PUT: Modificar costo y estado de una orden de trabajo
export const updateRepairWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, totalCost, diagnosis, equipmentType, equipmentBrand, equipmentModel, equipmentFrigocalories } = req.body;
    const repair = await RepairWork.findByPk(id);
    if (!repair) return res.status(404).json({ error: 'Orden de trabajo no encontrada' });

    if (status !== undefined) repair.status = status;
    if (totalCost !== undefined) repair.totalCost = parseFloat(totalCost) || 0;
    if (diagnosis !== undefined) repair.diagnosis = diagnosis;
    if (equipmentType !== undefined) repair.equipmentType = equipmentType;
    if (equipmentBrand !== undefined) repair.equipmentBrand = equipmentBrand;
    if (equipmentModel !== undefined) repair.equipmentModel = equipmentModel;
    if (equipmentFrigocalories !== undefined) repair.equipmentFrigocalories = equipmentFrigocalories;

    await repair.save();
    res.json(repair);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la orden de trabajo', details: error.message });
  }
};


export const createAppointment = async (req, res) => {
  try {
    const { date, notes, clientId, technicianId, equipmentBrand, equipmentModel, equipmentFrigocalories } = req.body;
    
    let finalClientId = clientId;
    let finalStatus = 'Confirmado';
    let finalTechnicianId = technicianId;

    if (req.user && req.user.role === 'Client') {
      finalClientId = req.user.clientId;
      finalStatus = 'Solicitado';
      finalTechnicianId = null;
    }

    const newAppointment = await Appointment.create({ 
      date, 
      notes, 
      clientId: finalClientId, 
      technicianId: finalTechnicianId, 
      status: finalStatus,
      equipmentBrand,
      equipmentModel,
      equipmentFrigocalories
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('nueva_reserva', newAppointment);
    }

    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el turno internamente', details: error.message });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const queryOptions = {
      include: [
        { model: Client, attributes: ['name', 'phone', 'address'] },
        { model: User, attributes: ['name'] }
      ],
      order: [['date', 'ASC']]
    };

    // Si el usuario autenticado es técnico, sólo retornamos sus turnos asignados
    if (req.user && req.user.role === 'Technician') {
      queryOptions.where = { technicianId: req.user.id };
    } else if (req.user && req.user.role === 'Client') {
      queryOptions.where = { clientId: req.user.clientId };
    }

    const appointments = await Appointment.findAll(queryOptions);
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos', details: error.message });
  }
};

// --- Sugerencias / Consultas ---
export const createQuery = async (req, res) => {
  try {
    const newQuery = await CustomerQuery.create(req.body);
    res.status(201).json(newQuery);
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar consulta', details: error.message });
  }
};

export const getQueries = async (req, res) => {
  try {
    const queries = await CustomerQuery.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(queries);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener consultas', details: error.message });
  }
};

// --- Trabajos / Órdenes ---
export const createRepairWork = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { appointmentId, equipmentType, equipmentBrand, equipmentModel, equipmentFrigocalories, diagnosis, status, items } = req.body;
    
    const repair = await RepairWork.create({
      appointmentId,
      equipmentType,
      equipmentBrand,
      equipmentModel,
      equipmentFrigocalories,
      diagnosis,
      status
    }, { transaction });

    let calcTotalCost = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        await RepairItem.create({
          quantity: item.quantity,
          priceApplied: item.priceApplied,
          repairWorkId: repair.id,
          serviceCatalogId: item.serviceCatalogId
        }, { transaction });

        // Update Stock
        if (item.serviceCatalogId) {
          const catItem = await ServiceCatalog.findByPk(item.serviceCatalogId, { transaction });
          if(catItem && catItem.category !== 'General') { // No descontar servicios o mano de obra gral
             catItem.stock = catItem.stock - item.quantity;
             await catItem.save({ transaction });
          }
        }

        calcTotalCost += (item.priceApplied * item.quantity);
      }
    }

    repair.totalCost = calcTotalCost;
    await repair.save({ transaction });
    await transaction.commit();
    res.status(201).json(repair);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: 'Error al crear la orden', details: error.message });
  }
};

export const getRepairWorks = async (req, res) => {
  try {
    const works = await RepairWork.findAll({
      include: [
        { 
          model: RepairItem,
          include: [{ model: ServiceCatalog }]
        },
        { model: RepairPhoto },
        { 
          model: Appointment, 
          include: [{ model: Client, attributes: ['name', 'address'] }] 
        }
      ]
    });
    res.status(200).json(works);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la orden de trabajo', details: error.message });
  }
};

export const uploadPhotos = async (req, res) => {
  try {
    const { repairWorkId } = req.body; 

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se subieron archivos' });
    }

    const savedPhotos = [];
    for (const file of req.files) {
      const photo = await RepairPhoto.create({
        url: `/uploads/${file.filename}`,
        repairWorkId,
      });
      savedPhotos.push(photo);
    }
    res.status(201).json({ message: 'Fotos subidas', photos: savedPhotos });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar fotografías', details: error.message });
  }
};

// --- Finanzas ---
export const getFinances = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const completedWorks = await RepairWork.findAll({
      where: { status: 'Finalizado' },
      attributes: ['totalCost', 'updatedAt', 'equipmentType']
    });

    const manualTransactions = await FinanceTransaction.findAll({
      order: [['date', 'DESC']]
    });

    let totalHistorico = 0;
    let totalMensual = 0;

    // Sumar órdenes de trabajo
    completedWorks.forEach(w => {
      const cost = parseFloat(w.totalCost) || 0;
      totalHistorico += cost;
      if(new Date(w.updatedAt) >= startOfMonth) {
        totalMensual += cost;
      }
    });

    // Sumar/restar movimientos de caja manuales
    manualTransactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      const val = t.type === 'Ingreso' ? amt : -amt;
      totalHistorico += val;
      if (new Date(t.date) >= startOfMonth) {
        totalMensual += val;
      }
    });

    res.status(200).json({ 
      totalHistorico, 
      totalMensual, 
      trabajosFinalizados: completedWorks.length,
      completedWorks,
      manualTransactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo contabilidad', details: error.message });
  }
};

export const getFinanceTransactions = async (req, res) => {
  try {
    const transactions = await FinanceTransaction.findAll({ order: [['date', 'DESC']] });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener movimientos de caja', details: error.message });
  }
};

export const createFinanceTransaction = async (req, res) => {
  try {
    const { description, amount, type, date } = req.body;
    const transaction = await FinanceTransaction.create({
      description,
      amount: parseFloat(amount) || 0,
      type,
      date: date ? new Date(date) : new Date()
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear movimiento de caja', details: error.message });
  }
};

export const updateFinanceTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, type, date } = req.body;
    const transaction = await FinanceTransaction.findByPk(id);
    if (!transaction) return res.status(404).json({ error: 'Movimiento no encontrado' });

    if (description !== undefined) transaction.description = description;
    if (amount !== undefined) transaction.amount = parseFloat(amount) || 0;
    if (type !== undefined) transaction.type = type;
    if (date !== undefined) transaction.date = new Date(date);

    await transaction.save();
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar movimiento de caja', details: error.message });
  }
};

export const deleteFinanceTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await FinanceTransaction.findByPk(id);
    if (!transaction) return res.status(404).json({ error: 'Movimiento no encontrado' });

    await transaction.destroy();
    res.status(200).json({ message: 'Movimiento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar movimiento de caja', details: error.message });
  }
};

// --- Estadísticas del Dashboard ---
export const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Órdenes Activas: en progreso o esperando repuestos
    const activeWorksCount = await RepairWork.count({
      where: {
        status: {
          [Op.in]: ['En Progreso', 'Esperando Repuestos']
        }
      }
    });

    // Turnos hoy
    const appointmentsTodayCount = await Appointment.count({
      where: {
        date: {
          [Op.between]: [todayStart, todayEnd]
        }
      }
    });

    // Clientes registrados
    const registeredClientsCount = await Client.count();

    // Ingresos estimados (ingresos de este mes)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const completedWorks = await RepairWork.findAll({
      where: { status: 'Finalizado' },
      attributes: ['totalCost', 'updatedAt']
    });

    let estimatedRevenue = 0;
    completedWorks.forEach(w => {
      if (new Date(w.updatedAt) >= startOfMonth) {
        estimatedRevenue += parseFloat(w.totalCost) || 0;
      }
    });

    // Próximos turnos (próximos 5 turnos solicitados, confirmados o en curso a partir de hoy)
    const upcomingAppointments = await Appointment.findAll({
      where: {
        status: {
          [Op.in]: ['Solicitado', 'Confirmado', 'En Curso']
        },
        date: {
          [Op.gte]: todayStart
        }
      },
      include: [
        { model: Client, attributes: ['name'] }
      ],
      order: [['date', 'ASC']],
      limit: 5
    });

    res.status(200).json({
      activeWorksCount,
      appointmentsTodayCount,
      registeredClientsCount,
      estimatedRevenue,
      upcomingAppointments
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas del dashboard', details: error.message });
  }
};
