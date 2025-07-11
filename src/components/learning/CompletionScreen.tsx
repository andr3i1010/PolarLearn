import { memo } from "react";
import Button1 from "@/components/button/Button1";
import { StreakCelebration, FreezeReward } from "./LearningOverlays";

interface CompletionScreenProps {
  streakStarted: boolean;
  freezeAwarded: boolean;
  freezeUsed: boolean;
  streakInfo: {
    currentStreak: number;
    isNewStreak: boolean;
  };
  onRestart: () => void;
}

const FreezeUsed = memo(({ streak }: { streak: number }) => {
  return (
    <div className="w-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500 rounded-xl p-6 my-4">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-white text-center">
          Bevriezer gebruikt!
        </h2>

        <div className="text-6xl font-bold text-purple-400 my-4 text-center">
          ❄️
        </div>

        <p className="text-center text-gray-300">
          Je hebt een bevriezer gebruikt om je reeks te behouden!
        </p>
      </div>
    </div>
  );
});

FreezeUsed.displayName = "FreezeUsed";

export const CompletionScreen = memo(({
  streakStarted,
  freezeAwarded,
  freezeUsed,
  streakInfo,
  onRestart,
}: CompletionScreenProps) => {
  return (
    <div className="text-center text-white p-4 overflow-y-auto max-h-full">
      <div className="font-bold text-xl mb-2">Gefeliciteerd!</div>
      <div>Je hebt de lijst helemaal af!</div>

      {/* Show freeze used message if a freeze was used */}
      {freezeUsed && <FreezeUsed streak={streakInfo.currentStreak} />}

      {/* Show freeze award if earned */}
      {freezeAwarded && <FreezeReward streak={streakInfo.currentStreak} />}

      {/* Show streak celebration directly in the completion screen if a streak started */}
      {streakStarted && (
        <StreakCelebration
          streak={streakInfo.currentStreak}
          isNewStreak={streakInfo.isNewStreak}
        />
      )}

      <div className="space-x-2 mt-4">
        <Button1
          onClick={onRestart}
          text="Opnieuw beginnen"
          className="mt-4"
        />
        <Button1
          redirectTo="/home/start"
          useClNav={true}
          text="Terug naar home"
          className="mt-4"
        />
      </div>
    </div>
  );
});

CompletionScreen.displayName = "CompletionScreen";
