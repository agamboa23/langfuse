import { env } from "@/src/env.mjs";
import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export const redis =
  globalForRedis.redis ??
  (env.REDIS_URL ? new Redis(env.REDIS_URL) : undefined);

if (env.NODE_ENV !== "production") globalForRedis.redis = redis;
