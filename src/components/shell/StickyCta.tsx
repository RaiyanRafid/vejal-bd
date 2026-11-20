"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function StickyCta() {
  const path = usePathname();
  if (path === "/report" || path.startsWith("/report/")) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 px-4 pb-3 md:hidden">
      <Button asChild size="lg" className="pointer-events-auto mx-auto flex w-full max-w-2xl shadow-lg">
        <Link href="/report">রিপোর্ট করুন</Link>
      </Button>
    </div>
  );
}
