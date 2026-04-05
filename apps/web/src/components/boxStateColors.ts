import type { BoxState } from "@greenspace/shared";

export const BOX_STATE_COLORS: Record<BoxState, { background: string; text: string; border: string }> = {
  available: { background: "#EAF0E5", text: "#5C6B52", border: "#7A8B6F" },
  occupied: { background: "#F5EDE5", text: "#A8623A", border: "#C67D4B" },
  reserved: { background: "#E5EDED", text: "#5A8A87", border: "#A8C4C2" },
};
