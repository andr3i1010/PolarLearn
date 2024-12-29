import Link from 'next/link';
import { signIn } from "@/utils/auth";
import GoogleLogin from '@/components/button/logInGoogle';
import GithubLogin from '@/components/button/loginGithub';
import Button1 from '@/components/button/Button1';
import { AuthError } from 'next-auth';

const SignInForm = () => {
    return (
        <div className="flex flex-col">
            <div className="flex flex-row items-center justify-center space-x-4">
                <form action={async () => {
                    "use server";
                    await signIn("google");
                }}>
                    <GoogleLogin />
                </form>
                <form action={async () => {
                    "use server";
                    await signIn("github");
                }}>
                    <GithubLogin />
                </form>
            </div>

            <div className="flex items-center my-4">
                <hr className="flex-grow border-neutral-600" />
                <span className="mx-4 text-gray-500 dark:text-gray-400">of</span>
                <hr className="flex-grow border-neutral-600" />
            </div>

            <form
                action={async (formData) => {
                    "use server";
                    const email = formData.get("email");
                    const password = formData.get("password");
                    if (email && password) {
                        try {
                            await signIn("credentials", {
                                email,
                                password,
                                redirectTo: "/home/start",
                            });
                        } catch (error) {
                            // The desired flow for successful sign in in all cases
                            // and unsuccessful sign in for OAuth providers will cause a `redirect`,
                            // and `redirect` is a throwing function, so we need to re-throw
                            // to allow the redirect to happen
                            // Source: https://github.com/vercel/next.js/issues/49298#issuecomment-1542055642
                            // Detect a `NEXT_REDIRECT` error and re-throw it
                            if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
                                throw error;
                            }
                            // Handle Auth.js errors
                            if (error instanceof AuthError) {
                                // TODO: Show on sign-in page

                                // return {
                                //     error:
                                //         error.type === 'CredentialsSignin'
                                //             ? 'Invalid credentials.'
                                //             : 'An error with Auth.js occurred.',
                                //     type: error.type,
                                // };
                            }
                            // An error boundary must exist to handle unknown errors
                            // TODO: Show on sign-in page
                            // return {
                            //     error: 'Something went wrong.',
                            //     type: 'UnknownError',
                            // };
                        }
                    }
                }}
            >
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
                        placeholder="••••••••"
                        className="bg-neutral-800 border text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 border-neutral-700 placeholder-gray-400 dark:text-white focus:border-blue-500"
                        required
                    />
                    <br />
                </div>

                <Button1 type="submit" text="Log In" className="w-full" />
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                    Heb je nog geen account?{" "}
                    <Link href="/sign-up" className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                        Maak er dan eentje!
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default SignInForm;
