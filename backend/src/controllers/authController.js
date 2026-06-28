import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'Technician'; 

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente', userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.findAll({
      where: { role: 'Technician' },
      attributes: ['id', 'name', 'email']
    });
    res.status(200).json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener técnicos', error });
  }
};
