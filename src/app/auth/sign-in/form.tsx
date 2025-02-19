"use client"
import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import GoogleLogin from '@/components/button/logInGoogle';
import GithubLogin from '@/components/button/loginGithub';
import Button1 from '@/components/button/Button1';
import ClientToastNotifier from './ClientToastNotifier';
import { signInFormAction } from './signInForm.server';

export default function SignInForm() {
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		startTransition(async () => {
			const result = await signInFormAction(formData);
			if (result.redirectTo) {
				router.push(result.redirectTo);
			} else {
				router.replace(`${window.location.pathname}?error=1`);
			}
		});
	};

	return (
		<div className="relative">
			<ClientToastNotifier />
			<div className="flex flex-col">
				<div className="flex flex-row items-center justify-center space-x-4">
					<GoogleLogin />
					<GithubLogin />
				</div>

				<div className="flex items-center my-4">
					<hr className="flex-grow border-neutral-600" />
					<span className="mx-4 text-gray-500 dark:text-gray-400">of</span>
					<hr className="flex-grow border-neutral-600" />
				</div>

				<form onSubmit={handleSubmit}>
					<div>
						<label
							htmlFor="email"
							className="block mb-2 text-sm font-medium text-white"
						>
							E-mail
						</label>
						<input
							type="email"
							name="email"
							className="bg-neutral-800 border text-white rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500"
							placeholder="name@company.com"
							required
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block mb-2 text-sm font-medium text-white"
						>
							Wachtwoord
						</label>
						<input
							type="password"
							name="password"
							placeholder="••••••••"
							className="bg-neutral-800 border rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 text-white focus:border-blue-500"
							required
						/>
						<br />
					</div>

					<Button1 type="submit" text="Log In" className="w-full" />
					<p className="text-sm font-light text-gray-500 dark:text-gray-400">
						Heb je nog geen account?{" "}
						<Link
							href="/auth/sign-up"
							className="font-medium text-primary-600 hover:underline dark:text-primary-500"
						>
							<strong>Maak er dan eentje!</strong>
						</Link>
					</p>
				</form>
			</div>
		</div>
	);
}