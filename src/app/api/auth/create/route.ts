import { prisma } from '@/utils/prisma';
import crypto from 'crypto';
import argon2 from 'argon2';
import { NextResponse } from 'next/server';
// accounts: {
//   create: {
//   provider: "credentials",
//   providerAccountId: fixedEmail.toLowerCase(),

//   token_type: "a2id_password_hash",
//   access_token: await argon2.hash(password as string, { salt: pwdsalt }),
//   }
// },
export async function POST(req: Request) {
  const { username, email, password } = await req.json();
  //const pwdsalt = await crypto.randomBytes(32);
  const fixedEmail = email as string;
  try {
    // Create user with nested account creation (relation auto-assigns userId)
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID() as string,
        role: "default",
        name: username as string,
        email: email as string,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: new Date(),
        listData: { recent_lists: [], liked_lists: [], created_lists: [], recent_subjects: [] },
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
    }
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    //   return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    // } else {
    //   console.error(error);
    //   return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    // }
  }
}

export async function GET(req: Request) {
  return NextResponse.json({ message: "This is a JSON response for GET requests" }, { status: 405 });
}