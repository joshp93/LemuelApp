/**
 * Converts a display proverb (e.g. "Proverbs 3:5") to a proverb key (e.g. "Proverbs3:5").
 * @param displayProverb - The display proverb to convert.
 */
export const convertDisplayProverbToProverbKey = (
  displayProverb: string,
): string => displayProverb.replace(" ", "");
