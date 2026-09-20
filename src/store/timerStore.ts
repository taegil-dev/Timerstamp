import { create } from "zustand";
import type { TimerItem, TimerSound } from "../features/timer/types";

export type TimerGroup = {
  id: string;
  name: string;
};

interface TimerStore {
  timers: TimerItem[];
  groups: TimerGroup[];

  addTimer: (name: string, seconds: number, sound: TimerSound, customSound?: string, groupId?: string,) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  removeTimer: (id: string) => void;

  addGroup: (name: string) => void;
  removeGroup: (groupId: string) => void;
  setTimerGroup: (timerId: string, groupId: string | undefined) => void;

  startGroup: (groupId: string) => void;
  pauseGroup: (groupId: string) => void;
  resetGroup: (groupId: string) => void;

  syncTimers: () => void;
}

export const useTimerStore = create<TimerStore>((set) => ({
  timers: [],
  groups: [],

  // -------------------------
  // 타이머
  // -------------------------

  addTimer: (
    name: string,
    seconds: number,
    sound: TimerSound = "bell",
    customSound?: string,
    groupId?: string,
  ) => {
    const durationMs = Math.max(1, seconds) * 1000;

    set((state) => ({
      timers: [
        ...state.timers,
        {
          id: crypto.randomUUID(),
          name,
          durationMs,
          remainingMs: durationMs,
          status: "idle",
          endAt: null,
          groupId,

          sound,
          customSound,
        }
      ]
    }));
  },

  startTimer: (id) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id && timer.status !== "completed"
          ? {
              ...timer,
              status: "running",
              endAt: Date.now() + timer.remainingMs
            }
          : timer
      )
    }));
  },

  pauseTimer: (id) => {
    const now = Date.now();

    set((state) => ({
      timers: state.timers.map((timer) => {
        if (timer.id !== id || timer.status !== "running") {
          return timer;
        }

        return {
          ...timer,
          status: "paused",
          remainingMs: Math.max(
            0,
            (timer.endAt ?? now) - now
          ),
          endAt: null
        };
      })
    }));
  },

  resetTimer: (id) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === id
          ? {
              ...timer,
              status: "idle",
              remainingMs: timer.durationMs,
              endAt: null
            }
          : timer
      )
    }));
  },

  removeTimer: (id) => {
    set((state) => ({
      timers: state.timers.filter(
        (timer) => timer.id !== id
      )
    }));
  },

  // -------------------------
  // 그룹
  // -------------------------

  addGroup: (name) => {
    set((state) => ({
      groups: [
        ...state.groups,
        {
          id: crypto.randomUUID(),
          name
        }
      ]
    }));
  },

  removeGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.filter(
        (group) => group.id !== groupId
      ),

      // 그룹을 삭제하면 해당 타이머들은
      // 일반 타이머로 남겨둔다.
      timers: state.timers.map((timer) =>
        timer.groupId === groupId
          ? {
              ...timer,
              groupId: undefined
            }
          : timer
      )
    }));
  },

  setTimerGroup: (timerId, groupId) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.id === timerId
          ? {
              ...timer,
              groupId
            }
          : timer
      )
    }));
  },

  // -------------------------
  // 그룹 시작
  // -------------------------

  startGroup: (groupId) => {
    const now = Date.now();

    set((state) => ({
      timers: state.timers.map((timer) => {
        if (
          timer.groupId !== groupId ||
          timer.status === "completed"
        ) {
          return timer;
        }

        return {
          ...timer,
          status: "running",
          endAt: now + timer.remainingMs
        };
      })
    }));
  },

  // -------------------------
  // 그룹 일시정지
  // -------------------------

  pauseGroup: (groupId) => {
    const now = Date.now();

    set((state) => ({
      timers: state.timers.map((timer) => {
        if (
          timer.groupId !== groupId ||
          timer.status !== "running"
        ) {
          return timer;
        }

        return {
          ...timer,
          status: "paused",
          remainingMs: Math.max(
            0,
            (timer.endAt ?? now) - now
          ),
          endAt: null
        };
      })
    }));
  },

  // -------------------------
  // 그룹 초기화
  // -------------------------

  resetGroup: (groupId) => {
    set((state) => ({
      timers: state.timers.map((timer) =>
        timer.groupId === groupId
          ? {
              ...timer,
              status: "idle",
              remainingMs: timer.durationMs,
              endAt: null
            }
          : timer
      )
    }));
  },

  // -------------------------
  // 타이머 동기화
  // -------------------------

  syncTimers: () => {
    const now = Date.now();

    set((state) => ({
      timers: state.timers.map((timer) => {
        if (
          timer.status !== "running" ||
          timer.endAt === null
        ) {
          return timer;
        }

        const remainingMs = Math.max(
          0,
          timer.endAt - now
        );

        if (remainingMs === 0) {

          return {
            ...timer,
            remainingMs: 0,
            status: "completed",
            endAt: null
          };
        }

        return {
          ...timer,
          remainingMs
        };
      })
    }));
  }
}));