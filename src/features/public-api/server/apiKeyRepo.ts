import { type ApiKey, type PrismaClient } from "@prisma/client";
import type Redis from "ioredis";

export const createKey = async (
  apiKey: ApiKey,
  prisma: PrismaClient,
  redis?: Redis,
) => {
  const createdApiKey = await prisma.apiKey.create({ data: apiKey });

  if (redis && apiKey.fastHashedSecretKey) {
    await redis.hset(`api-key:${createdApiKey.publicKey}`, apiKey);
  }
  return createdApiKey;
};

export const getApiKey = async (
  publicKey: string,
  prisma: PrismaClient,
  redis?: Redis,
) => {
  if (redis) {
    const apiKey = await redis.hgetall(`api-key:${publicKey}`);

    const typedApiKey = 

    if (apiKey) {
      return apiKey;
    }
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: {
      publicKey,
    },
  });

  if (redis && apiKey?.hashedSecretKey) {
    await redis.set(`api-key:${publicKey}`, apiKey.hashedSecretKey);
  }
  return apiKey;
};
