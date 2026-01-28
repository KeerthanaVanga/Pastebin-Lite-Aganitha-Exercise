import { nanoid } from "nanoid";
import { getRedis } from "../db/redis.js";
import { nowMsForExpiry } from "../utils/time.js";
import { Paste } from "../models/paste.model.js";

const key = (id) => `paste:${id}`;

/**
 * Verify that the paste was stored in Redis by reading it back.
 * Set VERIFY_REDIS_STORAGE=1 in .env to enable (useful for debugging).
 */
async function verifyStoredInRedis(redis, pasteId, expectedContent) {
  const raw = await redis.get(key(pasteId));
  if (!raw) {
    throw new Error("Redis verification failed: key not found after write");
  }
  const stored = Paste.fromJSON(raw);
  if (stored.content !== expectedContent) {
    throw new Error("Redis verification failed: stored content does not match");
  }
  return true;
}

export const create = async ({ content, ttl_seconds, max_views }) => {
  const id = nanoid(10);
  const createdAtMs = Date.now();

  const paste = new Paste({
    id,
    content,
    createdAtMs,
    expiresAtMs: ttl_seconds ? createdAtMs + ttl_seconds * 1000 : null,
    maxViews: max_views ?? null,
  });

  const redis = await getRedis();
  const value = JSON.stringify(paste);

  // Set Redis TTL if paste has expiry time (add 1 second buffer)
  if (ttl_seconds) {
    await redis.setEx(key(id), ttl_seconds + 1, value);
  } else {
    await redis.set(key(id), value);
  }

  // Optional: verify data was stored (enable with VERIFY_REDIS_STORAGE=1)
  if (process.env.VERIFY_REDIS_STORAGE === "1") {
    await verifyStoredInRedis(redis, id, content);
    console.log("[Redis] Verified: paste stored successfully", { id: id });
  }

  return paste;
};

export const consume = async (id, req) => {
  const redis = await getRedis();
  const now = nowMsForExpiry(req);

  for (let i = 0; i < 5; i++) {
    await redis.watch(key(id));
    const raw = await redis.get(key(id));
    if (!raw) throw new Error();

    const paste = Paste.fromJSON(raw);

    if (paste.isExpired(now) || paste.isExhausted()) {
      await redis.unwatch();
      throw new Error();
    }

    paste.viewsUsed++;

    const tx = redis.multi();
    // Preserve TTL if paste has expiry
    if (paste.expiresAtMs !== null) {
      const remainingSeconds = Math.max(1, Math.ceil((paste.expiresAtMs - now) / 1000));
      tx.setEx(key(id), remainingSeconds, JSON.stringify(paste));
    } else {
      tx.set(key(id), JSON.stringify(paste));
    }
    if (await tx.exec()) return paste.toApiResponse();
  }

  throw new Error();
};

export const peek = async (id, req) => {
  const redis = await getRedis();
  const raw = await redis.get(key(id));
  if (!raw) throw new Error();

  const paste = Paste.fromJSON(raw);
  const now = nowMsForExpiry(req);

  if (paste.isExpired(now) || paste.isExhausted()) {
    throw new Error();
  }

  return paste;
};
