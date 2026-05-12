export default function WordCounter({ count }) {
  return (
    <span
      style={{
        fontFamily: "'DM Mono', ui-monospace, monospace",
        fontSize: 11,
        letterSpacing: '0.04em',
        color: 'var(--terracotta)',
      }}
    >
      {count} {count === 1 ? 'word' : 'words'}
    </span>
  );
}
