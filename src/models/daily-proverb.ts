import { z } from "zod";

export const DailyProverbSchema = z.object({
  pk: z.literal("daily-proverb"),
  sk: z.string(),
  ref: z.string(),
});

export type DailyProverb = z.infer<typeof DailyProverbSchema>;
