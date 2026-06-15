import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Standard scan tools — 20 requests per minute per user
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "threatsnipe:rl",
});

// Expensive tools (port scan, bulk, blacklist CIDR) — 5 requests per minute per user
export const heavyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "threatsnipe:rl:heavy",
});
