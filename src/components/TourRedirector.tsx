'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useNextStep } from 'nextstepjs';

export default function TourRedirector() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentStep } = useNextStep();

  useEffect(() => {
    if (pathname.startsWith('/home') && pathname !== '/home/start' && !currentStep) {
      router.push('/home/start');
    }
  }, [pathname, currentStep, router]);

  return null;
}
