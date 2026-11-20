import { BarChart3, Home, ListChecks, Search } from "lucide-react";

export const NAV = [
  { href: "/", label: "হোম", icon: Home },
  { href: "/reports", label: "রিপোর্ট", icon: ListChecks },
  { href: "/stats", label: "পরিসংখ্যান", icon: BarChart3 },
  { href: "/track", label: "ট্র্যাক", icon: Search },
] as const;

export const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
