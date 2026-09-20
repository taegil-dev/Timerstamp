
export type TimerStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed";

  export type TimerSound =
  | "bell"
  | "beep"
  | "digital"
  | "custom";

export type TimerItem = {
  id: string;
  name: string;
  durationMs: number;
  remainingMs: number;
  status: "idle" | "running" | "paused" | "completed";
  endAt: number | null;
  groupId?: string;

  // 추가
  sound: TimerSound;
  customSound?: string;
};