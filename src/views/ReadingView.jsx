import WordCounter from '../components/WordCounter';

export default function ReadingView() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 fade-up">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0 }}>
        <WordCounter count={0} />
      </div>
    </div>
  );
}
