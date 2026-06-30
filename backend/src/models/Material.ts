import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MaterialAttributes {
  id: string;
  userId: string;
  name: string;
  type: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Resina' | 'Otro';
  totalWeight: number; // in grams
  currentWeight: number; // in grams
  colorHex: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id' | 'type' | 'totalWeight' | 'currentWeight' | 'colorHex'> {}

class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare type: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'Resina' | 'Otro';
  declare totalWeight: number;
  declare currentWeight: number;
  declare colorHex: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Material.init(
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
    type: {
      type: DataTypes.ENUM('PLA', 'PETG', 'ABS', 'TPU', 'Resina', 'Otro'),
      allowNull: false,
      defaultValue: 'PLA',
    },
    totalWeight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
    },
    currentWeight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
    },
    colorHex: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '#2ECC71',
    },
  },
  {
    sequelize,
    tableName: 'materials',
    timestamps: true,
  }
);

export default Material;
