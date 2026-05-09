export default function PageFooter({ onGuideClick, onFeedbackClick }) {
  return (
    <footer className="page-footer">
      <button className="page-footer-btn" onClick={onGuideClick}>« Guide »</button>
      <button className="page-footer-btn" onClick={onFeedbackClick}>« Feedback »</button>
    </footer>
  );
}
