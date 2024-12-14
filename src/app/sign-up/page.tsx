"use client";
import Image from 'next/image';
import { useState } from 'react';
import pl500 from '@/app/img/pl-500.png';

export default function SignUp() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            setError(result.message);
        } else {
            window.location.href = result.redirectUrl || "/home/recent";
        }
    };

    return (
        <section className="bg-neutral-900 font-[family-name:var(--font-geist-sans)]">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                <div className="flex items-center mb-6 text-2xl font-semibold text-gray-900">
                    <Image className="ml-4 px-3" src={pl500} alt="PolarLearn Logo" height="75" width="75"/>
                    <p className="text-center text-4xl font-extrabold leading-tight bg-gradient-to-r from-sky-400 to-sky-100 bg-clip-text text-transparent">
                        PolarLearn
                    </p>
                </div>
                <div className="w-full rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 bg-neutral-800 border-gray-700">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                            Create your account
                        </h1>
                        {error && <p className="text-red-500">{error}</p>}
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
                                <input type="text" name="username" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-neutral-800 border text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500" placeholder="Username" required />
                            </div>
                            <div>
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">E-mail</label>
                                <input type="email" maxLength={255} name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-neutral-800 border text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500" placeholder="name@company.com" required />
                            </div>
                            <div>
                                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                <input type="password"maxLength={100} name="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="bg-neutral-800 border text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500" required />
                            </div>
                            <button type="submit" className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Sign Up</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}