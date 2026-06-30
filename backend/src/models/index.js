import { sequelize } from '../config/db.js';
import User from './User.js';
import Client from './Client.js';
import ServiceCatalog from './ServiceCatalog.js';
import Appointment from './Appointment.js';
import RepairWork from './RepairWork.js';
import RepairItem from './RepairItem.js';
import RepairPhoto from './RepairPhoto.js';
import CustomerQuery from './CustomerQuery.js';
import FinanceTransaction from './FinanceTransaction.js';
import Review from './Review.js';

// --- Relaciones ---
User.hasOne(Client, { foreignKey: 'userId' });
Client.belongsTo(User, { foreignKey: 'userId' });

Client.hasMany(Appointment, { foreignKey: 'clientId' });
Appointment.belongsTo(Client, { foreignKey: 'clientId' });

User.hasMany(Appointment, { foreignKey: 'technicianId' });
Appointment.belongsTo(User, { foreignKey: 'technicianId' });

Appointment.hasOne(RepairWork, { foreignKey: 'appointmentId' });
RepairWork.belongsTo(Appointment, { foreignKey: 'appointmentId' });

RepairWork.hasMany(RepairItem, { foreignKey: 'repairWorkId' });
RepairItem.belongsTo(RepairWork, { foreignKey: 'repairWorkId' });

ServiceCatalog.hasMany(RepairItem, { foreignKey: 'serviceCatalogId' });
RepairItem.belongsTo(ServiceCatalog, { foreignKey: 'serviceCatalogId' });

RepairWork.hasMany(RepairPhoto, { foreignKey: 'repairWorkId' });
RepairPhoto.belongsTo(RepairWork, { foreignKey: 'repairWorkId' });

Client.hasMany(Review, { foreignKey: 'clientId' });
Review.belongsTo(Client, { foreignKey: 'clientId' });

Appointment.hasOne(Review, { foreignKey: 'appointmentId' });
Review.belongsTo(Appointment, { foreignKey: 'appointmentId' });

export {
  sequelize,
  User,
  Client,
  ServiceCatalog,
  Appointment,
  RepairWork,
  RepairItem,
  RepairPhoto,
  CustomerQuery,
  FinanceTransaction,
  Review
};
