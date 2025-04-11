"use client";

import { useState, useCallback } from 'react';
import LearnTool from './learnTool';
import LearnToolHeader from '../navbar/learntToolHeader';

interface LearnToolWithProgressProps {
    mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze";
    rawlistdata: any[];
    listId: string;
    currentMethod: string;
}

export default function LearnToolWithProgress({
    mode,
    rawlistdata,
    listId,
    currentMethod
}: LearnToolWithProgressProps) {
    const [progress, setProgress] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [wrongAnswers, setWrongAnswers] = useState(0);

    const handleCorrectAnswer = useCallback(() => {
        setCorrectAnswers(prev => prev + 1);
    }, []);

    const handleWrongAnswer = useCallback(() => {
        setWrongAnswers(prev => prev + 1);
    }, []);

    const handleProgressUpdate = useCallback((completed: number, total: number) => {
        const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        setProgress(progressPercentage);
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <LearnToolHeader
                listId={listId}
                progress={progress}
                correctAnswers={correctAnswers}
                wrongAnswers={wrongAnswers}
                currentMethod={currentMethod}
            />

            <div className="flex-grow flex items-center justify-center">
                <LearnTool
                    mode={mode}
                    rawlistdata={rawlistdata}
                    onCorrectAnswer={handleCorrectAnswer}
                    onWrongAnswer={handleWrongAnswer}
                    onProgressUpdate={handleProgressUpdate}
                />
            </div>

            {/* Fix overlay positioning by targeting the motion.div elements */}
            <style jsx global>{`
        /* Ensure the parent container of the overlay has proper positioning */
        .bg-neutral-800.relative.min-w-\\[240px\\] {
          position: relative !important;
          overflow: visible !important;
        }
        
        /* Target the specific motion divs that contain overlays */
        .motion-div-overlay {
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          top: auto !important;
          transform-origin: bottom center !important;
        }
        
        /* Target specific overlay classes - more aggressive approach */
        div[class*="absolute"][class*="z-50"][class*="bottom-0"],
        div.absolute.z-50.bottom-0,
        .absolute.z-50.bottom-0 {
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          top: auto !important;
        }
        
        /* Target the motion.div that should be at the bottom */
        .AnimatePresence > motion.div {
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          top: auto !important;
        }
      `}</style>
        </div>
    );
}
