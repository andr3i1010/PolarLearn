import { faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { gitInfo } from "@/utils/datatool";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import pkg from "@/../package.json";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";
import Image from "next/image";
import pl500 from "@/app/img/pl-500.svg";
import kofi from "@/app/img/kofi_symbol.webp";
import Link from "next/link";
import Button1 from "../button/Button1";

export default async function Footer() {
  const git = await gitInfo();
  const gitInfoData =
    git !== "error"
      ? {
        gitCommit: git.split("@")[0],
        gitBranch: git.split("@")[1],
      }
      : null;
  const user = await getUserFromSession(
    (await cookies()).get("polarlearn.session-id")?.value as string
  );
  return (
    <footer className="w-full bg-neutral-800 pt-4 pb-8 drop-shadow-xl font-[family-name:var(--font-geist-sans)] mt-auto max-w-screen-xl mx-auto flex flex-col md:flex-row px-4">
      <div>
        <div className="flex flex-row items-center space-x-4 w-min">
          <Image src={pl500} width={50} height={50} alt="PolarLearn logo" />
          <p className="text-3xl font-bold bg-gradient-to-r from-sky-500 to-sky-100 bg-clip-text text-transparent">
            PolarLearn
          </p>
        </div>
        <div className="mt-2 flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-8 w-full">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon
                icon={faCodeCommit as IconProp}
                className="size-5"
              />
              <p>{`${gitInfoData!.gitCommit}@${gitInfoData!.gitBranch}`}</p>
            </div>
            <p>PolarLearn versie: {pkg.version}</p>
            {process.env.NODE_ENV === "development" && user && (
              <div className="mt-2 text-white">
                <p>UUID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Gebruikersnaam: {user.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-start md:pl-8 pt-4 md:pt-2 space-y-4 md:space-y-0 md:space-x-4">
        <div className="w-full md:w-40 flex flex-col items-center">
          <h1 className="font-extrabold text-3xl">Socials</h1>
          <hr className="w-full border-t-2 border-neutral-600 my-1" />
          <div className="flex flex-col items-center space-y-2 mt-2">
            <a
              className="flex items-center text-xl text-neutral-500 hover:text-white transition"
              href="https://github.com/polarnl"
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              aria-label="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="30"
                height="30"
                viewBox="0 0 30 30"
              >
                <path
                  fill="#fff"
                  d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"
                ></path>
              </svg>
              <div className="w-2" />
              GitHub
            </a>
            <a
              className="flex items-center text-xl text-neutral-500 hover:text-white transition"
              href="https://discord.gg/TdYzXDzqSB"
              target="_blank"
              rel="noopener noreferrer"
              title="Discord"
              aria-label="Discord"
            >
              <svg
                width="30px"
                height="30px"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="512" cy="512" r="512" style={{ fill: "#5865f2" }} />
                <path
                  d="M689.43 349a422.21 422.21 0 0 0-104.22-32.32 1.58 1.58 0 0 0-1.68.79 294.11 294.11 0 0 0-13 26.66 389.78 389.78 0 0 0-117.05 0 269.75 269.75 0 0 0-13.18-26.66 1.64 1.64 0 0 0-1.68-.79A421 421 0 0 0 334.44 349a1.49 1.49 0 0 0-.69.59c-66.37 99.17-84.55 195.9-75.63 291.41a1.76 1.76 0 0 0 .67 1.2 424.58 424.58 0 0 0 127.85 64.63 1.66 1.66 0 0 0 1.8-.59 303.45 303.45 0 0 0 26.15-42.54 1.62 1.62 0 0 0-.89-2.25 279.6 279.6 0 0 1-39.94-19 1.64 1.64 0 0 1-.16-2.72c2.68-2 5.37-4.1 7.93-6.22a1.58 1.58 0 0 1 1.65-.22c83.79 38.26 174.51 38.26 257.31 0a1.58 1.58 0 0 1 1.68.2c2.56 2.11 5.25 4.23 8 6.24a1.64 1.64 0 0 1-.14 2.72 262.37 262.37 0 0 1-40 19 1.63 1.63 0 0 0-.87 2.28 340.72 340.72 0 0 0 26.13 42.52 1.62 1.62 0 0 0 1.8.61 423.17 423.17 0 0 0 128-64.63 1.64 1.64 0 0 0 .67-1.18c10.68-110.44-17.88-206.38-75.7-291.42a1.3 1.3 0 0 0-.63-.63zM427.09 582.85c-25.23 0-46-23.16-46-51.6s20.38-51.6 46-51.6c25.83 0 46.42 23.36 46 51.6.02 28.44-20.37 51.6-46 51.6zm170.13 0c-25.23 0-46-23.16-46-51.6s20.38-51.6 46-51.6c25.83 0 46.42 23.36 46 51.6.01 28.44-20.17 51.6-46 51.6z"
                  style={{ fill: "#fff" }}
                />
              </svg>
              <div className="w-2" />
              Discord
            </a>
            <a
              className="flex items-center text-xl text-neutral-500 hover:text-white transition"
              href="https://ko-fi.com/polarnl"
              target="_blank"
              rel="noopener noreferrer"
              title="Ko-Fi"
              aria-label="Ko-Fi"
            >
              <Image src={kofi} width={30} height={30} alt={"kofi"} />
              <div className="w-2" />
              Ko-Fi
            </a>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <h1 className="font-extrabold text-3xl">Snelle Links</h1>
          <hr className="w-full border-t-2 border-neutral-600 my-1" />
          <div className="flex flex-col items-center space-y-2 mt-2">
            <Link
              className="flex items-center text-md text-neutral-500 hover:text-white transition"
              href="/home/forum/tos"
            >
              Algemene voorwaarden
            </Link>
            <Link
              className="flex items-center text-md text-neutral-500 hover:text-white transition"
              href="/home/forum/privacy"
            >
              Privacy Policy
            </Link>
            <Link
              className="flex items-center text-md text-neutral-500 hover:text-white transition"
              href="/home/forum/faq"
            >
              Veelgestelde vragen
            </Link>
            <a
              className="flex items-center text-md text-neutral-500 hover:text-white transition"
              href="https://github.com/polarnl/PolarLearn/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bug melden
            </a>
            {user?.role === "admin" ? (
              <Button1 text="Admin" redirectTo="/admin" />
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
