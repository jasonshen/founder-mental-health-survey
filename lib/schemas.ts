import { z } from "zod";

// A single response value — any of the shapes our question types emit.
const ResponseValue = z.union([
  z.string().max(2000),
  z.array(z.string().max(500)).max(50),
  z.number().finite(),
  z.boolean(),
]);

const ResponseMap = z.record(z.string().max(100), ResponseValue);

// All section ids that can appear in a submission. Mirrors SectionId in lib/types.
export const AnySectionId = z.enum([
  "company",
  "life_outlook",
  "ambition",
  "founder_challenges",
  "macro_outlook",
  "cofounder",
  "depression",
  "anxiety",
  "burnout",
  "adhd",
  "autism",
  "dark_triad",
  "social_support",
  "help_seeking",
  "medication",
  "substance_use",
  "open_ended",
  "founder_stress",
]);

// {sectionId: ResponseMap}. Every section is optional — partial progress is expected.
// Keyed by z.string() rather than the enum so Zod doesn't require every key;
// unknown keys are ignored by the server's allowlist lookup.
const SectionResponses = z.record(z.string(), ResponseMap).default({});

export const SurveySubmissionSchema = z.object({
  token: z.string().optional(),
  submission_id: z.string().uuid().optional(),
  responses: SectionResponses,
});

export type SurveySubmissionInput = z.infer<typeof SurveySubmissionSchema>;

export const SectionSaveSchema = z.object({
  submission_id: z.string().uuid(),
  section_id: AnySectionId,
  responses: ResponseMap,
  // When true, this is an in-section flush (e.g., from a sendBeacon
  // on tab close). Don't add the section to sections_completed —
  // that flag still means "user clicked Next on this section."
  partial: z.boolean().optional(),
});

export type SectionSaveInput = z.infer<typeof SectionSaveSchema>;

export const EmailSubmissionSchema = z.object({
  token: z.string().min(1).max(50),
  email: z.string().email().max(254),
  wants_report: z.boolean().default(false),
  wants_coaching: z.boolean().default(false),
  wants_retreat: z.boolean().default(false),
  wants_plant_medicine: z.boolean().default(false),
  wants_updates: z.boolean().default(false),
});

export type EmailSubmissionInput = z.infer<typeof EmailSubmissionSchema>;

export const TokenParamSchema = z.string().regex(/^FMH-[A-Z0-9]{4}$/i, {
  message: "Invalid token format",
});
