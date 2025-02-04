import { execSync } from 'child_process';
import { auth } from './auth';
import { account, user } from '@prisma/client';
import { prisma } from './prisma';

export async function checkDev(): Promise<boolean> {
  if (process.env.ALLOW_EVERYONE_ON_DEV === 'true') {
    return true;
  }
  const session = await auth();
  if (!session) {
    return false;
  }
  const user = session.user as user;
  if (user.role === 'dev') {
    return true;
  }
  return false;

}

export async function gitInfo() {
  try {
    const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    return `${gitCommit}@${gitBranch}`;
  } catch (error) {
    console.error('Fout bij het ophalen van git info:', error);
    return 'error';
  }
}

export async function userInfo(): Promise<user | null> {
  const session = await auth();
  if (!session) {
    return null;
  }
  const userrow = await prisma.user.findFirst({
    where: {
      email: session.user.email as string
    }
  })
  return userrow as user;
}