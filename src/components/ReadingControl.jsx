export default function ReadingControl({ value, onDecrement, onIncrement, atMin, atMax }) {
  return (
    <div className="reading-control">
      <button
        className="reading-control-btn"
        onClick={onDecrement}
        disabled={atMin}
        aria-label="Decrease"
      >
        –
      </button>
      <span className="reading-control-value">{value}</span>
      <button
        className="reading-control-btn"
        onClick={onIncrement}
        disabled={atMax}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
