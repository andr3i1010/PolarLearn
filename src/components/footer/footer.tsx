'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeCommit } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { useEffect, useState } from 'react';

interface User {
  uuid: string;
  email: string;
  username: string;
  // Voeg meer gebruikersgegevens toe indien nodig
}

interface GitInfo {
  gitCommit: string;
  gitBranch: string;
}

export default function Footer() {
  const [user, setUser] = useState<User | null>(null);
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [loadingGit, setLoadingGit] = useState<boolean>(true);

  useEffect(() => {
    // Functie om gebruikersdata op te halen
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/userdata', {
          method: 'GET',
          credentials: 'include', // Zorg ervoor dat cookies worden meegezonden
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setError(null);
        } else {
          setError('Kon gebruikers-data niet krijgen. Log eerst in.');
          setUser(null);
        }
      } catch (error: any) {
        console.error('Fout bij het ophalen van gebruikers-data:', error);
        setError('Kon gebruikers-data niet krijgen. Log eerst in.');
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    // Functie om Git-informatie op te halen
    const fetchGitInfo = async () => {
      try {
        const response = await fetch('/api/git', {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setGitInfo(data);
        } else {
          setGitInfo(null);
        }
      } catch (error: any) {
        console.error('Fout bij het ophalen van git info:', error);
        setGitInfo(null);
      } finally {
        setLoadingGit(false);
      }
    };

    // Voer beide fetch functies uit
    fetchUserData();
    fetchGitInfo();
  }, []);

  return (
    <footer>
      <div>
        <section className="w-full bg-neutral-800 pt-8 pb-8 drop-shadow-xl font-[family-name:var(--font-geist-sans)]">
          <div className="flex items-center space-x-2">
            <div className="text-xl pt-0.5">
              <FontAwesomeIcon icon={faCodeCommit as IconProp} />
            </div>
            <p>
              {loadingGit
                ? 'Git informatie laden...'
                : gitInfo
                ? `${gitInfo.gitCommit}@${gitInfo.gitBranch}`
                : 'Kon Git informatie niet ophalen'}
            </p>
          </div>
          {process.env.NODE_ENV == "development" && loadingUser && <p className="mt-4 text-white">Gebruikers-data laden...</p>}
          {process.env.NODE_ENV == "development" && error && <p className="mt-4 text-red-500">{error}</p>}
          {process.env.NODE_ENV == "development" && user && (
            <div className="mt-4 text-white">
              <p>UUID: {user.uuid}</p>
              <p>Email: {user.email}</p>
              <p>Gebruikersnaam: {user.username}</p>
              {/* Voeg indien nodig meer gebruikersgegevens toe */}
            </div>
          )}
        </section>
      </div>
    </footer>
  );
}