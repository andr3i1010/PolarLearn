import Image from "next/image";
import pl500 from "@/app/img/pl-500.svg";
import ToastProvider from "../../../components/toast/toast";
import { redirect } from 'next/navigation';
import { getUserFromSession } from '@/utils/auth/auth';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PolarLearn - Account aanmaken',
  description: 'Accountcreatiepagina van PolarLearn',
}

import SignUpForm from "./form";
import { prisma } from "@/utils/prisma";
export default async function SignUpPage() {

  // Check if registration is enabled
  const registrationConfig = await prisma.config.findFirst({
    where: {
      key: "registration_enabled",
    }
  });

  const isRegistrationEnabled = registrationConfig?.value === "true";

  const signUpPage = (
    <>
      <ToastProvider>
        <section className="bg-neutral-900 font-[family-name:var(--font-geist-sans)] py-5">
          <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0">
            <div className="flex items-center mb-6 text-2xl font-semibold text-white">
              <Image
                className="ml-4 px-3"
                src={pl500}
                alt="PolarLearn Logo"
                height="75"
                width="75"
              />
              <p className="text-center text-4xl font-extrabold leading-tight bg-gradient-to-r from-sky-400 to-sky-100 bg-clip-text text-transparent">
                PolarLearn
              </p>
            </div>
            <div className="w-full rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 bg-neutral-800 border-neutral-700">
              {isRegistrationEnabled ? (
                <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                  <h1 className="text-3xl font-bold">Account aanmaken</h1>
                  <SignUpForm />
                </div>
              ) : (
                <div className="p-6 space-y-4 md:space-y-6 sm:p-8 text-center">
                  <h1 className="text-3xl font-bold text-white">Registratie uitgeschakeld</h1>
                  <p className="text-gray-300">
                    Nieuwe registraties zijn momenteel uitgeschakeld.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </ToastProvider>
    </>
  );

  // Check if user is already authenticated
  const sessionCookie = (await cookies()).get('polarlearn.session-id');
  if (!sessionCookie?.value) {
    return signUpPage;
  }

  let user = await getUserFromSession(sessionCookie.value);
  if (sessionCookie && user?.loginAllowed) {
    return redirect('/home/start');
  } else {
    return signUpPage;
  }
}
