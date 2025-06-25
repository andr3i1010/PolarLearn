'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNextStep } from 'nextstepjs';

export default function TourNavigator() {
  const pathname = usePathname();
  const { setCurrentStep, currentStep } = useNextStep();

  useEffect(() => {
    const navigate = () => {
      // From forum button to forum list
      if (pathname === '/home/forum' && currentStep === 3) {
        setCurrentStep(4);
      }

      // From forum list back to start page
      if (pathname === '/home/start' && currentStep === 5) {
        setCurrentStep(6);
      }
    };

    // Delay to prevent race conditions and flickering
    const handler = setTimeout(navigate, 250);

    return () => clearTimeout(handler);
  }, [pathname, currentStep, setCurrentStep]);

  return null;
}
