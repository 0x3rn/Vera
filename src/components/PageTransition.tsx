"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mountedPath, setMountedPath] = useState(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (pathname !== mountedPath) {
      // Start transition: hide current content instantly
      setIsTransitioning(true);
      
      const timer = setTimeout(() => {
        // After delay, swap the children and start fade in
        setMountedPath(pathname);
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(false);
          });
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pathname, mountedPath]);

  // Initial load fade-in
  const [initialMount, setInitialMount] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialMount(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`transition-opacity duration-500 ease-out ${
        (!initialMount || isTransitioning) ? 'opacity-0' : 'opacity-100'
      } flex-grow flex flex-col`}
    >
      {pathname === mountedPath ? children : null}
    </div>
  );
}
