import express from 'express';
import { register, login, getTechnicians } from '../controllers/authController.js';
import { getClients, createClient } from '../controllers/clientController.js';
import { getCatalog, createCatalogItem, updateCatalogItem } from '../controllers/catalogController.js';
import { createAppointment, getAppointments, updateAppointment, bookAppointment, createQuery, getQueries, createRepairWork, getRepairWorks, uploadPhotos, getFinances, getDashboardStats, updateRepairWork, getFinanceTransactions, createFinanceTransaction, updateFinanceTransaction, deleteFinanceTransaction } from '../controllers/workController.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Autenticación
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/technicians', verifyToken, getTechnicians);

// Clientes (Públicos)
router.post('/appointments/book', bookAppointment);
router.post('/queries', createQuery);

// Clientes (Privados Técnicos)
router.get('/clients', verifyToken, getClients);
router.post('/clients', verifyToken, createClient);

// Catálogo
router.get('/catalog', verifyToken, getCatalog);
router.post('/catalog', verifyToken, verifyRole(['Admin']), createCatalogItem);
router.put('/catalog/:id', verifyToken, verifyRole(['Admin']), updateCatalogItem);

// Sugerencias Privado (Sólo leer)
router.get('/queries', verifyToken, getQueries);

// Turnos
router.get('/appointments', verifyToken, getAppointments);
router.post('/appointments', verifyToken, createAppointment);
router.put('/appointments/:id', verifyToken, updateAppointment);

// Obras y Finanzas
router.get('/works', verifyToken, getRepairWorks);
router.post('/works', verifyToken, createRepairWork);
router.put('/works/:id', verifyToken, updateRepairWork);

router.post('/works/photos', verifyToken, upload.array('photos', 5), uploadPhotos);

router.get('/finances', verifyToken, verifyRole(['Admin']), getFinances);
router.get('/finances/transactions', verifyToken, verifyRole(['Admin']), getFinanceTransactions);
router.post('/finances/transactions', verifyToken, verifyRole(['Admin']), createFinanceTransaction);
router.put('/finances/transactions/:id', verifyToken, verifyRole(['Admin']), updateFinanceTransaction);
router.delete('/finances/transactions/:id', verifyToken, verifyRole(['Admin']), deleteFinanceTransaction);

router.get('/dashboard/stats', verifyToken, getDashboardStats);

export default router;
