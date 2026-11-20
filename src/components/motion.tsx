"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";

// Always use `m`, never `motion` (keeps Motion ~5 KB).
export { m };

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={() => import("./motion-features").then((m) => m.default)} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const ease = [0, 0, 0.2, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease } },
};

export const stagger = (children: number) => ({
  animate: { transition: { staggerChildren: Math.min(0.05, 0.2 / Math.max(children, 1)) } },
});
