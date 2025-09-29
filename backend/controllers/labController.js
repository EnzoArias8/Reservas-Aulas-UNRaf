import pool from '../models/db.js';

export const listarLaboratorios = async (req, res) => {
  console.log('=== Iniciando listarLaboratorios ===');
  try {
    console.log('Conectando a base de datos...');
    const [labs] = await pool.query('SELECT id, nombre, edificio, piso, equipamiento, capacidad FROM laboratorios');
    console.log('Consulta exitosa. Registros encontrados:', labs.length);
    res.json(labs);
  } catch (err) {
    console.error('=== ERROR COMPLETO ===');
    console.error('Mensaje:', err.message);
    console.error('Código:', err.code);
    console.error('Estado SQL:', err.sqlState);
    console.error('=== FIN ERROR ===');
    res.status(500).json({ error: 'Error al obtener laboratorios.' });
  }
};

