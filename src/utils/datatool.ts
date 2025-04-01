'use server'

import { execSync } from 'child_process';


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