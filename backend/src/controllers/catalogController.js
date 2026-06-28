import { ServiceCatalog } from '../models/index.js';

export const getCatalog = async (req, res) => {
  try {
    const items = await ServiceCatalog.findAll();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el catálogo' });
  }
};

export const createCatalogItem = async (req, res) => {
  try {
    const newItem = await ServiceCatalog.create(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ítem en el catálogo', details: error.message });
  }
};

export const updateCatalogItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ServiceCatalog.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: 'Ítem no encontrado' });
    }
    await item.update(req.body);
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el catálogo', details: error.message });
  }
};
