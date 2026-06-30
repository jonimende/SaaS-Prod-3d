import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import sequelize from '../config/database';
import { Order, OrderItem, Piece, Product } from '../models';

// Helper function to update the overall completed status of an order
const updateOrderCompletion = async (orderId: string, transaction: any) => {
  const order = await Order.findByPk(orderId, {
    include: [{
      model: OrderItem,
      as: 'items',
      include: [{ model: Piece, as: 'pieces' }]
    }],
    transaction
  }) as any;

  if (!order) return;

  let allDone = true;

  if (!order.items || order.items.length === 0) {
    allDone = false;
  } else {
    for (const item of order.items) {
      if (item.pieces && item.pieces.length > 0) {
        // For items with pieces, all pieces must be done
        const piecesDone = item.pieces.every((p: any) => p.done);
        if (!piecesDone) {
          allDone = false;
          break;
        }
      } else {
        // For items without pieces, the item itself must be done
        if (!item.done) {
          allDone = false;
          break;
        }
      }
    }
  }

  await order.update({ completed: allDone }, { transaction });
};

// GET /api/orders - Fetches all orders for the current user
export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const orders = await Order.findAll({
      where: { userId },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [
          { model: Piece, as: 'pieces' },
          { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'tipo', 'cost', 'gcodeUrl', 'stlUrl'] }
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/orders - Creates an order and its items/pieces atomically
export const createOrder = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.userId!;
    const { number, clientName, products } = req.body;

    if (!clientName) {
      await t.rollback();
      return res.status(400).json({ error: 'Client name is required' });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Order must contain at least one product' });
    }

    // 1. Create Order
    const order = await Order.create({
      userId,
      number: number || null,
      clientName,
      completed: false
    }, { transaction: t });

    // 2. Iterate products in payload
    for (const item of products) {
      const product = await Product.findOne({
        where: { id: item.pid, userId },
        transaction: t
      });

      if (!product) {
        await t.rollback();
        return res.status(404).json({ error: `Product with id ${item.pid} not found in user's catalog` });
      }

      // 3. Create OrderItem
      const enTapa = item.enTapa !== undefined ? item.enTapa : true;
      const enBase = item.enBase !== undefined ? item.enBase : false;

      const orderItem = await OrderItem.create({
        orderId: order.id,
        productId: product.id,
        colorCaja: item.color || null,
        colorLetras: item.letras || null,
        nombreGrabado: item.nombre || null,
        logo: item.logo || null,
        enTapa,
        enBase,
        nota: item.nota || null,
        done: false
      }, { transaction: t });

      // 4. Generate Pieces if product has defaultPieces
      if (product.defaultPieces && product.defaultPieces.length > 0) {
        for (const pieceName of product.defaultPieces) {
          const isTapa = pieceName === 'Tapa';
          const isBase = pieceName === 'Base';
          const hasEngraving = (isTapa && enTapa) || (isBase && enBase);

          await Piece.create({
            orderItemId: orderItem.id,
            name: pieceName,
            done: false,
            color: orderItem.colorCaja, // Inherited box base color
            letras: hasEngraving ? orderItem.colorLetras : null,
            nombre: hasEngraving ? orderItem.nombreGrabado : null,
            logo: hasEngraving ? orderItem.logo : null,
          }, { transaction: t });
        }
      }
    }

    // Recalculate completion in case of edge cases, then commit
    await updateOrderCompletion(order.id, t);
    await t.commit();

    // Fetch the newly created order with nested relationships to return to client
    const freshOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [
          { model: Piece, as: 'pieces' },
          { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'tipo', 'cost', 'gcodeUrl', 'stlUrl'] }
        ]
      }]
    });

    return res.status(201).json(freshOrder);
  } catch (error) {
    await t.rollback();
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/orders/pieces/:id - Updates single piece completion status
export const updatePieceStatus = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { done } = req.body;

    if (done === undefined) {
      await t.rollback();
      return res.status(400).json({ error: 'done status is required' });
    }

    // Verify ownership of the piece: Piece -> OrderItem -> Order -> User
    const piece = await Piece.findOne({
      where: { id },
      include: [{
        model: OrderItem,
        as: 'orderItem',
        required: true,
        include: [{
          model: Order,
          as: 'order',
          where: { userId },
          required: true
        }]
      }],
      transaction: t
    });

    if (!piece) {
      await t.rollback();
      return res.status(404).json({ error: 'Piece not found or unauthorized' });
    }

    await piece.update({ done: !!done }, { transaction: t });

    // Update order completion
    const orderId = (piece as any).orderItem.orderId;
    await updateOrderCompletion(orderId, t);

    await t.commit();

    return res.status(200).json({ message: 'Piece status updated successfully', done: piece.done });
  } catch (error) {
    await t.rollback();
    console.error('Error updating piece status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/orders/items/:id - Updates single item completion status (for simple items without pieces)
export const updateOrderItemStatus = async (req: AuthRequest, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { done } = req.body;

    if (done === undefined) {
      await t.rollback();
      return res.status(400).json({ error: 'done status is required' });
    }

    // Verify ownership of the order item: OrderItem -> Order -> User
    const orderItem = await OrderItem.findOne({
      where: { id },
      include: [{
        model: Order,
        as: 'order',
        where: { userId },
        required: true
      }],
      transaction: t
    });

    if (!orderItem) {
      await t.rollback();
      return res.status(404).json({ error: 'Order item not found or unauthorized' });
    }

    await orderItem.update({ done: !!done }, { transaction: t });

    // Update order completion
    await updateOrderCompletion(orderItem.orderId, t);

    await t.commit();

    return res.status(200).json({ message: 'Order item status updated successfully', done: orderItem.done });
  } catch (error) {
    await t.rollback();
    console.error('Error updating order item status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/orders/:id - Deletes an order and cascades
export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const order = await Order.findOne({ where: { id, userId } });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.destroy(); // Cascade triggers will delete items and pieces
    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
