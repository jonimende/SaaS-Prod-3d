import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Printer from '../models/Printer';

export const getAllPrinters = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const printers = await Printer.findAll({ 
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json(printers);
  } catch (error) {
    console.error('Error fetching printers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPrinterById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const printer = await Printer.findOne({ where: { id, userId } });
    if (!printer) {
      return res.status(404).json({ error: 'Impresora no encontrada' });
    }

    return res.status(200).json(printer);
  } catch (error) {
    console.error('Error fetching printer by id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPrinter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, model, status, maintenanceNotes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre de la impresora es requerido' });
    }

    if (!model) {
      return res.status(400).json({ error: 'El modelo de la impresora es requerido' });
    }

    const printer = await Printer.create({
      userId,
      name,
      model,
      status: status || 'Libre',
      maintenanceNotes: maintenanceNotes || null,
    });

    return res.status(201).json(printer);
  } catch (error) {
    console.error('Error creating printer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePrinter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, model, status, maintenanceNotes } = req.body;

    const printer = await Printer.findOne({ where: { id, userId } });
    if (!printer) {
      return res.status(404).json({ error: 'Impresora no encontrada' });
    }

    await printer.update({
      name: name !== undefined ? name : printer.name,
      model: model !== undefined ? model : printer.model,
      status: status !== undefined ? status : printer.status,
      maintenanceNotes: maintenanceNotes !== undefined ? (maintenanceNotes || null) : printer.maintenanceNotes,
    });

    return res.status(200).json(printer);
  } catch (error) {
    console.error('Error updating printer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePrinter = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const printer = await Printer.findOne({ where: { id, userId } });
    if (!printer) {
      return res.status(404).json({ error: 'Impresora no encontrada' });
    }

    await printer.destroy();
    return res.status(200).json({ message: 'Impresora eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting printer:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePrinterStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Libre', 'Imprimiendo', 'Mantenimiento'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Estado inválido. Los estados permitidos son: ${validStatuses.join(', ')}` 
      });
    }

    const printer = await Printer.findOne({ where: { id, userId } });
    if (!printer) {
      return res.status(404).json({ error: 'Impresora no encontrada' });
    }

    await printer.update({
      status: status as 'Libre' | 'Imprimiendo' | 'Mantenimiento'
    });

    return res.status(200).json(printer);
  } catch (error) {
    console.error('Error updating printer status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
