import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PrinterAttributes {
  id: string;
  userId: string;
  name: string;
  model: string;
  status: 'Libre' | 'Imprimiendo' | 'Mantenimiento';
  maintenanceNotes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PrinterCreationAttributes extends Optional<PrinterAttributes, 'id' | 'status' | 'maintenanceNotes'> {}

class Printer extends Model<PrinterAttributes, PrinterCreationAttributes> implements PrinterAttributes {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare model: string;
  declare status: 'Libre' | 'Imprimiendo' | 'Mantenimiento';
  declare maintenanceNotes: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Printer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Libre', 'Imprimiendo', 'Mantenimiento'),
      allowNull: false,
      defaultValue: 'Libre',
    },
    maintenanceNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'printers',
    timestamps: true,
  }
);

export default Printer;
