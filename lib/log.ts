// Minimal structured logger. Emits JSON lines that Vercel log drain / dashboard can parse.
// Never log full response data — counts and token prefixes only.

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function emit(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };
  // Route to the right console method so Vercel groups levels correctly.
  const method = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  method(JSON.stringify(entry));
}

export const log = {
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, context?: LogContext) => emit("error", event, context),
  debug: (event: string, context?: LogContext) => emit("debug", event, context),
};

// Convenience: token privacy helper — log first 8 chars only (e.g., "FMH-ABCD")
export function tokenPrefix(token: string | undefined): string {
  if (!token) return "none";
  return token.slice(0, 8);
}
