import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'Se requiere un token para autenticación' });
  }

  try {
    const extractedToken = token.split(' ')[1];
    const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ message: 'Token Invalido' });
  }
  return next();
};

export const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(401).json({ message: 'No tienes los permisos requeridos' });
    }
    next();
  };
};
