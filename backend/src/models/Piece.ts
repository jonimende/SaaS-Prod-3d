import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PieceAttributes {
  id: string;
  orderItemId: string;
  name: string;
  done: boolean;
  color: string | null;
  letras: string | null;
  nombre: string | null;
  logo: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PieceCreationAttributes
  extends Optional<PieceAttributes, 'id' | 'done' | 'color' | 'letras' | 'nombre' | 'logo'> {}

class Piece extends Model<PieceAttributes, PieceCreationAttributes> implements PieceAttributes {
  declare id: string;
  declare orderItemId: string;
  declare name: string;
  declare done: boolean;
  declare color: string | null;
  declare letras: string | null;
  declare nombre: string | null;
  declare logo: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Piece.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'order_items',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    letras: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'pieces',
    timestamps: true,
  }
);

export default Piece;
