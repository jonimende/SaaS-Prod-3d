import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OrderItemAttributes {
  id: string;
  orderId: string;
  productId: string | null;
  colorCaja: string | null;
  colorLetras: string | null;
  nombreGrabado: string | null;
  logo: string | null;
  enTapa: boolean;
  enBase: boolean;
  nota: string | null;
  done: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemCreationAttributes
  extends Optional<
    OrderItemAttributes,
    'id' | 'colorCaja' | 'colorLetras' | 'nombreGrabado' | 'logo' | 'enTapa' | 'enBase' | 'nota' | 'done'
  > {}

import Piece from './Piece';
import Product from './Product';

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  declare id: string;
  declare orderId: string;
  declare productId: string | null;
  declare colorCaja: string | null;
  declare colorLetras: string | null;
  declare nombreGrabado: string | null;
  declare logo: string | null;
  declare enTapa: boolean;
  declare enBase: boolean;
  declare nota: string | null;
  declare done: boolean;

  // Associations
  declare readonly pieces?: Piece[];
  declare readonly product?: Product;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    colorCaja: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    colorLetras: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nombreGrabado: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    enTapa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    enBase: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    nota: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: true,
  }
);

export default OrderItem;
