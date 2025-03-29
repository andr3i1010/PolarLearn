import { faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { gitInfo } from "@/utils/datatool";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import pkg from "@/../package.json";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth/auth";

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
    <footer>
      <div className="w-full bg-neutral-800 pt-8 pb-8 drop-shadow-xl font-[family-name:var(--font-geist-sans)]">
        <div className="flex flex-col space-x-2">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon
              icon={faCodeCommit as IconProp}
              className="size-5"
            />
            <p>{`${gitInfoData!.gitCommit}@${gitInfoData!.gitBranch}`}</p>
          </div>
          <p>PolarLearn versie: {pkg.version}</p>
        </div>
        {process.env.NODE_ENV === "development" && (
          <>
            {user && (
              <div className="mt-4 text-white">
                <p>UUID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Gebruikersnaam: {user.name}</p>
              </div>
            )}
          </>
        )}
      </div>
    </footer>
  );
}
