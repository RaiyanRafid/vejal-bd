import type { Metadata, Viewport } from "next";
import { Geist_Mono, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/motion";
import { BottomNav } from "@/components/shell/BottomNav";
import { Header } from "@/components/shell/Header";
import { StickyCta } from "@/components/shell/StickyCta";
import { SITE_NAME, SITE_TAGLINE_BN } from "@/lib/site";

const hind = Hind_Siliguri({
  variable: "--font-bn",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE_BN,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
  ],
};

// Dark class before paint: saved choice, else the OS preference.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" suppressHydrationWarning className={`${hind.variable} ${mono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <MotionProvider>
          <Header />
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-40 md:pb-16">{children}</main>
          <StickyCta />
          <BottomNav />
        </MotionProvider>
      </body>
    </html>
  );
}
