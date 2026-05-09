import { useState, useEffect } from 'react';
import { loadCardImage } from '../storage/images';

export default function CardThumbnail({ cardId }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadCardImage(cardId).then((url) => {
      if (!cancelled && url) setSrc(url);
    });
    return () => { cancelled = true; };
  }, [cardId]);

  if (!src) {
    return <div className="image-card-thumb" style={{ background: 'var(--rule-soft)' }} />;
  }
  return <img src={src} alt="" className="image-card-thumb" />;
}
