import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProductAttributes {
  id: string;
  userId: string;
  name: string;
  price: number;
  cost: number;
  tipo: 'caja' | 'otro';
  defaultPieces: string[];
  gcodeUrl: string | null;
  stlUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'defaultPieces' | 'cost' | 'gcodeUrl' | 'stlUrl'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare price: number;
  declare cost: number;
  declare tipo: 'caja' | 'otro';
  declare defaultPieces: string[];
  declare gcodeUrl: string | null;
  declare stlUrl: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Product.init(
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
    price: {
      type: DataTypes.INTEGER, // Represents price as integer ARS
      allowNull: false,
      defaultValue: 0,
    },
    cost: {
      type: DataTypes.INTEGER, // Represents cost as integer ARS
      allowNull: false,
      defaultValue: 0,
    },
    tipo: {
      type: DataTypes.ENUM('caja', 'otro'),
      allowNull: false,
      defaultValue: 'caja',
    },
    defaultPieces: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    gcodeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stlUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
  }
);

export default Product;
