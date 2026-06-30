import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Solicitado', 'Confirmado', 'En Curso', 'Completado', 'Cancelado'),
    defaultValue: 'Solicitado',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  equipmentBrand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  equipmentModel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  equipmentFrigocalories: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  clientNameStr: { // Para turnos solicitados por web sin cliente registrado formalmente aun
    type: DataTypes.STRING,
    allowNull: true,
  },
  clientPhoneStr: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  clientAddressStr: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  }
}, {
  timestamps: true
});

export default Appointment;
