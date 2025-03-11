'use client';

import { useEffect, useRef } from 'react';
import * as jdenticon from 'jdenticon';

interface JdenticonProps {
  value: string;
  size: number;
  className?: string;
}

export default function Jdenticon({ value, size, className = '' }: JdenticonProps) {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iconRef.current) {
      // Generate icon and set as innerHTML
      iconRef.current.innerHTML = jdenticon.toSvg(value, size);
    }
  }, [value, size]);

  return (
    <div 
      ref={iconRef}
      className={`rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
