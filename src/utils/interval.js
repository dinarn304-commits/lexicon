import { applyRating } from '../algorithm/scheduler';

export function previewInterval(card, quality) {
  const updated = applyRating(card, quality);
  const ms = new Date(updated.nextReview) - new Date();
  const minutes = ms / 60000;
  const hours = minutes / 60;
  const days = ms / 86400000;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
