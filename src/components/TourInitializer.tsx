'use client';
import { useEffect, useState } from 'react';
import { useNextStep } from 'nextstepjs';
import { usePathname } from 'next/navigation';

interface TourInitializerProps {
  tourName: string;
}

export default function TourInitializer({ tourName }: TourInitializerProps) {
  const { startNextStep, currentStep } = useNextStep();
  const pathname = usePathname();
  const [isSmallScreen, setIsSmallScreen] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Consider small screen if width is less than 768px
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Start tour only on /home routes, if tour is not already in progress, and screen is not small
  useEffect(() => {
    if (!isSmallScreen && pathname.startsWith('/home/start') && !currentStep) {
      startNextStep(tourName);
    }
  }, [pathname, tourName, startNextStep, currentStep, isSmallScreen]);

  return null;
}
