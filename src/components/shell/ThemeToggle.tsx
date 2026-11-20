"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// The initial class is set by an inline script in layout.tsx (no flash).
export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="থিম পরিবর্তন করুন"
      onClick={() => {
        const dark = document.documentElement.classList.toggle("dark");
        try {
          localStorage.setItem("theme", dark ? "dark" : "light");
        } catch {}
      }}
    >
      <Sun className="hidden size-5 dark:block" />
      <Moon className="size-5 dark:hidden" />
    </Button>
  );
}
