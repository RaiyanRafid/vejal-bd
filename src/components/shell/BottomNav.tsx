"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV, isActive } from "./nav";

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="প্রধান মেনু"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-2xl grid-cols-4">
        {NAV.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(path, href) ? "page" : undefined}
              className={cn(
                "flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground",
                isActive(path, href) && "font-medium text-primary",
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
