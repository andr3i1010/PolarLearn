// src/app/api/git/route.ts

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

interface GitInfo {
  gitCommit: string;
  gitBranch: string;
}

export async function GET(request: Request) {
  try {
    const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

    const data: GitInfo = { gitCommit, gitBranch };
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fout bij het ophalen van git info:', error);
    return NextResponse.json({ error: 'Kon git informatie niet ophalen.' }, { status: 500 });
  }
}