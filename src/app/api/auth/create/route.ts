import { prisma } from '@/utils/prisma';
import crypto from 'crypto';
import argon2 from 'argon2';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { username, email, password } = await req.json();
  const fixedEmail = email as string;

  // Check if a user with the same email or username already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: fixedEmail },
        { name: username as string }
      ]
    }
  });
  if (existingUser) {
    return NextResponse.json({ error: 'Gebruiker bestaat al' }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID() as string,
        role: "default",
        name: username as string,
        email: email as string,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: new Date(),
        list_data: { recent_lists: [], liked_lists: [], created_lists: [], recent_subjects: [] },
        loginAllowed: true,
      }
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        provider: "credentials",
        providerAccountId: fixedEmail.toLowerCase(),
        token_type: "a2id_password_hash",
        access_token: await argon2.hash(password as string),
        type: "password",
      },
    });
    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      console.log("Error: ", error.stack)
      return NextResponse.json({ error: '🚨 Interne serverfout!' }, { status: 500 });
    }
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ message: "Slimpie, dit endpoint is niet bedoeld om zomaar in een browser te openen, schei uit!/j" }, { status: 405 });
}