export default function PageFooter({ onGuideClick, onSettingsClick, onFeedbackClick, onSupportClick }) {
  return (
    <footer className="page-footer">
      <button className="page-footer-btn" onClick={onGuideClick}>Guide</button>
      <button className="page-footer-btn" onClick={onSettingsClick}>Settings</button>
      <button className="page-footer-btn" onClick={onFeedbackClick}>Feedback</button>
      <button className="page-footer-btn" onClick={onSupportClick}>Support Lexicon</button>
    </footer>
  );
}
