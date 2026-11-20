import { isIP } from "node:net";

// Transient only: never log or store the result; hash it with ipHash().
export function getClientIp(headers: Headers): string {
  const raw = (headers.get("cf-connecting-ip") ?? headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(raw);
  const ip = mapped ? mapped[1] : raw;
  const v = isIP(ip);
  if (v === 4) return ip;
  if (v !== 6) return "unknown";
  // Expand "::" and keep the /64 so rotating within a prefix hits one key.
  const [head, tail = ""] = ip.split("%")[0].split("::");
  const h = head ? head.split(":") : [], t = tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...h, ...Array(8 - h.length - t.length).fill("0"), ...t] : h;
  return groups.slice(0, 4).map((g) => g.toLowerCase().padStart(4, "0")).join(":") + "::/64";
}
