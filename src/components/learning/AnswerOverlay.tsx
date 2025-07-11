import { memo } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import check from "@/app/img/check.svg";
import wrong from "@/app/img/wrong.svg";

// Memoized question display component
export const QuestionDisplay = memo(({ question }: { question: string }) => (
  <div className="px-4 py-2 bg-neutral-700 rounded-lg mb-4 min-w-[240px] max-w-[400px] text-center">
    <span className="font-extrabold">{question}</span>
  </div>
));

QuestionDisplay.displayName = "QuestionDisplay";

// Memoized answer overlay component
export const AnswerOverlay = memo(
  ({ correct, answer }: { correct: boolean; answer?: string }) => (
    <motion.div
      className={`absolute z-50 bottom-0 left-0 right-0 flex items-center justify-center ${correct ? "bg-green-700" : "bg-red-700"
        } text-white rounded-lg text-2xl font-extrabold max-h-[60vh]`}
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-full py-4 max-h-[inherit] overflow-y-auto">
        {correct ? (
          <div className="flex items-center justify-center">
            <Image
              src={check}
              width={40}
              height={40}
              alt="check icon"
              className="mr-4"
            />
            Correct!
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-start px-4 w-full py-2">
            <Image
              src={wrong}
              width={40}
              height={40}
              alt="wrong icon"
              className="mr-4 flex-shrink-0 mb-2 md:mb-0 mt-1"
            />
            <div className="w-full text-center md:text-left">
              <span>Verkeerd! het antwoord was </span>
              <span className="pl-1 font-extrabold break-words">{answer}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
);

AnswerOverlay.displayName = "AnswerOverlay";
