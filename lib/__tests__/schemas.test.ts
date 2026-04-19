import {
  SurveySubmissionSchema,
  EmailSubmissionSchema,
  TokenParamSchema,
} from "../schemas";

describe("SurveySubmissionSchema", () => {
  it("accepts a minimal valid submission", () => {
    const result = SurveySubmissionSchema.safeParse({
      responses: {
        company: { company_role: "Solo Founder" },
        adhd: {},
        depression: {},
        anxiety: {},
        founder_stress: {},
      },
    });
    expect(result.success).toBe(true);
  });

  it("fills in missing sections with empty objects via default", () => {
    const result = SurveySubmissionSchema.safeParse({
      responses: {
        company: {},
        adhd: {},
        depression: {},
        anxiety: {},
        founder_stress: {},
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects when responses is missing", () => {
    const result = SurveySubmissionSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects string values longer than 2000 chars", () => {
    const result = SurveySubmissionSchema.safeParse({
      responses: {
        company: { company_role: "x".repeat(2001) },
        adhd: {},
        depression: {},
        anxiety: {},
        founder_stress: {},
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts number types for age-like answers", () => {
    const result = SurveySubmissionSchema.safeParse({
      responses: {
        company: { company_age: 42 },
        adhd: {},
        depression: {},
        anxiety: {},
        founder_stress: {},
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("EmailSubmissionSchema", () => {
  it("accepts a valid email submission", () => {
    const result = EmailSubmissionSchema.safeParse({
      token: "FMH-ABCD",
      email: "jason@example.com",
      wants_report: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = EmailSubmissionSchema.safeParse({
      token: "FMH-ABCD",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing token", () => {
    const result = EmailSubmissionSchema.safeParse({
      email: "jason@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("defaults interest flags to false", () => {
    const result = EmailSubmissionSchema.parse({
      token: "FMH-ABCD",
      email: "jason@example.com",
    });
    expect(result.wants_report).toBe(false);
    expect(result.wants_coaching).toBe(false);
    expect(result.wants_retreat).toBe(false);
  });
});

describe("TokenParamSchema", () => {
  it("accepts valid FMH- token", () => {
    expect(TokenParamSchema.safeParse("FMH-ABCD").success).toBe(true);
    expect(TokenParamSchema.safeParse("FMH-7X2K").success).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(TokenParamSchema.safeParse("fmh-abcd").success).toBe(true);
  });

  it("rejects wrong prefix", () => {
    expect(TokenParamSchema.safeParse("XXX-ABCD").success).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(TokenParamSchema.safeParse("FMH-ABC").success).toBe(false);
    expect(TokenParamSchema.safeParse("FMH-ABCDE").success).toBe(false);
  });
});
