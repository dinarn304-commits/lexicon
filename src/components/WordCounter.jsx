export default function WordCounter({ today, total }) {
  const style = {
    fontFamily: "'DM Mono', ui-monospace, monospace",
    fontSize: 11,
    letterSpacing: '0.04em',
    color: 'var(--terracotta)',
  };
  const dotStyle = {
    margin: '0 4px',
  };
  return (
    <span style={style}>
      {today} words today
      <span style={dotStyle}>·</span>
      {total} in total
    </span>
  );
}
