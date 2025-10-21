// scripts/seed.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.model';
import { Lab } from '../models/Lab.model';
import { Reservation } from '../models/Reservation.model';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lab_reservations';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  const users = [
    {
      nombre: 'Admin',
      apellido: 'Usuario',
      email: 'admin@unraf.edu.ar',
      password: 'admin123',
      role: 'Admin',
      isActive: true
    },
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@unraf.edu.ar',
      password: 'profesor123',
      role: 'Profesor',
      telefono: '1234567890',
      isActive: true
    },
    {
      nombre: 'María',
      apellido: 'González',
      email: 'maria@unraf.edu.ar',
      password: 'profesor123',
      role: 'Profesor',
      telefono: '0987654321',
      isActive: true
    },
    {
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: 'carlos@unraf.edu.ar',
      password: 'profesor123',
      role: 'Investigador',
      telefono: '1122334455',
      isActive: true
    }
  ];

  return await User.create(users);
};

const seedLabs = async () => {
  const labs = [
    {
      name: 'Laboratorio de Química 101',
      building: 'Edificio de Ciencias',
      floor: '1er Piso',
      capacity: 30,
      equipment: [
        'Microscopios',
        'Balanzas analíticas',
        'Mecheros Bunsen',
        'Material de vidrio',
        'Campanas extractoras'
      ],
      description: 'Laboratorio equipado para prácticas de química general y orgánica',
      isActive: true
    },
    {
      name: 'Laboratorio de Física 202',
      building: 'Edificio de Ingeniería',
      floor: '2do Piso',
      capacity: 25,
      equipment: [
        'Osciloscopios',
        'Generadores de señal',
        'Multímetros',
        'Fuentes de alimentación',
        'Kits de óptica'
      ],
      description: 'Laboratorio para experimentos de física aplicada y electrónica',
      isActive: true
    },
    {
      name: 'Laboratorio de Biología 103',
      building: 'Edificio de Ciencias de la Vida',
      floor: '1er Piso',
      capacity: 20,
      equipment: [
        'Microscopios ópticos',
        'Estufas de cultivo',
        'Centrífugas',
        'Autoclaves',
        'Cabinas de bioseguridad'
      ],
      description: 'Laboratorio especializado en biología molecular y microbiología',
      isActive: true
    },
    {
      name: 'Laboratorio de Informática 301',
      building: 'Edificio de Tecnología',
      floor: '3er Piso',
      capacity: 35,
      equipment: [
        'Computadoras de alto rendimiento',
        'Software especializado',
        'Servidores',
        'Equipos de red',
        'Proyectores'
      ],
      description: 'Laboratorio de computación con equipos de última generación',
      isActive: true
    },
    {
      name: 'Laboratorio de Electrónica 204',
      building: 'Edificio de Ingeniería',
      floor: '2do Piso',
      capacity: 20,
      equipment: [
        'Estaciones de soldadura',
        'Protoboards',
        'Componentes electrónicos',
        'Analizadores lógicos',
        'Impresora 3D'
      ],
      description: 'Laboratorio para desarrollo y prototipado electrónico',
      isActive: true
    }
  ];

  return await Lab.create(labs);
};

const seedReservations = async (users: any[], labs: any[]) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const reservations = [
    {
      userId: users[1]._id, // Juan Pérez (Estudiante)
      labId: labs[3]._id, // Lab de Informática
      date: tomorrow,
      timeSlot: '10:00 - 12:00',
      purpose: 'Práctica de programación en Java',
      attendees: 15,
      status: 'confirmed'
    },
    {
      userId: users[2]._id, // María González (Profesor)
      labId: labs[0]._id, // Lab de Química
      date: nextWeek,
      timeSlot: '14:00 - 16:00',
      purpose: 'Clase práctica de reacciones químicas',
      attendees: 25,
      status: 'confirmed'
    },
    {
      userId: users[3]._id, // Carlos Rodríguez (Estudiante)
      labId: labs[2]._id, // Lab de Biología
      date: tomorrow,
      timeSlot: '16:00 - 18:00',
      purpose: 'Observación de células al microscopio',
      attendees: 10,
      status: 'confirmed'
    },
    {
      userId: users[1]._id, // Juan Pérez
      labId: labs[4]._id, // Lab de Electrónica
      date: nextWeek,
      timeSlot: '10:00 - 12:00',
      purpose: 'Proyecto de circuitos digitales',
      attendees: 8,
      status: 'confirmed'
    }
  ];

  return await Reservation.create(reservations);
};

const seed = async () => {
  try {
    await connectDB();

    console.log('🗑️  Limpiando base de datos...');
    await User.deleteMany({});
    await Lab.deleteMany({});
    await Reservation.deleteMany({});

    console.log('👥 Creando usuarios...');
    const users = await seedUsers();
    console.log(`✅ ${users.length} usuarios creados`);

    console.log('🔬 Creando laboratorios...');
    const labs = await seedLabs();
    console.log(`✅ ${labs.length} laboratorios creados`);

    console.log('📅 Creando reservas...');
    const reservations = await seedReservations(users, labs);
    console.log(`✅ ${reservations.length} reservas creadas`);

    console.log('\n✅ ¡Seed completado exitosamente!');
    console.log('\n📋 Datos de acceso:');
    console.log('═══════════════════════════════════════');
    console.log('Admin:');
    console.log('  Email: admin@unraf.edu.ar');
    console.log('  Pass:  admin123');
    console.log('\nProfesor:');
    console.log('  Email: juan@unraf.edu.ar');
    console.log('  Pass:  profesor123');
    console.log('\nProfesor:');
    console.log('  Email: maria@unraf.edu.ar');
    console.log('  Pass:  profesor123');
    console.log('\nInvestigador:');
    console.log('  Email: carlos@unraf.edu.ar');
    console.log('  Pass:  profesor123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
};

seed();