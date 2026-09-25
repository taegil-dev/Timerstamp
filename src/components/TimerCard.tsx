import { Check, Pause, Pencil, Play, RotateCcw, Trash2, X } from "lucide-react"
import { useState } from "react"
import formatTime from "../features/function/FormatTime"
import TimeInput from "./TimerInput"
import type { TimerItem, TimerSound } from "../features/timer/types"

export default function TimerCard({
    timer,
    startTimer,
    pauseTimer,
    resetTimer,
    removeTimer,
    alarmAudioRef,
    alarmContextRef,
    alarmTimerRef,
    stopTimerSound,
    onDragStart,
    onDragOver,
    onDrop,
    editTimer,
}: {
  timer: TimerItem
  startTimer: Function
  pauseTimer: Function
  resetTimer: Function
  removeTimer: Function
    alarmAudioRef: React.RefObject<HTMLAudioElement | null>
    alarmContextRef: React.RefObject<AudioContext | null>
    alarmTimerRef: React.RefObject<number | null>
  stopTimerSound: Function
  onDragStart: (timerId: string) => void
  onDragOver: (event: React.DragEvent<HTMLElement>) => void
  onDrop: (timerId: string) => void
  editTimer: (id: string, seconds: number, sound: TimerSound, customSound?: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [hours, setHours] = useState(Math.floor(timer.durationMs / 3600000))
  const [minutes, setMinutes] = useState(Math.floor(timer.durationMs / 60000) % 60)
  const [seconds, setSeconds] = useState(Math.floor(timer.durationMs / 1000) % 60)
  const [sound, setSound] = useState<TimerSound>(timer.sound)
  const [customSound, setCustomSound] = useState(timer.customSound)

  function startEditing() {
    setHours(Math.floor(timer.durationMs / 3600000))
    setMinutes(Math.floor(timer.durationMs / 60000) % 60)
    setSeconds(Math.floor(timer.durationMs / 1000) % 60)
    setSound(timer.sound)
    setCustomSound(timer.customSound)
    setEditing(true)
  }

  function saveEditing() {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds

    if (totalSeconds <= 0) return

    editTimer(timer.id, totalSeconds, sound, customSound)
    setEditing(false)
  }
  const progress =
    1 -
    timer.remainingMs /
      timer.durationMs;
      
      return (
        <article
        className={`timer-card ${
          timer.status === "completed"
          ? "completed"
          : ""
        }`}
        draggable
        onDragStart={() => onDragStart(timer.id)}
        onDragOver={onDragOver}
        onDrop={() => onDrop(timer.id)}
        >
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
              stopTimerSound(alarmAudioRef, alarmContextRef, alarmTimerRef);
            }
          }
          aria-label="타이머 삭제">
          <Trash2 size={17} />
        </button>
        <button
          className="icon-button"
          onClick={startEditing}
          aria-label="타이머 편집"
        >
          <Pencil size={17} />
        </button>
      </div>

      {editing && (
        <div className="timer-edit-form" onClick={(event) => event.stopPropagation()}>
          <div className="time-inputs">
            <TimeInput value={hours} max={99} onChange={setHours} />
            <span className="time-separator">:</span>
            <TimeInput value={minutes} max={59} onChange={setMinutes} />
            <span className="time-separator">:</span>
            <TimeInput value={seconds} max={59} onChange={setSeconds} />
          </div>

          <select
            value={sound}
            onChange={(event) => setSound(event.target.value as TimerSound)}
          >
            <option value="bell">🔔 벨</option>
            <option value="beep">📢 비프</option>
            <option value="digital">⏰ 디지털</option>
            <option value="custom">🎵 사용자 음원</option>
          </select>

          {sound === "custom" && (
            <label className="file-button">
              음원 파일 선택
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file || !file.type.startsWith("audio/")) return

                  const reader = new FileReader()
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      setCustomSound(reader.result)
                    }
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </label>
          )}

          <div className="timer-edit-actions">
            <button className="primary" onClick={saveEditing}>
              <Check size={16} /> 저장
            </button>
            <button onClick={() => setEditing(false)}>
              <X size={16} /> 취소
            </button>
          </div>
        </div>
      )}

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
          }}/>
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
              stopTimerSound(alarmAudioRef, alarmContextRef, alarmTimerRef);
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