import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const ServiceCatalog = sequelize.define('ServiceCatalog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  defaultPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  category: {
    type: DataTypes.ENUM('Aire Split', 'Aire Ventana', 'Lavarropas Frontal', 'General'),
    allowNull: false,
    defaultValue: 'General'
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: false
});

export default ServiceCatalog;
