import { SETTINGS } from './settings';

export function applyRating(card, quality, settings = SETTINGS) {
  const now = new Date();
  let nextReview = new Date();
  const updated = { ...card, lastReviewed: now.toISOString() };
  const state = card.state || 'new';

  if (state === 'new' || state === 'learning') {
    const steps = settings.newCardSteps;
    const currentStep = card.learningStep ?? 0;

    if (quality === 1) {
      updated.state = 'learning';
      updated.learningStep = 0;
      nextReview.setMinutes(nextReview.getMinutes() + steps[0]);
    } else if (quality === 3) {
      updated.state = 'learning';
      const step = state === 'new' ? 0 : currentStep;
      updated.learningStep = step;
      nextReview.setMinutes(nextReview.getMinutes() + steps[step]);
    } else if (quality === 4) {
      const nextStep = state === 'new' ? 0 : currentStep + 1;
      if (nextStep >= steps.length) {
        updated.state = 'review';
        updated.interval = settings.graduatingInterval;
        updated.learningStep = 0;
        const days = Math.round(settings.graduatingInterval * settings.intervalModifier);
        nextReview.setDate(nextReview.getDate() + days);
      } else {
        updated.state = 'learning';
        updated.learningStep = nextStep;
        nextReview.setMinutes(nextReview.getMinutes() + steps[nextStep]);
      }
    } else if (quality === 5) {
      updated.state = 'review';
      updated.interval = settings.easyInterval;
      updated.learningStep = 0;
      const days = Math.round(settings.easyInterval * settings.intervalModifier);
      nextReview.setDate(nextReview.getDate() + days);
    }
  } else if (state === 'review') {
    const interval = card.interval || 1;
    let ease = card.easeFactor || settings.startingEase;

    if (quality === 1) {
      const newInterval = Math.max(
        settings.lapseMinInterval,
        Math.round(interval * settings.lapseNewIntervalMultiplier)
      );
      ease = Math.max(settings.minEase, ease - 0.20);
      updated.state = 'relearning';
      updated.learningStep = 0;
      updated.savedInterval = newInterval;
      updated.easeFactor = ease;
      nextReview.setMinutes(nextReview.getMinutes() + settings.lapseSteps[0]);
    } else if (quality === 3) {
      ease = Math.max(settings.minEase, ease - 0.15);
      const days = Math.max(interval + 1, Math.round(interval * settings.hardMultiplier * settings.intervalModifier));
      updated.interval = days;
      updated.easeFactor = ease;
      nextReview.setDate(nextReview.getDate() + days);
    } else if (quality === 4) {
      const days = Math.max(interval + 1, Math.round(interval * ease * settings.intervalModifier));
      updated.interval = days;
      updated.easeFactor = ease;
      nextReview.setDate(nextReview.getDate() + days);
    } else if (quality === 5) {
      ease = ease + 0.15;
      const days = Math.max(interval + 1, Math.round(interval * ease * settings.easyBonus * settings.intervalModifier));
      updated.interval = days;
      updated.easeFactor = ease;
      nextReview.setDate(nextReview.getDate() + days);
    }
  } else if (state === 'relearning') {
    const steps = settings.lapseSteps;
    const currentStep = card.learningStep ?? 0;

    if (quality === 1 || quality === 3) {
      updated.state = 'relearning';
      updated.learningStep = 0;
      nextReview.setMinutes(nextReview.getMinutes() + steps[0]);
    } else if (quality === 4) {
      const nextStep = currentStep + 1;
      if (nextStep >= steps.length) {
        const days = card.savedInterval || settings.lapseMinInterval;
        updated.state = 'review';
        updated.interval = days;
        updated.learningStep = 0;
        updated.savedInterval = null;
        nextReview.setDate(nextReview.getDate() + days);
      } else {
        updated.learningStep = nextStep;
        nextReview.setMinutes(nextReview.getMinutes() + steps[nextStep]);
      }
    } else if (quality === 5) {
      const days = Math.max(
        settings.lapseMinInterval,
        (card.savedInterval || settings.lapseMinInterval) + 1
      );
      updated.state = 'review';
      updated.interval = days;
      updated.learningStep = 0;
      updated.savedInterval = null;
      nextReview.setDate(nextReview.getDate() + days);
    }
  }

  updated.nextReview = nextReview.toISOString();
  return updated;
}

// Upgrades old card records (repetitions/easeFactor/interval) to the state-based schema.
// Idempotent — safe to run multiple times.
export function migrateCard(card) {
  if (card.state) return card;
  const reps = card.repetitions || 0;
  if (reps === 0) {
    return { ...card, state: 'new', learningStep: 0, savedInterval: null };
  }
  if (reps < 3 || !card.interval || card.interval < 1) {
    return { ...card, state: 'learning', learningStep: Math.min(reps, 2), savedInterval: null };
  }
  return { ...card, state: 'review', learningStep: 0, savedInterval: null, interval: card.interval };
}

export function isDue(card) {
  if (!card.nextReview) return true;
  return new Date(card.nextReview) <= new Date();
}
