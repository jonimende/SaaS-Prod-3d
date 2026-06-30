import User from './User';
import Product from './Product';
import Order from './Order';
import OrderItem from './OrderItem';
import Piece from './Piece';
import Material from './Material';
import Printer from './Printer';
import Client from './Client';

// User <-> Product (1:N)
User.hasMany(Product, { foreignKey: 'userId', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Order (1:N)
User.hasMany(Order, { foreignKey: 'userId', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Material (1:N)
User.hasMany(Material, { foreignKey: 'userId', as: 'materials', onDelete: 'CASCADE' });
Material.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Printer (1:N)
User.hasMany(Printer, { foreignKey: 'userId', as: 'printers', onDelete: 'CASCADE' });
Printer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Client (1:N)
User.hasMany(Client, { foreignKey: 'userId', as: 'clients', onDelete: 'CASCADE' });
Client.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Order <-> OrderItem (1:N)
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Product <-> OrderItem (1:N)
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems', onDelete: 'SET NULL' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// OrderItem <-> Piece (1:N)
OrderItem.hasMany(Piece, { foreignKey: 'orderItemId', as: 'pieces', onDelete: 'CASCADE' });
Piece.belongsTo(OrderItem, { foreignKey: 'orderItemId', as: 'orderItem' });

export {
  User,
  Product,
  Order,
  OrderItem,
  Piece,
  Material,
  Printer,
  Client
};
