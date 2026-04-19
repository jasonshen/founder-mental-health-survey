import { z } from "zod";

// A single response value — any of the shapes our question types emit.
const ResponseValue = z.union([
  z.string().max(2000),
  z.array(z.string().max(500)).max(50),
  z.number().finite(),
  z.boolean(),
]);

const ResponseMap = z.record(z.string().max(100), ResponseValue);

export const SurveySubmissionSchema = z.object({
  // Client-sent token is now ignored but we still accept it for backward compat.
  token: z.string().optional(),
  submission_id: z.string().uuid().optional(),
  responses: z.object({
    company: ResponseMap.default({}),
    adhd: ResponseMap.default({}),
    depression: ResponseMap.default({}),
    anxiety: ResponseMap.default({}),
    founder_stress: ResponseMap.default({}),
  }),
});

export type SurveySubmissionInput = z.infer<typeof SurveySubmissionSchema>;

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
