"use client";

import { useEffect, useState } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Add a slight artificial delay to make navigation feel substantial
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`transition-opacity duration-500 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}
