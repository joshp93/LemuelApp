import { z } from "zod";

export const ProverbSchema = z.object({
  ref: z.string(),
  proverb: z.string(),
});

export type Proverb = z.infer<typeof ProverbSchema>;
