type TimeInputProps = {
  value: number;
  max: number;
  onChange: (value: number) => void;
};

export default function TimeInput({
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