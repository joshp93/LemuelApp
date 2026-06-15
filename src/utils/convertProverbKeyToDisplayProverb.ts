/**
 * Converts a proverb key (e.g. "Proverbs3:5") to a display proverb (e.g. "Proverbs 3:5").
 * Inserts a space between the book name and the chapter number.
 * @param key - The proverb key to convert.
 */
export const convertProverbKeyToDisplayProverb = (key: string): string =>
  key.replace(/([A-Za-z]+)(\d)/, "$1 $2");
