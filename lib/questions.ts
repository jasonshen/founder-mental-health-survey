import type { Question, SectionId } from "./types";

// ============================================================
// V2 — Streamlined Questions (34 total)
// Sections: Company, ADHD (ASRS), Depression (PHQ-9), Anxiety (GAD-7), Founder Stress
// ============================================================

export interface SectionMeta {
  id: SectionId;
  label: string;
  intro: string;
}

export const SECTIONS: SectionMeta[] = [
  {
    id: "company",
    label: "About You & Your Company",
    intro: "Tell us a bit about yourself and your startup. This helps us contextualize your responses.",
  },
  {
    id: "adhd",
    label: "Focus & Attention",
    intro: "These questions screen for attention-related traits. Answer based on your experience over the past 6 months.",
  },
  {
    id: "depression",
    label: "How You've Been Feeling",
    intro: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
  },
  {
    id: "anxiety",
    label: "Worry & Anxiety",
    intro: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
  },
  {
    id: "founder_stress",
    label: "Founder-Specific Stressors",
    intro: "Rate how much each of the following has been a source of stress for you in the past month.",
  },
];

export const SECTION_ORDER: SectionId[] = SECTIONS.map((s) => s.id);

// ============================================================
// Section 1: Company Info (10 questions)
// Order: Year → YC → Role → Age → Gender → Race → Industry → Funding → Run rate → Team
// ============================================================

const companyQuestions: Question[] = [
  {
    id: "company_year_founded",
    section: "company",
    text: "What year was your company founded?",
    type: "dropdown",
    options: [
      "2026",
      "2025",
      "2024",
      "2023",
      "2022",
      "2021",
      "2020",
      "2019",
      "2018 or earlier",
    ],
    required: true,
    instrument: null,
  },
  {
    id: "company_yc_batch",
    section: "company",
    text: "Are you a Y Combinator company? If so, which batch?",
    type: "dropdown",
    options: [
      "X26 (Summer 2026)",
      "S26 (Spring 2026)",
      "W26 (Winter 2026)",
      "F25 (Fall 2025)",
      "X25 (Summer 2025)",
      "S25 (Spring 2025)",
      "W25 (Winter 2025)",
      "F24 (Fall 2024)",
      "X24 (Summer 2024)",
      "W24 (Winter 2024)",
      "X23 (Summer 2023)",
      "W23 (Winter 2023)",
      "X22 (Summer 2022)",
      "W22 (Winter 2022)",
      "X21 (Summer 2021)",
      "W21 (Winter 2021)",
      "X20 (Summer 2020)",
      "W20 (Winter 2020)",
      "Earlier than 2020",
      "Not a YC company",
    ],
    required: true,
    instrument: null,
  },
  {
    id: "company_role",
    section: "company",
    text: "What is your role?",
    type: "single_select",
    options: ["Solo Founder", "Co-Founder / CEO", "Co-Founder / CTO", "Co-Founder / Other", "Other"],
    required: true,
    instrument: null,
  },
  {
    id: "company_age",
    section: "company",
    text: "What is your age?",
    type: "number",
    required: true,
    instrument: null,
  },
  {
    id: "company_gender",
    section: "company",
    text: "What is your gender?",
    type: "single_select",
    options: ["Male", "Female", "Non-binary", "Prefer not to say"],
    required: true,
    instrument: null,
  },
  {
    id: "company_ethnicity",
    section: "company",
    text: "What is your race/ethnicity?",
    type: "dropdown",
    options: [
      "Asian",
      "Black / African American",
      "Hispanic / Latino",
      "Middle Eastern / North African",
      "Native American / Alaska Native",
      "Native Hawaiian / Pacific Islander",
      "White / Caucasian",
      "Multiracial / Mixed",
      "Prefer not to say",
      "Other",
    ],
    required: true,
    instrument: null,
  },
  {
    id: "company_industry",
    section: "company",
    text: "What industry is your company in?",
    type: "dropdown",
    options: [
      "SaaS / Software",
      "AI / Machine Learning",
      "Fintech",
      "Healthcare / Biotech",
      "Consumer / E-commerce",
      "Climate / Energy",
      "Education",
      "Hardware / Robotics",
      "Other",
    ],
    required: true,
    instrument: null,
  },
  {
    id: "company_funding",
    section: "company",
    text: "How much total funding has your company raised?",
    type: "dropdown",
    options: [
      "Haven't raised outside funding",
      "Less than $1M",
      "$1M - $2M",
      "$2M - $5M",
      "$5M - $10M",
      "$10M - $25M",
      "$25M - $50M",
      "$50M+",
    ],
    required: true,
    instrument: null,
  },
  {
    id: "company_revenue",
    section: "company",
    text: "What is your approximate annual run rate?",
    type: "dropdown",
    options: [
      "Pre-revenue",
      "Less than $100K",
      "$100K - $500K",
      "$500K - $1M",
      "$1M - $5M",
      "$5M - $10M",
      "$10M+",
    ],
    required: true,
    instrument: null,
  },
  {
    id: "company_team_size",
    section: "company",
    text: "How many people are on your team? (employees + full-time contractors, including yourself)",
    type: "single_select",
    options: [
      "Just me",
      "2-5",
      "6-15",
      "16-50",
      "51-100",
      "100+",
    ],
    required: true,
    instrument: null,
  },
];

