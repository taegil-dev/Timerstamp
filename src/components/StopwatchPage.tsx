import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import formatTime from "../features/function/FormatTime";

export function StopwatchPage() {
  const [elapsed, setElapsed] = useState<number>(0);

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