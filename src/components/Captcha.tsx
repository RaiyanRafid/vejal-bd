"use client";

import "altcha";
import "altcha/i18n/bn";
import { useEffect, useRef } from "react";

export function Captcha({ onVerified }: { onVerified: (payload: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const cb = useRef(onVerified);
  useEffect(() => { cb.current = onVerified; });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = (e: Event) => cb.current((e as CustomEvent<{ payload: string }>).detail.payload);
    el.addEventListener("verified", on);
    return () => el.removeEventListener("verified", on);
  }, []);
  return (
    // @ts-expect-error custom element typed via altcha JSX augmentation only when imported globally
    <altcha-widget ref={ref} challenge="/api/captcha" language="bn" hidefooter hidelogo style={{ minHeight: 44 }} />
  );
}
