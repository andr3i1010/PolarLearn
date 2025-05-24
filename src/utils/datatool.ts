'use server'

import { execSync } from 'child_process';

// Cache the git info at build time
let cachedGitInfo: string | null = null;

export async function gitInfo() {
  // Return cached info if available
  if (cachedGitInfo) {
    return cachedGitInfo;
  }

  try {
    if (process.env.SERVERLESS) {
      const response = await fetch(`https://api.github.com/repos/polarnl/polarlearn/commits/stable`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
        },
        // Use cache-first strategy
        cache: 'force-cache',
      });
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      const data = await response.json();
      // Cache the result
      cachedGitInfo = data.sha.slice(0, 7); // short commit hash
      return cachedGitInfo;
    }

    const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

    // Cache the result
    cachedGitInfo = `${gitCommit}@${gitBranch}`;
    return cachedGitInfo;
  } catch (error) {
    console.error('Fout bij het ophalen van git info:', error);
    return 'error';
  }
}