// ============================================================
// Section 2: ASRS-v1.1 Part A — ADHD Screening (6 questions)
// ============================================================

const ASRS_OPTIONS = [
  "Never",
  "Rarely",
  "Sometimes",
  "Often",
  "Very Often",
];

const adhdQuestions: Question[] = [
  {
    id: "asrs_1",
    section: "adhd",
    text: "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: true,
    instrument: "ASRS",
  },
  {
    id: "asrs_2",
    section: "adhd",
    text: "How often do you have difficulty getting things in order when you have to do a task that requires organization?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: true,
    instrument: "ASRS",
  },
  {
    id: "asrs_3",
    section: "adhd",
    text: "How often do you have problems remembering appointments or obligations?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: true,
    instrument: "ASRS",
  },
  {
    id: "asrs_4",
    section: "adhd",
    text: "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: true,
    instrument: "ASRS",
  },
  {
    id: "asrs_5",
    section: "adhd",
    text: "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: true,
    instrument: "ASRS",
  },
  {
    id: "asrs_6",
    section: "adhd",
    text: "How often do you feel overly active and compelled to do things, like you were driven by a motor?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: true,
    instrument: "ASRS",
  },
];

// ============================================================
// Section 3: PHQ-9 Depression Screening (9 questions)
// ============================================================

const PHQ9_OPTIONS = [
  "Not at all",
  "Several days",
  "More than half the days",
  "Nearly every day",
];

const depressionQuestions: Question[] = [
  {
    id: "phq9_1",
    section: "depression",
    text: "Little interest or pleasure in doing things",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_2",
    section: "depression",
    text: "Feeling down, depressed, or hopeless",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_3",
    section: "depression",
    text: "Trouble falling or staying asleep, or sleeping too much",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_4",
    section: "depression",
    text: "Feeling tired or having little energy",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_5",
    section: "depression",
    text: "Poor appetite or overeating",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_6",
    section: "depression",
    text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_7",
    section: "depression",
    text: "Trouble concentrating on things, such as reading or watching TV",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_8",
    section: "depression",
    text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_9",
    section: "depression",
    text: "Thoughts that you would be better off dead, or of hurting yourself in some way",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: true,
    instrument: "PHQ-9",
  },
];

// ============================================================
// Section 3: GAD-7 Anxiety Screening (7 questions)
// ============================================================

const GAD7_OPTIONS = [
  "Not at all",
  "Several days",
  "More than half the days",
  "Nearly every day",
];

const anxietyQuestions: Question[] = [
  {
    id: "gad7_1",
    section: "anxiety",
    text: "Feeling nervous, anxious, or on edge",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: true,
    instrument: "GAD-7",
  },
  {
    id: "gad7_2",
    section: "anxiety",
    text: "Not being able to stop or control worrying",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: true,
    instrument: "GAD-7",
  },
  {
    id: "gad7_3",
    section: "anxiety",
    text: "Worrying too much about different things",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: true,
    instrument: "GAD-7",
  },
  {
    id: "gad7_4",
    section: "anxiety",
    text: "Trouble relaxing",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: true,
    instrument: "GAD-7",
  },
  {
    id: "gad7_5",
    section: "anxiety",
    text: "Being so restless that it is hard to sit still",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: true,
    instrument: "GAD-7",
  },
  {
    id: "gad7_6",
    section: "anxiety",
    text: "Becoming easily annoyed or irritable",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: true,
    instrument: "GAD-7",
  },
  {
    id: "gad7_7",
    section: "anxiety",
    text: "Feeling afraid, as if something awful might happen",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: true,
    instrument: "GAD-7",
  },
];

// ============================================================
// Section 4: Founder-Specific Stress (5 questions)
// ============================================================

const STRESS_OPTIONS = [
  "Not at all",
  "Slightly",
  "Moderately",
  "Very much",
  "Extremely",
];

const founderStressQuestions: Question[] = [
  {
    id: "fs_runway",
    section: "founder_stress",
    text: "Financial pressure or runway concerns",
    type: "likert5",
    options: STRESS_OPTIONS,
    required: true,
    instrument: null,
  },
  {
    id: "fs_loneliness",
    section: "founder_stress",
    text: "Loneliness or isolation in your role as founder",
    type: "likert5",
    options: STRESS_OPTIONS,
    required: true,
    instrument: null,
  },
  {
    id: "fs_cofounder",
    section: "founder_stress",
    text: "Co-founder or team relationship strain",
    type: "likert5",
    options: STRESS_OPTIONS,
    required: true,
    instrument: null,
  },
  {
    id: "fs_identity",
    section: "founder_stress",
    text: "Feeling like your identity is tied entirely to your company's success or failure",
    type: "likert5",
    options: STRESS_OPTIONS,
    required: true,
    instrument: null,
  },
  {
    id: "fs_sleep",
    section: "founder_stress",
    text: "Difficulty sleeping or poor sleep quality due to work stress",
    type: "likert5",
    options: STRESS_OPTIONS,
    required: true,
    instrument: null,
  },
];

// ============================================================
// All Questions & Helpers
// ============================================================

export const ALL_QUESTIONS: Question[] = [
  ...companyQuestions,
  ...adhdQuestions,
  ...depressionQuestions,
  ...anxietyQuestions,
  ...founderStressQuestions,
];

export function getQuestionsBySection(sectionId: SectionId): Question[] {
  return ALL_QUESTIONS.filter((q) => q.section === sectionId);
}
