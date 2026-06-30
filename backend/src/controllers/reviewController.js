import { Review, Client, Appointment } from '../models/index.js';

// Crear una nueva reseña
export const createReview = async (req, res) => {
  try {
    const { rating, comment, appointmentId } = req.body;
    
    // Obtener el clientId desde el token
    const clientId = req.user.clientId;
    if (!clientId) {
      return res.status(400).json({ message: 'El usuario no está vinculado a un cliente válido.' });
    }

    // Opcional: Verificar que el turno pertenezca al cliente y esté completado
    if (appointmentId) {
      const appointment = await Appointment.findOne({ where: { id: appointmentId, clientId } });
      if (!appointment) {
        return res.status(404).json({ message: 'Turno no encontrado o no pertenece a este cliente.' });
      }
      if (appointment.status !== 'Completado') {
        return res.status(400).json({ message: 'Solo puedes calificar turnos completados.' });
      }
    }

    const newReview = await Review.create({
      rating,
      comment,
      clientId,
      appointmentId: appointmentId || null
    });

    res.status(201).json({ message: 'Reseña creada con éxito', review: newReview });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la reseña', error });
  }
};

// Obtener reseñas públicas para el Landing
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { showOnLanding: true },
      include: [
        {
          model: Client,
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reseñas', error });
  }
};

// Eliminar o moderar reseña (Sólo Admin)
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada.' });
    }

    await review.destroy();
    res.status(200).json({ message: 'Reseña eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la reseña', error });
  }
};
