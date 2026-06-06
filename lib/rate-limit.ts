import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const noopLimit = {
  limit: async () => ({ success: true, limit: 0, remaining: 0, reset: 0 }),
} as unknown as Ratelimit;

function makeRateLimit(
  prefix: string,
  requests: number,
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`
): Ratelimit {
  if (!redis) return noopLimit;
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), prefix });
}

export const globalRateLimit = makeRateLimit("rl:global", 60, "1 m");
export const authRateLimit = makeRateLimit("rl:auth", 10, "1 m");
export const voteRateLimit = makeRateLimit("rl:vote", 5, "1 m");
export const pushRateLimit = makeRateLimit("rl:push", 20, "1 m");
export const linkCodeGenerateRateLimit = makeRateLimit("rl:link-generate", 10, "1 m");
export const linkCodeRedeemRateLimit = makeRateLimit("rl:link-redeem", 20, "1 m");
