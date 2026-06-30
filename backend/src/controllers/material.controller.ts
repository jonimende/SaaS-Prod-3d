import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Material from '../models/Material';

export const getAllMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const materials = await Material.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMaterialById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const material = await Material.findOne({ where: { id, userId } });
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    return res.status(200).json(material);
  } catch (error) {
    console.error('Error fetching material by id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, type, totalWeight, currentWeight, colorHex } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del material es requerido' });
    }

    if (!type) {
      return res.status(400).json({ error: 'El tipo de material es requerido' });
    }

    const material = await Material.create({
      userId,
      name,
      type: type || 'PLA',
      totalWeight: typeof totalWeight === 'number' ? totalWeight : 1000,
      currentWeight: typeof currentWeight === 'number' ? currentWeight : 1000,
      colorHex: colorHex || '#2ECC71',
    });

    return res.status(201).json(material);
  } catch (error) {
    console.error('Error creating material:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, type, totalWeight, currentWeight, colorHex } = req.body;

    const material = await Material.findOne({ where: { id, userId } });
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    await material.update({
      name: name !== undefined ? name : material.name,
      type: type !== undefined ? type : material.type,
      totalWeight: totalWeight !== undefined ? totalWeight : material.totalWeight,
      currentWeight: currentWeight !== undefined ? currentWeight : material.currentWeight,
      colorHex: colorHex !== undefined ? colorHex : material.colorHex,
    });

    return res.status(200).json(material);
  } catch (error) {
    console.error('Error updating material:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const material = await Material.findOne({ where: { id, userId } });
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    await material.destroy();
    return res.status(200).json({ message: 'Material eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting material:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const consumeMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'La cantidad a consumir debe ser un número positivo' });
    }

    const material = await Material.findOne({ where: { id, userId } });
    if (!material) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    if (material.currentWeight - amount < 0) {
      return res.status(400).json({ 
        error: `No hay suficiente material disponible. Peso actual: ${material.currentWeight}g, solicitado: ${amount}g` 
      });
    }

    await material.update({
      currentWeight: material.currentWeight - amount
    });

    return res.status(200).json(material);
  } catch (error) {
    console.error('Error consuming material:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
