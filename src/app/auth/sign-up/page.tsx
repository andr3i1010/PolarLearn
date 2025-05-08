import Image from "next/image";
import pl500 from "@/app/img/pl-500.svg";
import SignUpForm from "./form";
import ToastProvider from "../../../components/toast/toast";
export default async function SignUpPage() {
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
              <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                <h1 className="text-xl font-bold leading-tight tracking-tigh md:text-2xl text-white">
                  Maak een account aan
                </h1>
                <SignUpForm />
              </div>
            </div>
          </div>
        </section>
      </ToastProvider>
    </>
  );

  //   if (await auth()) {
  //     return redirect("/home/start");
  //   } else {
  //     return signUpPage;
  //   }
  return signUpPage;
}
