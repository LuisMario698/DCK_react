import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const user = await prisma.usuarios_sistema.findUnique({ where: { id: session.id } });
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.hash_contrasena);
  if (!valid) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.usuarios_sistema.update({
    where: { id: session.id },
    data: { hash_contrasena: newHash },
  });

  return NextResponse.json({ ok: true });
}
