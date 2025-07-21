"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarCog, ChartArea, Crown, Dna } from "lucide-react";

export const prestatieMap = [
  {
    points: 10, name: "placeholder", description: "placeholder", image: (
      <>
        <CalendarCog className="w-30 h-30" />
      </>
  ) },
  {
    points: 100,
    name: "placeholder",
    description: "placeholder",
    image: (
      <>
        <Crown className="w-30 h-30" />
      </>
    ),
  },
  {
    points: 1000,
    name: "placeholder",
    description: "placeholder",
    image: (
      <>
        <Dna className="w-30 h-30" />
      </>
    ),
  },
  {
    points: 5000,
    name: "placeholder",
    description: "placeholder",
    image: (
      <>
        <ChartArea className="w-30 h-30" />
      </>
    ),
  },
];

export function PrestatieSelector({ points }: { points: number }) {
  return (
    <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
      <CardContent className="flex flex-row gap-4">
        {prestatieMap.map((prestatie, i) => {
          return (
            <div
              key={i}
              className={`transition-all items-center justify-center flex flex-col ${
                points < prestatie.points
                  ? "opacity-50 cursor-not-allowed"
                : "hover:text-neutral-300 cursor-pointer active:scale-95"
              }`}
            >
              {prestatie.image ? prestatie.image : null}
              <h1 key={i}>{prestatie.name}</h1>
              <p>{prestatie.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
