require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const seed = async () => {
  try {
    console.log('🔗 Conectando a la base de datos...');
    
    // Limpiar base de datos
    console.log('🗑️  Limpiando base de datos...');
    await prisma.reservation.deleteMany({});
    await prisma.recurringReservation.deleteMany({});
    await prisma.holiday.deleteMany({});
    await prisma.examWeek.deleteMany({});
    await prisma.semester.deleteMany({});
    await prisma.lab.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('👥 Creando usuarios...');
    const users = await prisma.user.createMany({
      data: [
        {
          nombre: 'Admin',
          apellido: 'Usuario',
          email: 'admin@unraf.edu.ar',
          password: await bcrypt.hash('admin123', 10),
          role: 'Admin',
          isActive: true,
          telefono: '1234567890'
        },
        {
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@unraf.edu.ar',
          password: await bcrypt.hash('profesor123', 10),
          role: 'Profesor',
          isActive: true,
          telefono: '1234567890'
        },
        {
          nombre: 'María',
          apellido: 'González',
          email: 'maria@unraf.edu.ar',
          password: await bcrypt.hash('profesor123', 10),
          role: 'Profesor',
          isActive: true,
          telefono: '0987654321'
        },
        {
          nombre: 'Carlos',
          apellido: 'Rodríguez',
          email: 'carlos@unraf.edu.ar',
          password: await bcrypt.hash('profesor123', 10),
          role: 'Investigador',
          isActive: true,
          telefono: '1122334455'
        }
      ]
    });
    console.log(`✅ ${users.count} usuarios creados`);

    // Obtener usuarios creados
    const createdUsers = await prisma.user.findMany();

    console.log('🔬 Creando laboratorios...');
    const labs = await prisma.lab.createMany({
      data: [
        // CAMPUS E4 - Aulas 01-20
        ...Array.from({ length: 5 }, (_, i) => ({
          name: `Aula 0${i + 1}`,
          building: 'CAMPUS E4',
          floor: 'Piso 1',
          capacity: 60,
          equipment: ['Proyector']
        })),
        // Aula 06 A y B
        {
          name: 'Aula 06 A',
          building: 'CAMPUS E4',
          floor: 'Piso 1',
          capacity: 30,
          equipment: ['Proyector']
        },
        {
          name: 'Aula 06 B',
          building: 'CAMPUS E4',
          floor: 'Piso 1',
          capacity: 30,
          equipment: ['Proyector']
        },
        // Aulas 07-10
        ...Array.from({ length: 4 }, (_, i) => ({
          name: `Aula 0${i + 7}`,
          building: 'CAMPUS E4',
          floor: 'Piso 1',
          capacity: 60,
          equipment: ['Proyector']
        })),
        // Aulas 11-20
        ...Array.from({ length: 10 }, (_, i) => ({
          name: `Aula ${i + 11}`,
          building: 'CAMPUS E4',
          floor: 'Piso 2',
          capacity: 60,
          equipment: ['Proyector']
        })),

        // CAMPUS LAB
        {
          name: 'Lab. ECA',
          building: 'CAMPUS LAB',
          floor: 'Piso 1',
          capacity: 20,
          equipment: ['Computadoras', 'Proyector', 'Osciloscopio', 'Impresoras 3D', 'Generador de ondas']
        },
        {
          name: 'Aula Informatica',
          building: 'CAMPUS LAB',
          floor: 'Piso 1',
          capacity: 20,
          equipment: ['Proyector', 'Computadoras']
        },
        {
          name: 'Aula Islas Malvinas',
          building: 'CAMPUS LAB',
          floor: 'Piso 2',
          capacity: 30,
          equipment: ['Proyector']
        },
        {
          name: 'Sala de Reuniones Sur',
          building: 'CAMPUS LAB',
          floor: 'Piso 2',
          capacity: 10,
          equipment: ['Proyector']
        },

        // EDIFICIO 1 (Bv. Roca) - Aulas 01-15
        ...Array.from({ length: 2 }, (_, i) => ({
          name: `Aula 0${i + 1}`,
          building: 'Edificio 1 (Bv. Roca)',
          floor: 'Piso 1',
          capacity: 30,
          equipment: ['Proyector']
        })),
        // Aulas 03, 04, 05 con computadoras adicionales
        ...Array.from({ length: 3 }, (_, i) => ({
          name: `Aula 0${i + 3}`,
          building: 'Edificio 1 (Bv. Roca)',
          floor: 'Piso 1',
          capacity: 30,
          equipment: ['Proyector', 'Computadoras']
        })),
        // Aulas 06-15
        ...Array.from({ length: 10 }, (_, i) => ({
          name: `Aula ${i + 6}`,
          building: 'Edificio 1 (Bv. Roca)',
          floor: 'Piso 1',
          capacity: 30,
          equipment: ['Proyector']
        })),
        // Piso 2
        {
          name: 'Aula Posgrado',
          building: 'Edificio 1 (Bv. Roca)',
          floor: 'Piso 2',
          capacity: 30,
          equipment: ['Proyector']
        },
        {
          name: 'Terraza',
          building: 'Edificio 1 (Bv. Roca)',
          floor: 'Piso 2',
          capacity: 10,
          equipment: ['Proyector']
        },

        // RIVADAVIA - Aulas 01-06 y Salon de Musica
        ...Array.from({ length: 6 }, (_, i) => ({
          name: `Aula 0${i + 1}`,
          building: 'RIVADAVIA',
          floor: 'Piso 1',
          capacity: 25,
          equipment: ['Proyector']
        })),
        {
          name: 'Salon de Musica',
          building: 'RIVADAVIA',
          floor: 'Piso 1',
          capacity: 25,
          equipment: ['Proyector']
        }
      ]
    });
    console.log(`✅ ${labs.count} laboratorios creados`);

    // Obtener laboratorios creados
    const createdLabs = await prisma.lab.findMany();

    console.log('📅 Creando semestre actual...');
    const currentYear = new Date().getFullYear();
    const semester = await prisma.semester.create({
      data: {
        name: `${currentYear} - Segundo Semestre`,
        startDate: new Date(`${currentYear}-08-01`),
        endDate: new Date(`${currentYear}-12-20`),
        year: currentYear,
        isActive: true
      }
    });

    console.log('🏖️ Creando feriados...');
    await prisma.holiday.createMany({
      data: [
        {
          name: 'Día del Trabajador',
          date: new Date(`${currentYear}-05-01`),
          type: 'national',
          description: 'Feriado nacional'
        },
        {
          name: 'Día de la Independencia',
          date: new Date(`${currentYear}-07-09`),
          type: 'national',
          description: 'Feriado nacional'
        }
      ]
    });

    console.log('📚 Creando semanas de exámenes...');
    await prisma.examWeek.create({
      data: {
        name: 'Primer Parcial',
        startDate: new Date(`${currentYear}-09-20`),
        endDate: new Date(`${currentYear}-09-27`),
        semester: semester.id
      }
    });

    await prisma.examWeek.create({
      data: {
        name: 'Final',
        startDate: new Date(`${currentYear}-12-01`),
        endDate: new Date(`${currentYear}-12-15`),
        semester: semester.id
      }
    });

    console.log('\n✅ ¡Seed completado exitosamente!');
    console.log('\n📋 Datos de acceso:');
    console.log('═══════════════════════════════════════');
    console.log('🔑 Admin:');
    console.log('  Email: admin@unraf.edu.ar');
    console.log('  Pass:  admin123');
    console.log('\n👨‍🏫 Profesores:');
    console.log('  Email: juan@unraf.edu.ar');
    console.log('  Pass:  profesor123');
    console.log('  Email: maria@unraf.edu.ar');
    console.log('  Pass:  profesor123');
    console.log('\n🔬 Investigador:');
    console.log('  Email: carlos@unraf.edu.ar');
    console.log('  Pass:  profesor123');
    console.log('═══════════════════════════════════════\n');

    console.log('🎯 Ahora puedes:');
    console.log('1. Iniciar sesión como admin para aprobar usuarios');
    console.log('2. Usar las cuentas de profesor/inv. ya activadas');
    console.log('3. Crear nuevas reservas');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
