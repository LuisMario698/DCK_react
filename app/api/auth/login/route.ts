import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    const usuario = await prisma.usuarios_sistema.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!usuario || usuario.estado !== 'Activo') {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    const passwordOk = await bcrypt.compare(password, usuario.hash_contrasena);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    await prisma.usuarios_sistema.update({
      where: { id: usuario.id },
      data: { ultimo_acceso: new Date() },
    });

    await createSession({
      id: usuario.id,
      nombre_usuario: usuario.nombre_usuario,
      email: usuario.email,
      rol: usuario.rol,
    });

    return NextResponse.json({ ok: true, nombre_usuario: usuario.nombre_usuario, rol: usuario.rol });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
