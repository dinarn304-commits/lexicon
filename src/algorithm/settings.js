export const SETTINGS = {
  // Learning ladder in minutes: 15min, 1 day, 6 days
  newCardSteps: [15, 1440, 8640],
  graduatingInterval: 15,   // days, after completing the ladder with Good
  easyInterval: 60,         // days, when Easy is pressed on a new card
  startingEase: 2.5,
  lapseSteps: [20],         // minutes for the single relearning step
  lapseNewIntervalMultiplier: 0.7,
  lapseMinInterval: 2,      // days
  intervalModifier: 1.0,    // global multiplier; no UI yet
  hardMultiplier: 1.2,
  easyBonus: 1.3,
  minEase: 1.3,
};
