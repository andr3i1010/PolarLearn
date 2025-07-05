"use client";

import { CardComponentProps } from "nextstepjs";
import { Progress } from "@/components/ui/progress";
import Button1 from "@/components/button/Button1";

/**
 * Custom dark-themed card for NextStep tour dialogs.
 */
export default function DarkCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  return (
    <div className="bg-neutral-800 text-gray-100 rounded-lg shadow-xl p-4 max-w-xl min-w-[16rem]">
      {arrow}
      <div className="flex items-center mb-2">
        <div className="text-2xl mr-2">{step.icon}</div>
        <h3 className="text-lg font-bold">{step.title}</h3>
      </div>
      <div className="mb-4 text-sm">{step.content}</div>
      <div className="mb-4">
        <Progress
          className="mb-4 h-2 w-full"
          value={Math.round(((currentStep + 1) / totalSteps) * 100)}
        />
      </div>
      <div className="flex justify-between items-center gap-4 text-xs">
        <Button1
          text="Vorige"
          onClick={prevStep}
          disabled={currentStep === 0 || !step.showControls}
        />
        <span className="whitespace-nowrap">{`${
          currentStep + 1
        }/${totalSteps}`}</span>
        {currentStep === totalSteps - 1 ? (
          <Button1
            text="Klaar"
            onClick={async () => {
              skipTour?.();
              await fetch("/api/v1/finish-tour", {
                method: "POST",
              });
            }}
            disabled={!step.showControls}
          />
        ) : (
          <Button1
            text="Volgende"
            onClick={nextStep}
            disabled={!step.showControls}
          />
        )}
      </div>
      {currentStep < totalSteps - 1 && (
        <Button1
          text="Tour overslaan"
          onClick={async () => {
            skipTour?.();
            await fetch("/api/v1/finish-tour", {
              method: "POST",
            });
          }}
          className="mt-4 w-full text-xs"
          disabled={!step.showControls}
        />
      )}
    </div>
  );
}
