import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Client from '../models/Client';

export const getAllClients = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const clients = await Client.findAll({ 
      where: { userId },
      order: [['name', 'ASC']]
    });
    return res.status(200).json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getClientById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const client = await Client.findOne({ where: { id, userId } });
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.status(200).json(client);
  } catch (error) {
    console.error('Error fetching client by id:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, phone, email, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio' });
    }

    const client = await Client.create({
      userId,
      name,
      phone: phone || null,
      email: email || null,
      notes: notes || null
    });

    return res.status(201).json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, phone, email, notes } = req.body;

    const client = await Client.findOne({ where: { id, userId } });
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await client.update({
      name: name !== undefined ? name : client.name,
      phone: phone !== undefined ? (phone || null) : client.phone,
      email: email !== undefined ? (email || null) : client.email,
      notes: notes !== undefined ? (notes || null) : client.notes
    });

    return res.status(200).json(client);
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const client = await Client.findOne({ where: { id, userId } });
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await client.destroy();
    return res.status(200).json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
