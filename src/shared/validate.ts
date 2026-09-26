import { z } from "zod";

export const collectionNameSchema = z
  .string()
  .regex(/^[A-Za-z0-9._-]{1,64}$/, "Invalid collection name");

export const searchModeSchema = z.enum(["search", "vsearch", "query"]);

export const typedLineTypeSchema = z.enum(["lex", "vec", "hyde"]);

export const typedQueryLineSchema = z.object({
  type: typedLineTypeSchema,
  query: z
    .string()
    .min(1)
    .refine((s) => !s.includes("\n"), "Query line cannot contain newlines"),
});

export function parseCollectionName(name: string): string {
  return collectionNameSchema.parse(name);
}

export function parsePositiveInt(
  value: unknown,
  _field: string,
  max = 10_000,
): number {
  return z.coerce.number().int().min(1).max(max).parse(value);
}
