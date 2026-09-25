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
import { StopwatchPage } from "./components/StopwatchPage";
import TimerCard from "./components/TimerCard";
import TimeInput from "./components/TimerInput";
import { playTimerSound, stopTimerSound } from "./features/function/PlaySound";

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

  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmContextRef = useRef<AudioContext | null>(null);
  const alarmTimerRef = useRef<number | null>(null);

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
            alarmVolume,
            alarmAudioRef,
            alarmContextRef,
            alarmTimerRef,
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

  return (
    <main className={`app ${theme}`}>
      <aside className="sidebar">
        <div className="brand">
          <img src="/public/icon.ico" alt="Icon" />
          <h1 className="brand-title">
            <span className="brand-timer">Timer</span>
            <span className="brand-stamp">Stamp</span>
          </h1>
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
                            stopTimerSound(alarmAudioRef, alarmContextRef, alarmTimerRef);
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