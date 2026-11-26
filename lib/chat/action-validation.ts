import type { HandleMessageStreamEvent, SessionState } from "eve/client";

const MAX_CHAT_EVENTS_PER_BATCH = 200;
const MAX_CHAT_EVENT_BYTES = 64 * 1024;
const MAX_CHAT_EVENTS_BYTES = 1024 * 1024;
const MAX_SESSION_STATE_BYTES = 256 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getJsonByteLength(value: unknown, label: string) {
  let serialized: string | undefined;

  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new Error(`${label} must be valid JSON data.`);
  }

  if (typeof serialized !== "string") {
    throw new Error(`${label} must be valid JSON data.`);
  }

  return new TextEncoder().encode(serialized).byteLength;
}

export function assertChatEvent(event: unknown): asserts event is HandleMessageStreamEvent {
  if (!isRecord(event) || typeof event.type !== "string" || event.type.length === 0) {
    throw new Error("Chat events must be objects with a non-empty type.");
  }

  if (getJsonByteLength(event, "Chat event") > MAX_CHAT_EVENT_BYTES) {
    throw new Error("Chat event payload is too large.");
  }
}

export function assertChatEvents(
  events: unknown,
): asserts events is readonly HandleMessageStreamEvent[] {
  if (!Array.isArray(events) || events.length > MAX_CHAT_EVENTS_PER_BATCH) {
    throw new Error(`Chat event batches must contain ${MAX_CHAT_EVENTS_PER_BATCH} events or fewer.`);
  }

  let totalBytes = 0;

  for (const event of events) {
    assertChatEvent(event);
    totalBytes += getJsonByteLength(event, "Chat event");
  }

  if (totalBytes > MAX_CHAT_EVENTS_BYTES) {
    throw new Error("Chat event batch payload is too large.");
  }
}

export function assertChatSessionState(session: unknown): asserts session is SessionState {
  if (!isRecord(session)) {
    throw new Error("Chat session state must be an object.");
  }

  if (getJsonByteLength(session, "Chat session state") > MAX_SESSION_STATE_BYTES) {
    throw new Error("Chat session state payload is too large.");
  }
}

export function assertChatEventIndex(eventIndex: unknown): asserts eventIndex is number {
  if (!Number.isSafeInteger(eventIndex) || (eventIndex as number) < 0) {
    throw new Error("Chat event index must be a non-negative safe integer.");
  }
}
