'use client';

import { useEffect, useRef } from 'react';
import * as jdenticon from 'jdenticon';
import React from 'react';

interface JdenticonProps {
  value: string;
  size: number;
  className?: string;
}

function Jdenticon({ value, size, className = '' }: JdenticonProps) {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iconRef.current) {
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

export default React.memo(Jdenticon);
