import { z } from "zod";

export const SAVED_VIEW_SCOPES = ["FEATURES", "REPORTS"] as const;

export const savedViewScopeSchema = z.enum(SAVED_VIEW_SCOPES);

export const featuresSavedViewFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(["CANDIDATE", "APPROVED", "MERGED", "REJECTED"]).optional(),
  duplicates: z.enum(["only"]).optional(),
});

export const reportsSavedViewFiltersSchema = z.object({
  status: z.enum(["CANDIDATE", "APPROVED", "MERGED", "REJECTED"]).optional(),
  module: z.string().trim().max(80).optional(),
  sourceId: z.string().trim().min(1).max(80).optional(),
});

export const createSavedViewSchema = z.object({
  name: z.string().trim().min(2).max(60),
  scope: savedViewScopeSchema,
  filters: z.record(z.string(), z.string()).default({}),
});

export const updateSavedViewSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
});

export function cleanStringRecord(input: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => typeof value === "string" && value.trim().length > 0
    )
  ) as Record<string, string>;
}

export function parseSavedViewFilters(
  scope: z.infer<typeof savedViewScopeSchema>,
  filters: unknown
) {
  if (scope === "FEATURES") {
    return cleanStringRecord(featuresSavedViewFiltersSchema.parse(filters));
  }

  return cleanStringRecord(reportsSavedViewFiltersSchema.parse(filters));
}

export function buildSavedViewHref(basePath: string, filters: Record<string, string>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value.trim().length > 0) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
