import ThemeStyles from './ThemeStyles';

export default function Loader() {
  return (
    <div className="srs-root flex items-center justify-center" style={{ minHeight: '100vh' }}>
      <ThemeStyles />
      <div className="srs-content text-center">
        <div className="ornament text-sm mb-3">· · ·</div>
        <div className="display text-xl" style={{ color: 'var(--ink-soft)' }}>opening the notebook</div>
      </div>
    </div>
  );
}
