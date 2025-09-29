import pool from '../models/db.js';

export const crearReserva = async (req, res) => {
  const { laboratorio_id, fecha, hora_inicio, hora_fin } = req.body;
  const usuario_id = req.usuarioId;

  try {
    const [solapada] = await pool.query(`
      SELECT * FROM reservas
      WHERE laboratorio_id = ? AND fecha = ?
        AND hora_inicio < ? AND hora_fin > ?
    `, [laboratorio_id, fecha, hora_fin, hora_inicio]);

    if (solapada.length > 0) {
      return res.status(400).json({ mensaje: 'Ya hay una reserva en ese horario.' });
    }

    await pool.query(`
      INSERT INTO reservas (usuario_id, laboratorio_id, fecha, hora_inicio, hora_fin)
      VALUES (?, ?, ?, ?, ?)
    `, [usuario_id, laboratorio_id, fecha, hora_inicio, hora_fin]);

    res.status(201).json({ mensaje: 'Reserva creada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear reserva.' });
  }
};

export const obtenerMisReservas = async (req, res) => {
  const usuario_id = req.usuarioId;
  try {
    const [resultado] = await pool.query(`
      SELECT r.id, l.nombre AS laboratorio, r.fecha, r.hora_inicio, r.hora_fin
      FROM reservas r
      JOIN laboratorios l ON r.laboratorio_id = l.id
      WHERE r.usuario_id = ?
      ORDER BY r.fecha DESC
    `, [usuario_id]);

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener reservas.' });
  }
};

export const cancelarReserva = async (req, res) => {
  const usuario_id = req.usuarioId;
  const { id } = req.params;

  try {
    const [resultado] = await pool.query(
      'DELETE FROM reservas WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada o no autorizada.' });
    }

    res.json({ mensaje: 'Reserva cancelada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error al cancelar reserva.' });
  }
};
