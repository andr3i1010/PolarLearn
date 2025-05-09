"use client";

import { useState, useCallback } from 'react';
import LearnTool from './learnTool';
import LearnToolHeader from '../navbar/learntToolHeader';

interface LearnToolWithProgressProps {
    mode: "toets" | "gedachten" | "hints" | "learn" | "multikeuze";
    rawlistdata: any[];
    listId: string;
    currentMethod?: string;  // Make currentMethod optional
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

            {/* Ensure this container allows LearnTool to grow */}
            <div className="flex-grow flex items-center justify-center py-8"> {/* Added padding */}
                <LearnTool
                    mode={mode}
                    rawlistdata={rawlistdata}
                    onCorrectAnswer={handleCorrectAnswer}
                    onWrongAnswer={handleWrongAnswer}
                    onProgressUpdate={handleProgressUpdate}
                />
            </div>
        </div>
    );
}
