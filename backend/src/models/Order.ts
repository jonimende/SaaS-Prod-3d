import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OrderAttributes {
  id: string;
  userId: string;
  number: string | null;
  clientName: string;
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'number' | 'completed'> {}

import OrderItem from './OrderItem';

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  declare id: string;
  declare userId: string;
  declare number: string | null;
  declare clientName: string;
  declare completed: boolean;

  // Associations
  declare readonly items?: OrderItem[];

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Order.init(
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
    number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
  }
);

export default Order;
