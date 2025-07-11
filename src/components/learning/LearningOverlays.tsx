import { memo, useState, useEffect } from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import Button1 from "@/components/button/Button1";

// Import Lottie dynamically to avoid SSR issues
const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});

// GedachtenOverlay component
export const GedachtenOverlay = memo(
  ({
    answer,
    onCorrect,
    onIncorrect,
  }: {
    answer: string;
    onCorrect: () => void;
    onIncorrect: () => void;
  }) => (
    <motion.div
      className="absolute z-50 bottom-0 left-0 right-0 flex flex-col items-center justify-center 
    bg-blue-500 text-white rounded-lg max-h-[60vh]"
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-full p-4 max-h-[inherit] overflow-y-auto">
        <div className="flex flex-col items-center px-4 max-w-full mb-3">
          <div className="overflow-hidden text-center">
            <span>Het antwoord was </span>
            <span className="pl-1 font-extrabold block break-words">
              {answer}
            </span>
            <span className="mt-2 block">Had je het goed?</span>
          </div>
        </div>
        <div className="flex gap-3 mt-2 justify-center">
          <Button1 onClick={onCorrect} text="Ja" />
          <Button1 onClick={onIncorrect} text="Nee" />
        </div>
      </div>
    </motion.div>
  )
);

GedachtenOverlay.displayName = "GedachtenOverlay";

// StreakCelebration component
export const StreakCelebration = memo(
  ({ streak, isNewStreak }: { streak: number; isNewStreak: boolean }) => {
    const [animation, setAnimation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const loadAnimation = async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 10));
          const animationModule = await import("@/app/img/flame.json");
          setAnimation(animationModule.default);
          setTimeout(() => setIsLoading(false), 50);
        } catch (error) {
          console.error("Failed to load animation:", error);
          setIsLoading(false);
        }
      };

      loadAnimation();

      return () => {
        setAnimation(null);
      };
    }, []);

    return (
      <div className="w-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500 rounded-xl p-6 my-4">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-2 relative flex items-center justify-center">
            <Lottie animationData={animation} loop={true} />
          </div>

          <h2 className="text-2xl font-bold mb-2 text-white text-center">
            Je hebt een reeks gestart!
          </h2>

          <div className="text-5xl font-bold text-orange-400 my-4 text-center">
            {streak}{" "}
            <span className="text-lg">{streak === 1 ? "dag" : "dagen"}</span>
          </div>

          <p className="text-center text-gray-300">
            Je bent goed bezig! Blijf elke dag leren om je reeks te behouden.
          </p>
        </div>
      </div>
    );
  }
);

StreakCelebration.displayName = "StreakCelebration";

// FreezeReward component
export const FreezeReward = memo(({ streak }: { streak: number }) => {
  return (
    <div className="w-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500 rounded-xl p-6 my-4">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-2 text-white text-center">
          Bevriezer verdiend!
        </h2>

        <div className="text-6xl font-bold text-blue-400 my-4 text-center">
          🧊
        </div>

        <p className="text-center text-gray-300">
          Je hebt 3 dagen achter elkaar geleerd. Je hebt een bevriezer verdiend!
        </p>
      </div>
    </div>
  );
});

FreezeReward.displayName = "FreezeReward";
