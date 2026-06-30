import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ClientAttributes {
  id: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'phone' | 'email' | 'notes'> {}

class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  declare id: string;
  declare userId: string;
  declare name: string;
  declare phone: string | null;
  declare email: string | null;
  declare notes: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Client.init(
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
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'clients',
    timestamps: true,
  }
);

export default Client;
