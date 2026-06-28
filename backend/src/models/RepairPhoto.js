import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const RepairPhoto = sequelize.define('RepairPhoto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true
});

export default RepairPhoto;
