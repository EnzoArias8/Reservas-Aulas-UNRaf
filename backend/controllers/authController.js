import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import db from "../models/db.js"

export const registerUser = async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  try {
    // Verificar si ya existe el usuario
    const [existing] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    await db.query(
      `INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)`,
      [nombre, email, hashedPassword]
    );

    // Obtener el nuevo usuario
    const [newUserResult] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    const newUser = newUserResult[0];

    // Generar token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Enviar respuesta
    res.status(201).json({
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
      },
      accessToken: token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error del servidor al registrar" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Correo y contraseña son obligatorios" });
  }

  try {
    // Buscar usuario
    const [users] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    const user = users[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Enviar respuesta
    res.status(200).json({
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
      },
      accessToken: token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error del servidor al iniciar sesión" });
  }
};

