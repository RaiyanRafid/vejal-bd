"use client";

import dynamic from "next/dynamic";

// Render on pages that show toasts; keeps Sonner out of the root bundle.
export const LazyToaster = dynamic(() => import("./sonner").then((m) => m.Toaster), { ssr: false });
