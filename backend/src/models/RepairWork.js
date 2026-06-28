import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const RepairWork = sequelize.define('RepairWork', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  equipmentType: {
    type: DataTypes.ENUM('Aire Split', 'Aire Ventana', 'Lavarropas Frontal', 'Otro'),
    allowNull: false,
  },
  equipmentBrand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('En Progreso', 'Finalizado', 'Esperando Repuestos'),
    defaultValue: 'En Progreso',
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  }
}, {
  timestamps: true
});

export default RepairWork;
