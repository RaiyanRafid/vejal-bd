import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE_NAME, SITE_TAGLINE_BN } from "@/lib/site";

// Placeholder; the real home page is Task 13.
export default function Home() {
  return (
    <section className="space-y-6 py-10">
      <h1 className="text-3xl font-semibold">{SITE_NAME}</h1>
      <p className="text-muted-foreground">{SITE_TAGLINE_BN}</p>
      <Button asChild size="lg">
        <Link href="/report">রিপোর্ট করুন</Link>
      </Button>
    </section>
  );
}
