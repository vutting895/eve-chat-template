import { defineTool } from "eve/tools";
import { z } from "zod";

const BASE_URL = "https://voom-system-api.suwapat787.workers.dev";
const PATHS = [
  { name: "health", path: "/api/health" },
  { name: "mt5_status", path: "/api/mt5/status" },
] as const;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth-limited]";
  if (Array.isArray(value)) return value.slice(0, 40).map((item) => redact(item, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (/secret|token|password|authorization|credential|api.?key|account(number|id)?|login(number|id)?|balance|equity|profit|ticket|email|phone/i.test(key)) {
        out[key] = "[redacted]";
      } else {
        out[key] = redact(item, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "string") return value.slice(0, 1000);
  return value;
}

async function readEndpoint(path: string) {
  try {
    const response = await fetch(new URL(path, BASE_URL), {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(7000),
      cache: "no-store",
    });
    const body = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      data = { response: body.slice(0, 500) };
    }
    return {
      endpoint: path,
      httpStatus: response.status,
      ok: response.ok,
      data: redact(data),
    };
  } catch (error) {
    return {
      endpoint: path,
      ok: false,
      error: error instanceof Error ? error.message.slice(0, 240) : "Request failed",
    };
  }
}

export default defineTool({
  description:
    "Read-only status check for Voom_system. Fetches the fixed Cloudflare Worker health and MT5 status endpoints. Use when the user asks about system health, Worker availability, or MT5 connection. Never sends trade commands or accepts arbitrary URLs.",
  inputSchema: z.object({}),
  async execute() {
    const results = await Promise.all(PATHS.map(({ path }) => readEndpoint(path)));
    return {
      service: "Voom_system",
      mode: "read-only",
      checkedAt: new Date().toISOString(),
      results,
    };
  },
});
