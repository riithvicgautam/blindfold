import type { ZodIssue, ZodTypeAny, z } from "zod";

import { validationFailed } from "./errors.js";

export function fieldErrors(issues: ZodIssue[]): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    (details[key] ??= []).push(issue.message);
  }
  return details;
}

/** Parse unknown input with a Zod schema, throwing a typed 400 on failure. */
export function parseOrThrow<TSchema extends ZodTypeAny>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success) throw validationFailed(fieldErrors(result.error.issues));
  return result.data;
}
