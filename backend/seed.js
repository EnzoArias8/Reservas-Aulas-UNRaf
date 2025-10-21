require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar a MongoDB
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

// Esquemas
const UserSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  telefono: String,
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const LabSchema = new mongoose.Schema({
  name: String,
  building: String,
  floor: String,
  capacity: Number,
  equipment: [String],
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ReservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' },
  date: Date,
  timeSlot: String,
  purpose: String,
  attendees: Number,
  status: { type: String, default: 'confirmed' }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Lab = mongoose.model('Lab', LabSchema);
const Reservation = mongoose.model('Reservation', ReservationSchema);

// Seed
const seed = async () => {
  try {
    await connectDB();

    console.log('🗑️  Limpiando base de datos...');
    await User.deleteMany({});
    await Lab.deleteMany({});
    await Reservation.deleteMany({});

    console.log('👥 Creando usuarios...');
    const users = await User.create([
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
    ]);
    console.log(`✅ ${users.length} usuarios creados`);

    console.log('🔬 Creando laboratorios...');
    const labs = await Lab.create([
      {
        name: 'Laboratorio de Química 101',
        building: 'Edificio de Ciencias',
        floor: '1er Piso',
        capacity: 30,
        equipment: ['Microscopios', 'Balanzas analíticas', 'Mecheros Bunsen', 'Material de vidrio', 'Campanas extractoras'],
        description: 'Laboratorio equipado para prácticas de química general y orgánica',
        isActive: true
      },
      {
        name: 'Laboratorio de Física 202',
        building: 'Edificio de Ingeniería',
        floor: '2do Piso',
        capacity: 25,
        equipment: ['Osciloscopios', 'Generadores de señal', 'Multímetros', 'Fuentes de alimentación', 'Kits de óptica'],
        description: 'Laboratorio para experimentos de física aplicada y electrónica',
        isActive: true
      },
      {
        name: 'Laboratorio de Biología 103',
        building: 'Edificio de Ciencias de la Vida',
        floor: '1er Piso',
        capacity: 20,
        equipment: ['Microscopios ópticos', 'Estufas de cultivo', 'Centrífugas', 'Autoclaves', 'Cabinas de bioseguridad'],
        description: 'Laboratorio especializado en biología molecular y microbiología',
        isActive: true
      },
      {
        name: 'Laboratorio de Informática 301',
        building: 'Edificio de Tecnología',
        floor: '3er Piso',
        capacity: 35,
        equipment: ['Computadoras de alto rendimiento', 'Software especializado', 'Servidores', 'Equipos de red', 'Proyectores'],
        description: 'Laboratorio de computación con equipos de última generación',
        isActive: true
      },
      {
        name: 'Laboratorio de Electrónica 204',
        building: 'Edificio de Ingeniería',
        floor: '2do Piso',
        capacity: 20,
        equipment: ['Estaciones de soldadura', 'Protoboards', 'Componentes electrónicos', 'Analizadores lógicos', 'Impresora 3D'],
        description: 'Laboratorio para desarrollo y prototipado electrónico',
        isActive: true
      }
    ]);
    console.log(`✅ ${labs.length} laboratorios creados`);

    console.log('📅 Creando reservas...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const reservations = await Reservation.create([
      {
        userId: users[1]._id,
        labId: labs[3]._id,
        date: tomorrow,
        timeSlot: '10:00 - 12:00',
        purpose: 'Práctica de programación en Java',
        attendees: 15,
        status: 'confirmed'
      },
      {
        userId: users[2]._id,
        labId: labs[0]._id,
        date: nextWeek,
        timeSlot: '14:00 - 16:00',
        purpose: 'Clase práctica de reacciones químicas',
        attendees: 25,
        status: 'confirmed'
      },
      {
        userId: users[3]._id,
        labId: labs[2]._id,
        date: tomorrow,
        timeSlot: '16:00 - 18:00',
        purpose: 'Observación de células al microscopio',
        attendees: 10,
        status: 'confirmed'
      },
      {
        userId: users[1]._id,
        labId: labs[4]._id,
        date: nextWeek,
        timeSlot: '10:00 - 12:00',
        purpose: 'Proyecto de circuitos digitales',
        attendees: 8,
        status: 'confirmed'
      }
    ]);
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