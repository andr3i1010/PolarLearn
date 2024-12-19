// components/SignInForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button1 from '@/components/button/Button1';

const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      // Redirect on success
      window.location.replace("/home/start")
    } else {
      // Handle error message
      setErrorMessage(result.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          E-mail
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-neutral-800 border text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500"
          placeholder="name@company.com"
          required
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
        >
          Wachtwoord
        </label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="bg-neutral-800 border text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500"
          required
        />
      </div>
      {errorMessage && (
        <p className="text-red-500 text-sm">{errorMessage}</p>
      )}
      <Button1 type='submit' text='Log In' className='w-full'/>
      <p className="text-sm font-light text-gray-500 dark:text-gray-400">
        Don’t have an account? <Link href="/sign-up" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign up</Link>
      </p>
    </form>
  );
};

export default SignInForm;
