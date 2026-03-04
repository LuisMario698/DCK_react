import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.usuarios_sistema.upsert({
    where: { email: 'admin@dck.local' },
    update: {},
    create: {
      nombre_usuario: 'admin',
      email: 'admin@dck.local',
      hash_contrasena: passwordHash,
      rol: 'administrador',
      estado: 'Activo',
    },
  });

  console.log('✅ Usuario admin creado:', admin.email);
  console.log('   Usuario: admin@dck.local');
  console.log('   Contraseña: admin123');
  console.log('   ⚠️  Cambia la contraseña después del primer inicio de sesión.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
