'use server'

import { execSync } from 'child_process';


export async function gitInfo() {
  try {
    if (process.env.SERVERLESS) {
      const response = await fetch(`https://api.github.com/repos/polarnl/polarlearn/commits/stable`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
        },
      });
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      const data = await response.json();
      return data.sha.slice(0, 7); // short commit hash
    }
    const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    return `${gitCommit}@${gitBranch}`;
  } catch (error) {
    console.error('Fout bij het ophalen van git info:', error);
    return 'error';
  }
}