import { faCodeCommit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { gitInfo, userInfo } from '@/utils/datatool';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import pkg from '@/../package.json';

export default async function Footer() {
    const git = await gitInfo();
    const user = await userInfo();

    let error: string | null = null;
    let loadingUser = false;

    if (user === null) {
        error = user;
    }

    const gitInfoData = git !== 'error' ? {
        gitCommit: git.split('@')[0],
        gitBranch: git.split('@')[1],
    } : null;
    const loadingGit = !gitInfoData;
    return (
        <footer>
            <div>
                <section className="w-full bg-neutral-800 pt-8 pb-8 drop-shadow-xl font-[family-name:var(--font-geist-sans)]">
                    <div className="flex flex-col space-x-2">
                        <div className='flex items-center space-x-2'>
                            <FontAwesomeIcon icon={faCodeCommit as IconProp} className='size-5' />
                            <p>
                                {loadingGit
                                    ? 'Git informatie laden...'
                                    : gitInfoData
                                        ? `${gitInfoData.gitCommit}@${gitInfoData.gitBranch}`
                                        : 'Kon Git informatie niet ophalen'}
                            </p>
                        </div>
                        <p>PolarLearn versie: {pkg.version}</p>
                    </div>
                    {process.env.NODE_ENV === "development" && (
                        <>
                            {loadingUser && <p className="mt-4 text-white">Gebruikers-data laden...</p>}
                            {error === 'Token not found' && <p className="mt-4 text-red-500">Kon gebruikersdata niet krijgen: Niet ingelogd</p>}
                            {error && error !== 'Token not found' && <p className="mt-4 text-red-500">{error}</p>}
                            {user && !error && (
                                <div className="mt-4 text-white">
                                    <p>UUID: {user.id}</p>
                                    <p>Email: {user.email}</p>
                                    <p>Gebruikersnaam: {user.name}</p>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </footer>
    );
}