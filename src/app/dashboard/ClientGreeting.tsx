"use client";

import { useEffect, useState } from "react";

export default function ClientGreeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <h1 className="text-2xl sm:text-3xl font-bold">
      {greeting}, {firstName}
    </h1>
  );
}
