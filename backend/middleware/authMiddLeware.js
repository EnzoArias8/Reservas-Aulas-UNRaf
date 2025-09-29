import jwt from 'jsonwebtoken';

export const autenticar = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader); // 👈

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("Token no proporcionado o formato incorrecto");
    return res.status(401).json({ mensaje: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];
  console.log("Token extraído:", token); // 👈
  console.log("JWT_SECRET usado:", process.env.JWT_SECRET); // 👈

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = decoded.id;
    console.log("Token verificado:", decoded); // 👈
    next();
  } catch (err) {
    console.error("Token inválido:", err.message); // 👈
    return res.status(401).json({ mensaje: 'Token inválido.' });
  }
};
