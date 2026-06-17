/**
 * Converts a display proverb (e.g. "Proverbs 3:5") to a proverb key (e.g. "Proverbs3:5").
 */
export const convertDisplayProverbToProverbKey = (
  displayProverb: string,
): string => displayProverb.replace(" ", "");

/**
 * Converts a proverb key (e.g. "Proverbs3:5") to a display proverb (e.g. "Proverbs 3:5").
 */
export const convertProverbKeyToDisplayProverb = (key: string): string =>
  key.replace(/([A-Za-z]+)(\d)/, "$1 $2");

/**
 * Abbreviates the book name in a proverb reference for display on small screens.
 * "Proverbs 3:5" → "Prov 3:5"
 */
export const abbreviateProverbRef = (ref: string): string =>
  ref.replace(/^Proverbs\b/, "Prov");
