import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Order, OrderItem, Product } from '../models';

export const getFinancialSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Find all completed orders for this user, including their items and products
    const completedOrders = await Order.findAll({
      where: {
        userId,
        completed: true
      },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    let totalRevenue = 0;
    let totalCost = 0;

    for (const order of completedOrders) {
      if (order.items) {
        for (const item of order.items) {
          if (item.product) {
            totalRevenue += item.product.price || 0;
            totalCost += item.product.cost || 0;
          }
        }
      }
    }

    const netProfit = totalRevenue - totalCost;

    return res.status(200).json({
      totalRevenue,
      totalCost,
      netProfit
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
