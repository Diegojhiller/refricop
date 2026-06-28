import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const FinanceTransaction = sequelize.define('FinanceTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('Ingreso', 'Egreso'),
    allowNull: false,
    defaultValue: 'Ingreso',
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  timestamps: true
});

export default FinanceTransaction;
