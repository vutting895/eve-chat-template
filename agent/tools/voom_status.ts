import { defineTool } from "eve/tools";
import { z } from "zod";

const SERVICES = [
  {
    name: "nova_ai_worker",
    url: "https://voom-system-nova-ai.suwapat787.workers.dev/health",
  },
  {
    name: "remote_mcp_worker",
    url: "https://voom-system-mcp.suwapat787.workers.dev/health",
  },
] as const;

const SAFE_HEALTH_FIELDS = [
  "ok",
  "service",
  "mode",
  "status",
  "aiBinding",
  "authConfigured",
  "customerAuthenticationRequired",
  "ordersEnabled",
  "executionEnabled",
  "liveTradingEnabled",
] as const;

function selectSafeHealthFields(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const source = value as Record<string, unknown>;
  const safe: Record<string, unknown> = {};

  for (const key of SAFE_HEALTH_FIELDS) {
    const item = source[key];
    if (
      typeof item === "string" ||
      typeof item === "boolean" ||
      (typeof item === "number" && Number.isFinite(item))
    ) {
      safe[key] = typeof item === "string" ? item.slice(0, 120) : item;
    }
  }

  return safe;
}

async function readHealth(service: (typeof SERVICES)[number]) {
  try {
    const response = await fetch(service.url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(7000),
    });

    const body = (await response.text()).slice(0, 8000);
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = undefined;
    }

    return {
      service: service.name,
      reachable: response.ok,
      httpStatus: response.status,
      health: selectSafeHealthFields(parsed) ?? null,
    };
  } catch {
    return {
      service: service.name,
      reachable: false,
      httpStatus: null,
      health: null,
      error: "health_check_unavailable",
    };
  }
}

export default defineTool({
  description:
    "Read-only health check for the VOOM_SYSTEM NOVA AI Worker and Remote MCP Worker. It checks only public service health endpoints; it does not verify a personal MT5 account, expose private account data, or place, modify, or close orders.",
  inputSchema: z.object({}),
  async execute() {
    const results = await Promise.all(SERVICES.map(readHealth));

    return {
      system: "VOOM_SYSTEM",
      mode: "read-only",
      orderSubmissionEnabled: false,
      checkedAt: new Date().toISOString(),
      results,
      note:
        "Worker health is not proof of an authenticated MT5 connection. Account-specific status requires the user's authenticated, tenant-isolated MCP path.",
    };
  },
});
