import { Pause, Play, RotateCcw, Trash2 } from "lucide-react"
import formatTime from "../features/function/FormatTime"

export default function TimerCard({
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
          aria-label="타이머 삭제">
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