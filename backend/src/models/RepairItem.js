import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const RepairItem = sequelize.define('RepairItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  priceApplied: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  }
}, {
  timestamps: false
});

export default RepairItem;
