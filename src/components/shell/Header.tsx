"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { NAV, isActive } from "./nav";

export function Header() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-4 px-4">
        <Link href="/" className="font-mono text-base font-semibold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav aria-label="প্রধান মেনু" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(path, n.href) ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
                isActive(path, n.href) && "font-medium text-foreground",
              )}
            >
              {n.label}
            </Link>
          ))}
          <Button asChild size="sm" className="ml-2">
            <Link href="/report">রিপোর্ট করুন</Link>
          </Button>
        </nav>
        <div className="ml-auto md:ml-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
