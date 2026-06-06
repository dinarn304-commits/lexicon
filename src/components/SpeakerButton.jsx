import { Volume2 } from 'lucide-react';
import { voiceForLanguage, speak } from '../utils/speech';

// A small, quiet speaker icon that voices `text` in the deck's `language`.
// Renders nothing when the language isn't recognised, so a wrong-language
// reading can never happen. Shared by ReviewView and DeckView so the look
// stays identical to the reading panel's English pronunciation icon.
export default function SpeakerButton({ text, language, className = '', size = 14 }) {
  if (!voiceForLanguage(language)) return null;

  function handleClick(e) {
    e.stopPropagation(); // never flip/reveal a card or open the editor
    speak(text, language);
  }

  return (
    <button
      type="button"
      className={`card-speaker-btn ${className}`.trim()}
      onClick={handleClick}
      aria-label="Play pronunciation"
      title="Play pronunciation"
    >
      <Volume2 size={size} />
    </button>
  );
}
