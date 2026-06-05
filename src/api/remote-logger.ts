import { LEMUEL_API_BASE_URL } from "./constants";

const LOGS_API_URL = `${LEMUEL_API_BASE_URL}/logs`;

type LogLevel = "debug" | "info" | "warn" | "error";

export function remoteLog(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): void {
  console[level](`[RemoteLog] ${message}`, context ?? "");
  fetch(LOGS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ level, message, context }),
  }).catch((err) => console.warn("[RemoteLog] Failed to send:", err));
}
