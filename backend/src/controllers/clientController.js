import { Client, Appointment, RepairWork } from '../models/index.js';

export const getClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      include: [
        {
          model: Appointment,
          include: [RepairWork]
        }
      ]
    });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes', details: error.message });
  }
};

export const createClient = async (req, res) => {
  try {
    const newClient = await Client.create(req.body);
    res.status(201).json(newClient);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};
