import { useEffect, useRef, useState } from "react";
import {
  Moon,
  Sun,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Timer as TimerIcon,
  Timer,
  FolderPlus,
  Folder,
  Volume2,
} from "lucide-react";
import { useTimerStore } from "./store/timerStore";
import "./index.css";
import type { TimerItem, TimerSound } from "./features/timer/types";

function formatTime(ms: number) {
  const total = Math.ceil(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`;
}

export default function App() {
  const [page, setPage] = useState<"timer" | "stopwatch">("timer");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // 타이머 생성
  const [name, setName] = useState("");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  // 그룹 생성
  const [groupName, setGroupName] = useState("");

  // 현재 타이머를 추가할 그룹
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const timers = useTimerStore((s) => s.timers);
  const groups = useTimerStore((s) => s.groups);

  const addTimer = useTimerStore((s) => s.addTimer);
  const startTimer = useTimerStore((s) => s.startTimer);
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const resetTimer = useTimerStore((s) => s.resetTimer);
  const removeTimer = useTimerStore((s) => s.removeTimer);

  const addGroup = useTimerStore((s) => s.addGroup);
  const removeGroup = useTimerStore((s) => s.removeGroup);
  const startGroup = useTimerStore((s) => s.startGroup);
  const pauseGroup = useTimerStore((s) => s.pauseGroup);
  const resetGroup = useTimerStore((s) => s.resetGroup);

  const syncTimers = useTimerStore((s) => s.syncTimers);
  const [alarmVolume, setAlarmVolume] = useState(80);

  const [sound, setSound] =
  useState<TimerSound>("bell");

  const [customSound, setCustomSound] =
    useState<string | undefined>();

  const previousTimerStatus =
    useRef<Record<string, TimerItem["status"]>>({});

  useEffect(() => {
    timers.forEach((timer) => {
      const previous =
        previousTimerStatus.current[timer.id];

        if (
          timer.status === "completed" &&
          previous !== "completed"
        ) {
          window.desktop.timerCompleted();
          playTimerSound(
            timer.sound,
            timer.customSound
          );
        }

      previousTimerStatus.current[timer.id] =
        timer.status;
    });
  }, [timers]);

  useEffect(() => {
    const interval = window.setInterval(syncTimers, 200);

    return () => window.clearInterval(interval);
  }, [syncTimers]);

  // -------------------------
  // 타이머 생성
  // -------------------------

  function handleAddTimer() {
    const totalSeconds =
      hours * 3600 +
      minutes * 60 +
      seconds;

    if (totalSeconds <= 0) return;

    addTimer(
      name.trim() || "새 타이머",
      totalSeconds,
      sound,
      customSound,
      selectedGroupId || undefined,
    );

    setName("");
  }

  // -------------------------
  // 그룹 생성
  // -------------------------

  function handleAddGroup() {
    const value = groupName.trim();

    if (!value) return;

    addGroup(value);
    setGroupName("");
  }

  const handleSoundFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("audio/")) {
      alert("오디오 파일만 선택할 수 있습니다.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomSound(reader.result);
        setSound("custom");
      }
    };

    reader.readAsDataURL(file);
  };

  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmContextRef = useRef<AudioContext | null>(null);
  const alarmTimerRef = useRef<number | null>(null);

  const stopTimerSound = () => {
    // 사용자 음원 중지
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
    }

    // 기본 알림음 중지
    if (alarmContextRef.current) {
      alarmContextRef.current.close();
      alarmContextRef.current = null;
    }

    // 반복 타이머 제거
    if (alarmTimerRef.current !== null) {
      window.clearTimeout(alarmTimerRef.current);
      alarmTimerRef.current = null;
    }
  };

  const playTimerSound = (
    sound: TimerSound,
    customSound?: string
  ) => {
    stopTimerSound();

    // =========================
    // 사용자 음원
    // =========================
    if (sound === "custom" && customSound) {
      const audio = new Audio(customSound);

      audio.volume = alarmVolume / 100;
      audio.loop = true;

      alarmAudioRef.current = audio;

      audio.play().catch((error) => {
        console.error(
          "사용자 알림음 재생 실패:",
          error
        );
      });

      alarmTimerRef.current = window.setTimeout(() => {
        stopTimerSound();
      }, 30_000);

      return;
    }

    // =========================
    // 기본 알림음
    // =========================
    const AudioContext =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof window.AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    const context = new AudioContext();

    alarmContextRef.current = context;

    const playTone = (
      frequency: number,
      duration: number,
      startTime: number
    ) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gain.gain.setValueAtTime(
        0,
        context.currentTime + startTime
      );

      gain.gain.linearRampToValueAtTime(
        0.25 * (alarmVolume / 100),
        context.currentTime +
          startTime +
          0.01
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        context.currentTime +
          startTime +
          duration
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(
        context.currentTime + startTime
      );

      oscillator.stop(
        context.currentTime +
          startTime +
          duration
      );
    };

    const playPattern = () => {
      if (!alarmContextRef.current) {
        return;
      }

      if (sound === "bell") {
        playTone(880, 0.8, 0);
        playTone(1320, 0.8, 0.08);
        playTone(1760, 1.0, 0.16);
      }

      if (sound === "beep") {
        playTone(880, 0.25, 0);
        playTone(880, 0.25, 0.35);
        playTone(880, 0.25, 0.7);
      }

      if (sound === "digital") {
        playTone(1200, 0.12, 0);
        playTone(800, 0.12, 0.18);
        playTone(1200, 0.12, 0.36);
        playTone(800, 0.25, 0.54);
      }
    };

    playPattern();

    // 약 1.5초마다 알림음 반복
    const repeat = () => {
      if (!alarmContextRef.current) {
        return;
      }

      playPattern();

      alarmTimerRef.current = window.setTimeout(
        repeat,
        1500
      );
    };

    alarmTimerRef.current = window.setTimeout(
      repeat,
      1500
    );

    // 최대 30초 후 자동 종료
    window.setTimeout(() => {
      stopTimerSound();
    }, 30_000);
  };

  return (
    <main className={`app ${theme}`}>
      <aside className="sidebar">
        <div className="brand">
          <TimerIcon size={25} />
          <span>TimeFlow</span>
        </div>

        <button
          className={page === "timer" ? "nav active" : "nav"}
          onClick={() => setPage("timer")}
        >
          <TimerIcon size={18} />
          타이머
        </button>

        <button
          className={page === "stopwatch" ? "nav active" : "nav"}
          onClick={() => setPage("stopwatch")}
        >
          <Timer size={18} />
          스톱워치
        </button>

        <div className="sidebar-volume">
          <div className="sidebar-volume-header">
            <Volume2 size={17} />
            <span>알림 볼륨</span>
            <strong>{alarmVolume}%</strong>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={alarmVolume}
            onChange={(e) =>
              setAlarmVolume(Number(e.target.value))
            }
          />
        </div>

        <div className="">
          <button
            className="nav"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}

            {theme === "dark"
              ? "라이트 모드"
              : "다크 모드"}
          </button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h1>
              {page === "timer"
                ? "타이머"
                : "스톱워치"}
            </h1>

            <p>
              시간을 관리하고 집중력을 높여보세요.
            </p>
          </div>
        </header>

        {page === "timer" ? (
          <div className="timer-layout">
            {/* =========================
                새 타이머
            ========================= */}
            <div className="timer-create-column">
            <section className="add-panel">
              <h2>새 타이머</h2>

              <div className="timer-form">
                <input
                  className="timer-name-input"
                  placeholder="타이머 이름"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />

                <div className="time-inputs">
                  <TimeInput
                    value={hours}
                    max={99}
                    onChange={setHours}
                  />

                  <span className="time-separator">
                    :
                  </span>

                  <TimeInput
                    value={minutes}
                    max={59}
                    onChange={setMinutes}
                  />

                  <span className="time-separator">
                    :
                  </span>

                  <TimeInput
                    value={seconds}
                    max={59}
                    onChange={setSeconds}
                  />
                </div>

                <div className="sound-setting">
                  <label htmlFor="timer-sound">
                    종료 알림음
                  </label>

                  <select
                    id="timer-sound"
                    value={sound}
                    onChange={(e) =>
                      setSound(e.target.value as TimerSound)
                    }
                  >
                    <option value="bell">🔔 벨</option>
                    <option value="beep">📢 비프</option>
                    <option value="digital">⏰ 디지털</option>
                    <option value="custom">🎵 사용자 음원</option>
                  </select>

                  {sound === "custom" && (
                    <div className="custom-sound">
                      <label className="file-button">
                        음원 파일 선택
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleSoundFileChange}
                        />
                      </label>

                      {customSound && (
                        <span className="sound-selected">
                          음원 선택됨
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <select
                  className="group-select"
                  value={selectedGroupId}
                  onChange={(e) =>
                    setSelectedGroupId(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    그룹 없음
                  </option>

                  {groups.map((group) => (
                    <option
                      key={group.id}
                      value={group.id}
                    >
                      {group.name}
                    </option>
                  ))}
                </select>

                <button
                  className="primary add-timer-button"
                  onClick={handleAddTimer}
                >
                  <Plus size={18} />
                  추가
                </button>
              </div>
            </section>

            {/* =========================
                새 그룹
            ========================= */}

            <section className="add-panel group-panel">
              <div className="group-create-header">
                <div>
                  <h2>타이머 그룹</h2>
                  <p>
                    여러 타이머를 하나로 묶어
                    동시에 시작할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="group-create-form">
                <input
                  placeholder="그룹 이름"
                  value={groupName}
                  onChange={(e) =>
                    setGroupName(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddGroup();
                    }
                  }}
                />

                <button
                  className="primary"
                  onClick={handleAddGroup}
                >
                  <FolderPlus size={18} />
                  그룹 만들기
                </button>
              </div>
            </section>
            </div>

            {/* =========================
                그룹 목록
            ========================= */}
          <div className="timer-result-column">
            {groups.map((group) => {
              const groupTimers = timers.filter(
                (timer) =>
                  timer.groupId === group.id
              );

              const hasRunningTimer =
                groupTimers.some(
                  (timer) =>
                    timer.status === "running"
                );

              const hasTimer =
                groupTimers.length > 0;

              return (
                <section
                  className="timer-group"
                  key={group.id}
                >
                  <div className="group-header">
                    <div className="group-title">
                      <Folder size={20} />

                      <h2>{group.name}</h2>

                      <span>
                        {groupTimers.length}개
                      </span>
                    </div>

                    <div className="group-actions">
                      {hasRunningTimer ? (
                        <button
                          onClick={() =>
                            pauseGroup(group.id)
                          }
                        >
                          <Pause size={16} />
                          일시정지
                        </button>
                      ) : (
                        <button
                          className="primary"
                          disabled={!hasTimer}
                          onClick={() =>
                            startGroup(group.id)
                          }
                        >
                          <Play size={16} />
                          그룹 시작
                        </button>
                      )}

                      <button
                        disabled={!hasTimer}
                        onClick={() => {
                            resetGroup(group.id);
                            stopTimerSound();
                          }
                        }
                      >
                        <RotateCcw size={16} />
                        종료
                      </button>

                      <button
                        className="icon-button"
                        onClick={() => {
                            removeGroup(group.id);
                            setSelectedGroupId("");
                          }
                        }
                        aria-label="그룹 삭제"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {groupTimers.length > 0 ? (
                    <div className="timer-grid">
                      {groupTimers.map((timer) => (
                        <TimerCard
                          key={timer.id}
                          timer={timer}
                          startTimer={startTimer}
                          pauseTimer={pauseTimer}
                          resetTimer={resetTimer}
                          removeTimer={removeTimer}
                          stopTimerSound={stopTimerSound}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="group-empty">
                      <Folder size={28} />

                      <span>
                        아직 이 그룹에 타이머가 없습니다.
                      </span>

                      <small>
                        타이머를 만들 때 그룹을 선택하세요.
                      </small>
                    </div>
                  )}
                </section>
              );
            })}

            {/* =========================
                그룹이 없는 타이머
            ========================= */}

            {timers.some(
              (timer) => !timer.groupId
            ) && (
              <>
                <div className="section-heading">
                  <h2>내 타이머</h2>

                  <span>
                    {
                      timers.filter(
                        (timer) => !timer.groupId
                      ).length
                    }
                    개
                  </span>
                </div>

                <div className="timer-grid">
                  {timers
                    .filter(
                      (timer) => !timer.groupId
                    )
                    .map((timer) => (
                      <TimerCard
                        key={timer.id}
                        timer={timer}
                        startTimer={startTimer}
                        pauseTimer={pauseTimer}
                        resetTimer={resetTimer}
                        removeTimer={removeTimer}
                        stopTimerSound={stopTimerSound}
                      />
                    ))}
                </div>
              </>
            )}

            {timers.length === 0 && (
              <div className="empty">
                <TimerIcon size={40} />

                <h3>
                  아직 타이머가 없어요
                </h3>

                <p>
                  위에서 시간을 설정해 첫 타이머를
                  만들어 보세요.
                </p>
              </div>
            )}
            </div>
          </div>
        ) : (
          <StopwatchPage />
        )}
      </section>
    </main>
  );
}

/* =========================
   타이머 카드
========================= */

function TimerCard({
  timer,
  startTimer,
  pauseTimer,
  resetTimer,
  removeTimer,
  stopTimerSound,
}: {
  timer: any
  startTimer: Function
  pauseTimer: Function
  resetTimer: Function
  removeTimer: Function
  stopTimerSound: Function
}) {
  const progress =
    1 -
    timer.remainingMs /
      timer.durationMs;
      
      return (
        <article className={`timer-card ${
          timer.status === "completed"
          ? "completed"
          : ""
        }`}>
      <div className="card-top">
        <span className="timer-name">
          {timer.name}
        </span>

        {timer.status === "completed" && (
          <span className="timer-completed-badge">
            종료됨
          </span>
        )}

        <button
          className="icon-button"
          onClick={() => {
              removeTimer(timer.id)
              stopTimerSound();
            }
          }
          aria-label="타이머 삭제"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="timer-display">
        {formatTime(timer.remainingMs)}
      </div>

      <div className="progress">
        <div
          style={{
            width: `${Math.min(
              100,
              progress * 100
            )}%`,
          }}
        />
      </div>

      <div className="timer-status">
        {timer.status === "running"
          ? "실행 중"
          : timer.status === "paused"
          ? "일시정지"
          : timer.status === "completed"
          ? "완료"
          : "대기 중"}
      </div>


      <div className="timer-actions">
        {timer.status === "running" ? (
          <button
            onClick={() =>
              pauseTimer(timer.id)
            }
          >
            <Pause size={17} />
            일시정지
          </button>
        ) : (
          <button
            className="primary"
            disabled={
              timer.status === "completed"
            }
            onClick={() =>
              startTimer(timer.id)
            }
          >
            <Play size={17} />

            {timer.status === "paused"
              ? "재개"
              : "시작"}
          </button>
        )}

        <button
          onClick={() => {
              resetTimer(timer.id);
              stopTimerSound();
            } 
          }
        >
          <RotateCcw size={17} />
          종료
        </button>
      </div>
    </article>
  );
}

/* =========================
   시간 입력
========================= */

type TimeInputProps = {
  value: number;
  max: number;
  onChange: (value: number) => void;
};

function TimeInput({
  value,
  max,
  onChange,
}: TimeInputProps) {
  function decrease() {
    onChange(Math.max(0, value - 1));
  }

  function increase() {
    onChange(Math.min(max, value + 1));
  }

  return (
    <div className="time-input">
      <button
        type="button"
        className="time-adjust"
        onClick={increase}
      >
        +
      </button>

      <input
        className="time-value"
        type="number"
        min="0"
        max={max}
        value={String(value).padStart(2, "0")}
        onChange={(e) => {
          const next = Number(e.target.value);

          if (!Number.isFinite(next)) {
            onChange(0);
            return;
          }

          onChange(
            Math.max(
              0,
              Math.min(max, next)
            )
          );
        }}
      />

      <button
        type="button"
        className="time-adjust"
        onClick={decrease}
      >
        −
      </button>
    </div>
  );
}

/* =========================
   스톱워치
========================= */

function StopwatchPage() {
  const [elapsed, setElapsed] =
    useState(0);

  const [running, setRunning] =
    useState(false);

  const [startedAt, setStartedAt] =
    useState<number | null>(null);

  const [laps, setLaps] =
    useState<number[]>([]);

  useEffect(() => {
    if (
      !running ||
      startedAt === null
    ) {
      return;
    }

    const id = window.setInterval(() => {
      setElapsed(
        Date.now() - startedAt
      );
    }, 30);

    return () =>
      window.clearInterval(id);
  }, [running, startedAt]);

  function start() {
    setStartedAt(
      Date.now() - elapsed
    );

    setRunning(true);
  }

  function pause() {
    setElapsed(
      Date.now() -
        (startedAt ?? Date.now())
    );

    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setElapsed(0);
    setStartedAt(null);
    setLaps([]);
  }

  return (
    <section className="stopwatch-panel">
      <div className="stopwatch-time">
        {formatTime(elapsed)}

        <small>
          .
          {String(
            Math.floor(
              (elapsed % 1000) / 10
            )
          ).padStart(2, "0")}
        </small>
      </div>

      <div className="timer-actions centered">
        {running ? (
          <button onClick={pause}>
            <Pause size={18} />
            일시정지
          </button>
        ) : (
          <button
            className="primary"
            onClick={start}
          >
            <Play size={18} />
            시작
          </button>
        )}

        <button
          disabled={!running}
          onClick={() =>
            setLaps((old) => [
              ...old,
              elapsed,
            ])
          }
        >
          랩 기록
        </button>

        <button onClick={reset}>
          <RotateCcw size={18} />
          초기화
        </button>
      </div>

      <div className="laps">
        {laps.map((lap, i) => (
          <div
            className="lap-row"
            key={i}
          >
            <span>
              랩 {i + 1}
            </span>

            <strong>
              {formatTime(lap)}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}