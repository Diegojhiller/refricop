import express from 'express';
import { register, login, getTechnicians } from '../controllers/authController.js';
import { getClients, createClient } from '../controllers/clientController.js';
import { getCatalog, createCatalogItem, updateCatalogItem } from '../controllers/catalogController.js';
import { createAppointment, getAppointments, updateAppointment, deleteAppointment, bookAppointment, createQuery, getQueries, createRepairWork, getRepairWorks, uploadPhotos, getFinances, getDashboardStats, updateRepairWork, getFinanceTransactions, createFinanceTransaction, updateFinanceTransaction, deleteFinanceTransaction } from '../controllers/workController.js';
import { createReview, getReviews, deleteReview } from '../controllers/reviewController.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Autenticación
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/technicians', verifyToken, verifyRole(['Admin', 'Technician']), getTechnicians);

// Clientes (Públicos / Landing)
router.post('/appointments/book', bookAppointment);
router.post('/queries', createQuery);
router.get('/reviews', getReviews); // Obtener reseñas públicas

// Clientes (Privados Técnicos / Admin)
router.get('/clients', verifyToken, verifyRole(['Admin', 'Technician']), getClients);
router.post('/clients', verifyToken, verifyRole(['Admin', 'Technician']), createClient);

// Catálogo (Ver todos, modificar solo Admin)
router.get('/catalog', verifyToken, getCatalog);
router.post('/catalog', verifyToken, verifyRole(['Admin']), createCatalogItem);
router.put('/catalog/:id', verifyToken, verifyRole(['Admin']), updateCatalogItem);

// Sugerencias Privado (Sólo leer)
router.get('/queries', verifyToken, verifyRole(['Admin', 'Technician']), getQueries);

// Turnos (Cualquier usuario logueado, se filtra internamente en el controlador)
router.get('/appointments', verifyToken, getAppointments);
router.post('/appointments', verifyToken, createAppointment);
router.put('/appointments/:id', verifyToken, updateAppointment);
router.delete('/appointments/:id', verifyToken, verifyRole(['Admin', 'Technician', 'Client']), deleteAppointment);

// Obras y fotos (Técnicos y Admin)
router.get('/works', verifyToken, verifyRole(['Admin', 'Technician']), getRepairWorks);
router.post('/works', verifyToken, verifyRole(['Admin', 'Technician']), createRepairWork);
router.put('/works/:id', verifyToken, verifyRole(['Admin', 'Technician']), updateRepairWork);
router.post('/works/photos', verifyToken, verifyRole(['Admin', 'Technician']), upload.array('photos', 5), uploadPhotos);

// Finanzas y Estadísticas (Sólo Admin)
router.get('/finances', verifyToken, verifyRole(['Admin']), getFinances);
router.get('/finances/transactions', verifyToken, verifyRole(['Admin']), getFinanceTransactions);
router.post('/finances/transactions', verifyToken, verifyRole(['Admin']), createFinanceTransaction);
router.put('/finances/transactions/:id', verifyToken, verifyRole(['Admin']), updateFinanceTransaction);
router.delete('/finances/transactions/:id', verifyToken, verifyRole(['Admin']), deleteFinanceTransaction);

router.get('/dashboard/stats', verifyToken, verifyRole(['Admin']), getDashboardStats);

// Reseñas Privadas (Alta sólo para clientes, baja sólo para Admin)
router.post('/reviews', verifyToken, verifyRole(['Client']), createReview);
router.delete('/reviews/:id', verifyToken, verifyRole(['Admin']), deleteReview);

export default router;
