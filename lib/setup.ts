import type { SetupStatus } from "@/lib/chat/types";
import { isDatabaseConfigured, isDatabaseSchemaReady } from "@/lib/db/client";

const AUTH_ENV_KEYS = [
  "BETTER_AUTH_SECRET",
  "NEXT_PUBLIC_VERCEL_APP_CLIENT_ID",
  "VERCEL_APP_CLIENT_SECRET",
] as const;

const RATE_LIMIT_ENV_GROUPS = [
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
] as const;

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function isAuthConfigured() {
  return AUTH_ENV_KEYS.every(hasEnv);
}

export function isRateLimitConfigured() {
  return RATE_LIMIT_ENV_GROUPS.some((group) => group.every(hasEnv));
}

export function getInitialSetupStatus(): SetupStatus {
  return createSetupStatus({
    databaseSchemaReady: isDatabaseConfigured(),
  });
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const databaseConfigured = isDatabaseConfigured();
  const databaseSchemaReady = databaseConfigured
    ? await isDatabaseSchemaReady()
    : false;

  return createSetupStatus({ databaseSchemaReady });
}

export async function isAppConfigured() {
  const status = await getSetupStatus();

  return status.appReady;
}

function createSetupStatus({
  databaseSchemaReady,
}: {
  readonly databaseSchemaReady: boolean;
}): SetupStatus {
  const databaseConfigured = isDatabaseConfigured();
  const authReady = isAuthConfigured();
  const rateLimitReady = isRateLimitConfigured();
  const databaseReady = databaseConfigured && databaseSchemaReady;
  const missing = [
    ...(databaseConfigured ? [] : ["DATABASE_URL"]),
    ...(databaseConfigured && !databaseSchemaReady ? ["database migrations"] : []),
    ...AUTH_ENV_KEYS.filter((key) => !hasEnv(key)),
    ...(rateLimitReady ? [] : ["UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN"]),
  ];

  return {
    appReady: authReady && databaseReady && rateLimitReady,
    authReady,
    databaseConfigured,
    databaseReady,
    databaseSchemaReady,
    missing,
    rateLimitReady,
  };
}
