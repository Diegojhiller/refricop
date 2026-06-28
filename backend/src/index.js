import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from './models/index.js';
import { connectDB } from './config/db.js';
import apiRoutes from './routes/api.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // En producción, ajusta esto a la URL de tu frontend
    methods: ["GET", "POST", "PUT"]
  }
});

// Guardar io en app para usarlo en controladores
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Cliente conectado a Socket.io:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); 

app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ message: 'Refricop API Server Running' });
});

app.get('/api/debug-db', (req, res) => {
  res.json({
    hasUri: !!process.env.MYSQL_ADDON_URI,
    addonHost: process.env.MYSQL_ADDON_HOST || 'not set',
    dbHost: process.env.DB_HOST || 'not set',
    nodeEnv: process.env.NODE_ENV || 'not set',
    appPort: process.env.PORT || 'not set'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}.`);
  await connectDB();
  
  try {
     await sequelize.sync({ alter: true });
     console.log('Modelos de BD sincronizados con éxito.');
  } catch(error) {
     console.error('Error sincronizando BD. Asegúrate de haberla creado.', error);
  }
});
