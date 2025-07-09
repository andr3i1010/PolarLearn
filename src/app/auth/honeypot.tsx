import React, { useEffect, useState } from 'react';

export default function Honeypot() {
  const [showInput, setShowInput] = useState(false);
  const [botDetected, setBotDetected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowInput(true), crypto.getRandomValues(new Uint32Array(1))[0] % 5000 + 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (botDetected) {
      // Daar gaat de DOM :)
      document.writeln('')
    }
  }, [botDetected]);

  if (botDetected) return null;
  if (!showInput) return null;

  return (
    <input
      type="text"
      name="phone-number"
      tabIndex={-1}
      autoComplete="off"
      style={{
        position: 'absolute',
        left: '-9999px',
        height: '1px',
        width: '1px',
        overflow: 'hidden',
      }}
      aria-hidden="true"
      onChange={(e) => {
        if (e.target.value) {
          setBotDetected(true)
          console.log('Honeypot activated! Bot detected.');
        };
      }}
    />
  );
}
