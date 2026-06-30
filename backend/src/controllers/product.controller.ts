import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Product from '../models/Product';

export const getAllProducts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const products = await Product.findAll({ where: { userId } });
    return res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const product = await Product.findOne({ where: { id, userId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, price, cost, tipo, defaultPieces, gcodeUrl, stlUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const product = await Product.create({
      userId,
      name,
      price: price || 0,
      cost: cost || 0,
      tipo: tipo || 'caja',
      defaultPieces: defaultPieces || [],
      gcodeUrl: gcodeUrl || null,
      stlUrl: stlUrl || null,
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, price, cost, tipo, defaultPieces, gcodeUrl, stlUrl } = req.body;

    const product = await Product.findOne({ where: { id, userId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.update({
      name: name !== undefined ? name : product.name,
      price: price !== undefined ? price : product.price,
      cost: cost !== undefined ? cost : product.cost,
      tipo: tipo !== undefined ? tipo : product.tipo,
      defaultPieces: defaultPieces !== undefined ? defaultPieces : product.defaultPieces,
      gcodeUrl: gcodeUrl !== undefined ? (gcodeUrl || null) : product.gcodeUrl,
      stlUrl: stlUrl !== undefined ? (stlUrl || null) : product.stlUrl,
    });

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const product = await Product.findOne({ where: { id, userId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
