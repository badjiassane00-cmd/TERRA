export type ModerationAction = "verify" | "remove" | "restore";

export function parseModerationAction(value: unknown): ModerationAction | null {
  return value === "verify" || value === "remove" || value === "restore" ? value : null;
}
