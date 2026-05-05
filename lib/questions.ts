import type { FlatResponses, Question, SectionId } from "./types";

// ============================================================
// V3 — Expanded Survey (18 sections, ~130+ questions)
// ============================================================

export interface SectionMeta {
  id: SectionId;
  label: string;
  intro: string;
  /** If returns false, the entire section is hidden. */
  condition?: (r: FlatResponses) => boolean;
  /** Inline info card rendered immediately after this section. */
  postSection?: "crisis_resources";
}

// ============================================================
// Section 1: Demographics / Company (10 questions, existing)
// ============================================================

const companyQuestions: Question[] = [
  // Seeded from the consent page radio. Hidden in the survey UI via
  // condition: false so we don't double-ask, but the value flows through
  // to section_company in the DB.
  {
    id: "founder_status",
    section: "company",
    text: "Are you a current or past founder?",
    type: "single_select",
    options: ["current", "past"],
    required: false,
    instrument: null,
    condition: () => false,
  },
  // Seeded from the consent page YC screener + URL hint. Hidden — flows
  // into section_company so the API can pull it for the top-level cohort
  // column on survey_responses (see app/api/submit/route.ts).
  {
    id: "cohort",
    section: "company",
    text: "Cohort (set by consent screener)",
    type: "single_select",
    options: ["yc", "general"],
    required: false,
    instrument: null,
    condition: () => false,
  },
  // company_yc_batch was removed 2026-05-05. Specific batch + the other
  // demographic columns (year founded, role, gender, ethnicity, industry,
  // funding band, team size) get close to uniquely identifying respondents
  // in small batches, and per-batch n was never going to support inferential
  // analysis. company_year_founded covers the era-comparison signal.
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
    required: false,
    instrument: null,
  },
  {
    id: "company_role",
    section: "company",
    text: "What is your role?",
    type: "single_select",
    options: [
      "Solo Founder",
      "Co-Founder / CEO",
      "Co-Founder / CTO",
      "Co-Founder / Other",
      "Other",
    ],
    required: false,
    instrument: null,
  },
  {
    id: "company_age",
    section: "company",
    text: "What is your age?",
    type: "number",
    required: false,
    instrument: null,
  },
  {
    id: "company_gender",
    section: "company",
    text: "What is your gender?",
    type: "single_select",
    options: ["Male", "Female", "Non-binary", "Prefer not to say"],
    required: false,
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
    required: false,
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
    required: false,
    instrument: null,
  },
  {
    id: "company_funding",
    section: "company",
    text: "How much total funding has your company raised?",
    type: "dropdown",
    options: [
      "Less than $1M",
      "$1M - $2M",
      "$2M - $5M",
      "$5M - $10M",
      "$10M - $25M",
      "$25M - $50M",
      "$50M+",
    ],
    required: false,
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
    required: false,
    instrument: null,
  },
  {
    id: "company_team_size",
    section: "company",
    text: "How many people are on your team? (employees + full-time contractors, including yourself)",
    type: "single_select",
    options: ["Just me", "2-5", "6-15", "16-50", "51-100", "100+"],
    required: false,
    instrument: null,
  },
];

// ============================================================
// Section 2: Life Outlook (9 items: 4 well-being + 3 domain + 2 frustration)
// Stored in section_life_outlook column.
// Redesigned 2026-05-01 — see
// docs/survey-design-rationale-life-ambition-burnout.md
// ============================================================

// Life Outlook is now a unified 9-item instrument: 4 well-being anchors,
// 3 domain ratings, and 2 founder-specific need-frustration items.
// All items are 0-10 for cross-comparability. The macro_ai items and
// life_money_worry were removed in the 2026-05-01 redesign — see
// docs/survey-design-rationale-life-ambition-burnout.md for the rationale.
const lifeOutlookQuestions: Question[] = [
  // ────────────────────────────────────────────────────────────
  // Block A1 — Hedonic & eudaimonic well-being (4 items)
  // ────────────────────────────────────────────────────────────
  {
    id: "life_satisfaction",
    section: "life_outlook",
    text: "Overall, how satisfied are you with life as a whole these days?",
    type: "scale_0_10",
    anchors: { left: "Not satisfied at all", right: "Completely satisfied" },
    required: false,
    instrument: null,
  },
  {
    id: "life_happy",
    section: "life_outlook",
    text: "In general, how happy or unhappy do you usually feel?",
    type: "scale_0_10",
    anchors: { left: "Extremely unhappy", right: "Extremely happy" },
    required: false,
    instrument: null,
  },
  {
    id: "life_worthwhile",
    section: "life_outlook",
    text: "Overall, to what extent do you feel the things you do in your life are worthwhile?",
    type: "scale_0_10",
    anchors: { left: "Not at all worthwhile", right: "Completely worthwhile" },
    required: false,
    instrument: null,
  },
  {
    id: "life_purpose",
    section: "life_outlook",
    text: "I understand my purpose in life.",
    type: "scale_0_10",
    anchors: { left: "Strongly disagree", right: "Strongly agree" },
    required: false,
    instrument: null,
  },

  // ────────────────────────────────────────────────────────────
  // Block A2 — Domain satisfaction (3 items)
  // ────────────────────────────────────────────────────────────
  {
    id: "life_relationships_satisfying",
    section: "life_outlook",
    text: "My relationships are as satisfying as I would want them to be.",
    type: "scale_0_10",
    anchors: { left: "Strongly disagree", right: "Strongly agree" },
    required: false,
    instrument: null,
  },
  {
    id: "life_physical_health",
    section: "life_outlook",
    text: "In general, how would you rate your physical health?",
    type: "scale_0_10",
    anchors: { left: "Poor", right: "Excellent" },
    required: false,
    instrument: null,
  },
  {
    id: "life_mental_health",
    section: "life_outlook",
    text: "How would you rate your overall mental health?",
    type: "scale_0_10",
    anchors: { left: "Poor", right: "Excellent" },
    required: false,
    instrument: null,
  },

  // ────────────────────────────────────────────────────────────
  // Block A3 — Founder-specific need frustration (2 items, NEW)
  // Single-item proxies for autonomy- and relatedness-frustration in
  // the founder role. Pair with MBI exhaustion/cynicism to attribute
  // burnout to its upstream pathway (Van den Broeck 2016; Cardon 2024).
  // ────────────────────────────────────────────────────────────
  {
    id: "life_have_to",
    section: "life_outlook",
    text: "Most of what I do as a founder feels like 'I have to' rather than 'I want to.'",
    type: "scale_0_10",
    anchors: { left: "Strongly disagree", right: "Strongly agree" },
    required: false,
    instrument: null,
  },
  {
    id: "life_alone",
    section: "life_outlook",
    text: "I feel alone carrying the weight of this company.",
    type: "scale_0_10",
    anchors: { left: "Strongly disagree", right: "Strongly agree" },
    required: false,
    instrument: null,
  },
];

// ============================================================
// Section 3: Ambition (16 items: 3 drive + 2 breadth/identity
//                       + 4 aspirations + 7 regulation)
// Stored in section_ambition column.
// Redesigned 2026-05-01 — see
// docs/survey-design-rationale-life-ambition-burnout.md
// ============================================================

const AGREE_5 = [
  "Strongly disagree",
  "Disagree",
  "Neither agree nor disagree",
  "Agree",
  "Strongly agree",
];

const IMPORTANCE_5 = [
  "Not at all important",
  "Slightly important",
  "Moderately important",
  "Very important",
  "Extremely important",
];

// Ambition is a 16-item instrument organized into four blocks:
// drive intensity (Hirschi/Spurk), breadth & identity, aspiration
// content (Kasser-Ryan), and regulation type (Deci-Ryan PLOC). The
// regulation block is the analytical centerpiece for the Deep Ambition
// research project — it captures the introjected→identified→integrated
// shift that the project is built around. See
// docs/survey-design-rationale-life-ambition-burnout.md.
const ambitionQuestions: Question[] = [
  // ────────────────────────────────────────────────────────────
  // Block B1 — Drive intensity (Hirschi/Spurk core, 3 items)
  // Trimmed from the 5-item validated scale; the 3-item subset retains
  // α ≈ .85 and frees room for the regulation block below.
  // ────────────────────────────────────────────────────────────
  {
    id: "amb_ambitious",
    section: "ambition",
    text: "I am ambitious.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "amb_strive",
    section: "ambition",
    text: "I strive for success.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "amb_challenging_goals",
    section: "ambition",
    text: "I have challenging goals.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },

  // ────────────────────────────────────────────────────────────
  // Block B2 — Ambition breadth & identity (2 items)
  // Multi-domain breadth is a Deep Ambition protective factor;
  // identity-work entanglement predicts identity collapse on failure.
  // ────────────────────────────────────────────────────────────
  {
    id: "amb_multi_domain",
    section: "ambition",
    text: "I am pursuing ambitious goals in more than one domain of my life (e.g., work, creative work, physical, relational, spiritual).",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "amb_identity_professional",
    section: "ambition",
    text: "My identity is primarily defined by what I do professionally.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
    reverseCoded: true,
  },

  // ────────────────────────────────────────────────────────────
  // Block B3 — Aspiration content (Kasser-Ryan importance, 4 items, NEW)
  // Importance-only short form of the Aspiration Index. Captures the
  // intrinsic/extrinsic ratio that Niemiec et al. 2009 showed predicts
  // well-being independently of attainment (β = .77 vs β = .00).
  // Score: intrinsic_score = mean(asp_helping, asp_self_knowledge);
  // extrinsic_score = mean(asp_financial, asp_admiration);
  // aspiration_ratio = intrinsic_score - extrinsic_score.
  // ────────────────────────────────────────────────────────────
  {
    id: "asp_helping",
    section: "ambition",
    text: "How important to you is the following: Helping others improve their lives.",
    type: "likert5",
    options: IMPORTANCE_5,
    required: false,
    instrument: null,
  },
  {
    id: "asp_self_knowledge",
    section: "ambition",
    text: "How important to you is the following: Knowing and accepting who I really am.",
    type: "likert5",
    options: IMPORTANCE_5,
    required: false,
    instrument: null,
  },
  {
    id: "asp_financial",
    section: "ambition",
    text: "How important to you is the following: Being financially successful.",
    type: "likert5",
    options: IMPORTANCE_5,
    required: false,
    instrument: null,
  },
  {
    id: "asp_admiration",
    section: "ambition",
    text: "How important to you is the following: Being admired and recognized by many people.",
    type: "likert5",
    options: IMPORTANCE_5,
    required: false,
    instrument: null,
  },

  // ────────────────────────────────────────────────────────────
  // Block B4 — Regulation type (Deci-Ryan PLOC continuum, 7 items, NEW)
  // The full continuum from amotivation through intrinsic motivation,
  // with external regulation split into approach (rewards) and avoidance
  // (consequences) poles. Identified and integrated are kept separate
  // for descriptive richness but should be combined into an autonomous-
  // regulation composite for predictive modeling.
  // RAI = -3·external_avoid - 3·external_approach - 2·introjected
  //       + 1·identified + 2·integrated + 3·intrinsic
  // (amotivation reported separately).
  // ────────────────────────────────────────────────────────────
  {
    id: "reg_external_avoid",
    section: "ambition",
    text: "I am working on my company because other people (investors, peers, family) expect me to, and there would be real consequences if I quit.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "reg_external_approach",
    section: "ambition",
    text: "I am working on my company because of the rewards it can bring me — money, status, recognition.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "reg_introjected",
    section: "ambition",
    text: "I am working on my company because I would feel guilty or like a failure if I quit.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "reg_identified",
    section: "ambition",
    text: "I am working on my company because I genuinely value what we're building, regardless of how it turns out.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "reg_integrated",
    section: "ambition",
    text: "I am working on my company because it's an expression of who I am at my core — coherent with my other values and the rest of my life.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "reg_intrinsic",
    section: "ambition",
    text: "I am working on my company because I find the work itself genuinely enjoyable.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "reg_amotivation",
    section: "ambition",
    text: "I am working on my company because — honestly, I'm not sure why anymore.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
];

// ============================================================
// Section 4: Founder-Specific Challenges (14 items, no ranking)
// ============================================================

const CHALLENGE_5 = [
  "Not a challenge for me",
  "Minor challenge",
  "Moderate challenge",
  "Significant challenge",
  "Major challenge",
];

const isCofounder = (r: FlatResponses) => r["company_role"] !== "Solo Founder";

const founderChallengeQuestions: Question[] = [
  // Self-Leadership
  {
    id: "fc_own_way",
    section: "founder_challenges",
    text: "I keep getting in my own way.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_ic_to_leader",
    section: "founder_challenges",
    text: "I struggle to evolve from being a technical/functional contributor to being a leader.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_operational_trap",
    section: "founder_challenges",
    text: "I am trapped in operational details instead of being strategic.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_fraud",
    section: "founder_challenges",
    text: "I feel like a fraud or pretend leader.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  // Team & Execution
  {
    id: "fc_accountability",
    section: "founder_challenges",
    text: "I struggle to hold my team accountable.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_hard_conversations",
    section: "founder_challenges",
    text: "I avoid hard calls and difficult conversations I know I need to have.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_team_slow",
    section: "founder_challenges",
    text: "Our team is moving too slowly given what we need to accomplish.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  // Cofounder & Board
  {
    id: "fc_cofounder_friction",
    section: "founder_challenges",
    text: "There is too much friction between me and my cofounder(s).",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
    condition: isCofounder,
  },
  {
    id: "fc_board_conflict",
    section: "founder_challenges",
    text: "I am dealing with conflict with my board or investors.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  // Existential Business Anxiety
  {
    id: "fc_runway_worry",
    section: "founder_challenges",
    text: "I am worried we will run out of money.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_next_round",
    section: "founder_challenges",
    text: "I am worried we won't be able to raise our next round.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_pivot",
    section: "founder_challenges",
    text: "I am worried we may need to pivot the company.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_growth",
    section: "founder_challenges",
    text: "We are not growing fast enough.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
  {
    id: "fc_competition",
    section: "founder_challenges",
    text: "I am anxious about competition.",
    type: "likert5",
    options: CHALLENGE_5,
    required: false,
    instrument: null,
  },
];

// ============================================================
// Section 5 — LEGACY: macro_outlook is no longer populated by the
// survey. The 2 AI sentiment items moved into life_outlook (the
// merged "Outlook" section). The 2 economy items were dropped.
// section_macro_outlook column is preserved for older respondents.
// ============================================================

const macroOutlookQuestions: Question[] = [];

// ============================================================
// Section 6: Cofounder Relationship Quality (9 items, skip if solo)
// ============================================================

const cofounderQuestions: Question[] = [
  // Demographic context for the primary cofounder relationship.
  // Asked first so subsequent attitudinal items have shared referent.
  {
    id: "cf_gender",
    section: "cofounder",
    text: "What is your primary cofounder's gender?",
    type: "single_select",
    options: ["Male", "Female", "Non-binary", "Prefer not to say"],
    required: false,
    instrument: null,
  },
  {
    id: "cf_role",
    section: "cofounder",
    text: "What is your primary cofounder's role?",
    type: "single_select",
    options: [
      "CEO",
      "CTO",
      "COO",
      "CPO / Head of Product",
      "Head of Design",
      "Head of Engineering",
      "Other",
    ],
    required: false,
    instrument: null,
  },
  {
    id: "cf_aligned_vision",
    section: "cofounder",
    text: "My cofounder and I are aligned on where we want to take the company.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "cf_quality_standards",
    section: "cofounder",
    text: "My cofounder and I share the same standards for quality and excellence.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "cf_trust_do",
    section: "cofounder",
    text: "I trust my cofounder to do what they say they'll do.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "cf_honest_doubts",
    section: "cofounder",
    text: "I can be honest with my cofounder about my doubts, fears, and mistakes.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "cf_work_through",
    section: "cofounder",
    text: "When my cofounder and I disagree, we work through it rather than avoid it.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "cf_difficult_topics",
    section: "cofounder",
    text: "I can raise difficult topics with my cofounder without it damaging the relationship.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "cf_roles",
    section: "cofounder",
    text: "My cofounder and I have clear, agreed-upon roles and decision rights.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "cf_fair_division",
    section: "cofounder",
    text: "The division of labor between my cofounder and me feels fair.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: null,
  },
  {
    id: "cf_overall_health",
    section: "cofounder",
    text: "Overall, how would you rate the health of your cofounder relationship today?",
    type: "scale_0_10",
    anchors: { left: "Very unhealthy", right: "Very healthy" },
    required: false,
    instrument: null,
  },
];

// ============================================================
// Section 7: PHQ-9 Depression Screening (existing, 9 items)
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
    required: false,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_2",
    section: "depression",
    text: "Feeling down, depressed, or hopeless",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: false,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_3",
    section: "depression",
    text: "Trouble falling or staying asleep, or sleeping too much",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: false,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_4",
    section: "depression",
    text: "Feeling tired or having little energy",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: false,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_5",
    section: "depression",
    text: "Poor appetite or overeating",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: false,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_6",
    section: "depression",
    text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: false,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_7",
    section: "depression",
    text: "Trouble concentrating on things, such as reading the newspaper or watching television",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: false,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_8",
    section: "depression",
    text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: false,
    instrument: "PHQ-9",
  },
  {
    id: "phq9_9",
    section: "depression",
    text: "Thoughts that you would be better off dead or of hurting yourself in some way",
    type: "likert4",
    options: PHQ9_OPTIONS,
    required: false,
    instrument: "PHQ-9",
  },
];

// ============================================================
// Section 8: GAD-7 Anxiety Screening (existing, 7 items)
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
    required: false,
    instrument: "GAD-7",
  },
  {
    id: "gad7_2",
    section: "anxiety",
    text: "Not being able to stop or control worrying",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: false,
    instrument: "GAD-7",
  },
  {
    id: "gad7_3",
    section: "anxiety",
    text: "Worrying too much about different things",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: false,
    instrument: "GAD-7",
  },
  {
    id: "gad7_4",
    section: "anxiety",
    text: "Trouble relaxing",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: false,
    instrument: "GAD-7",
  },
  {
    id: "gad7_5",
    section: "anxiety",
    text: "Being so restless that it is hard to sit still",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: false,
    instrument: "GAD-7",
  },
  {
    id: "gad7_6",
    section: "anxiety",
    text: "Becoming easily annoyed or irritable",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: false,
    instrument: "GAD-7",
  },
  {
    id: "gad7_7",
    section: "anxiety",
    text: "Feeling afraid as if something awful might happen",
    type: "likert4",
    options: GAD7_OPTIONS,
    required: false,
    instrument: "GAD-7",
  },
];

// ============================================================
// Section 9: Burnout (MBI-GS, 9 items + 1 attention check)
// ============================================================

const MBI_OPTIONS = [
  "Never",
  "A few times a year",
  "Once a month or less",
  "A few times a month",
  "Once a week",
  "A few times a week",
  "Every day",
];

const burnoutQuestions: Question[] = [
  // Exhaustion
  {
    id: "mbi_exhaust_1",
    section: "burnout",
    text: "I feel emotionally drained from my work.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
  },
  {
    id: "mbi_exhaust_2",
    section: "burnout",
    text: "I feel used up at the end of a workday.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
  },
  {
    id: "mbi_exhaust_3",
    section: "burnout",
    text: "I feel tired when I get up in the morning and have to face another day on the job.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
  },
  // Cynicism
  {
    id: "mbi_cynicism_1",
    section: "burnout",
    text: "I have become less interested in my work since I started this job.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
  },
  {
    id: "mbi_cynicism_2",
    section: "burnout",
    text: "I have become less enthusiastic about my work.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
  },
  {
    id: "mbi_cynicism_3",
    section: "burnout",
    text: "I have become more cynical about whether my work contributes anything.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
  },
  // Attention check (placed in middle third, after cynicism items)
  {
    id: "attn_1",
    section: "burnout",
    text: "Please select 'A few times a month' for this item.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: null,
    attentionCheck: true,
  },
  // Professional Efficacy (all reverse-coded)
  {
    id: "mbi_efficacy_1",
    section: "burnout",
    text: "In my opinion, I am good at my job.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
    reverseCoded: true,
  },
  {
    id: "mbi_efficacy_2",
    section: "burnout",
    text: "I feel exhilarated when I accomplish something at work.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
    reverseCoded: true,
  },
  {
    id: "mbi_efficacy_3",
    section: "burnout",
    text: "I have accomplished many worthwhile things in this job.",
    type: "likert7",
    options: MBI_OPTIONS,
    required: false,
    instrument: "MBI-GS",
    reverseCoded: true,
  },
];

// ============================================================
// Section 10: ADHD ASRS-6 (existing, 6 items)
// ============================================================

const ASRS_OPTIONS = ["Never", "Rarely", "Sometimes", "Often", "Very often"];

const adhdQuestions: Question[] = [
  {
    id: "asrs_1",
    section: "adhd",
    text: "How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: false,
    instrument: "ASRS",
  },
  {
    id: "asrs_2",
    section: "adhd",
    text: "How often do you have difficulty getting things in order when you have to do a task that requires organization?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: false,
    instrument: "ASRS",
  },
  {
    id: "asrs_3",
    section: "adhd",
    text: "How often do you have problems remembering appointments or obligations?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: false,
    instrument: "ASRS",
  },
  {
    id: "asrs_4",
    section: "adhd",
    text: "When you have a task that requires a lot of thought, how often do you avoid or delay getting started?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: false,
    instrument: "ASRS",
  },
  {
    id: "asrs_5",
    section: "adhd",
    text: "How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: false,
    instrument: "ASRS",
  },
  {
    id: "asrs_6",
    section: "adhd",
    text: "How often do you feel overly active and compelled to do things, like you were driven by a motor?",
    type: "likert5",
    options: ASRS_OPTIONS,
    required: false,
    instrument: "ASRS",
  },
];

// ============================================================
// Section 11: Autism AQ-10 + 3 diagnosis follow-ups
// ============================================================

const AQ_OPTIONS = [
  "Definitely agree",
  "Slightly agree",
  "Slightly disagree",
  "Definitely disagree",
];

const autismQuestions: Question[] = [
  {
    id: "aq_1",
    section: "autism",
    text: "I often notice small sounds when others do not.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
  },
  {
    id: "aq_2",
    section: "autism",
    text: "I usually concentrate more on the whole picture, rather than small details.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
    reverseCoded: true,
  },
  {
    id: "aq_3",
    section: "autism",
    text: "I find it easy to do more than one thing at once.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
    reverseCoded: true,
  },
  {
    id: "aq_4",
    section: "autism",
    text: "If there is an interruption, I can switch back to what I was doing very quickly.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
    reverseCoded: true,
  },
  {
    id: "aq_5",
    section: "autism",
    text: "I find it easy to 'read between the lines' when someone is talking to me.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
    reverseCoded: true,
  },
  {
    id: "aq_6",
    section: "autism",
    text: "I know how to tell if someone listening to me is getting bored.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
    reverseCoded: true,
  },
  {
    id: "aq_7",
    section: "autism",
    text: "When I'm reading a story, I find it difficult to work out the characters' intentions.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
  },
  {
    id: "aq_8",
    section: "autism",
    text: "I like to collect information about categories of things (e.g., types of car, types of bird, types of train, types of plant).",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
  },
  {
    id: "aq_9",
    section: "autism",
    text: "I find it easy to work out what someone is thinking or feeling just by looking at their face.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
    reverseCoded: true,
  },
  {
    id: "aq_10",
    section: "autism",
    text: "I find it difficult to work out people's intentions.",
    type: "likert4",
    options: AQ_OPTIONS,
    required: false,
    instrument: "AQ-10",
  },
  // Diagnosis follow-ups
  {
    id: "nd_adhd_diagnosis",
    section: "autism",
    text: "Have you ever been formally diagnosed with ADHD?",
    type: "single_select",
    options: ["Yes", "No", "Suspected but not diagnosed", "Prefer not to say"],
    required: false,
    instrument: null,
  },
  {
    id: "nd_autism_diagnosis",
    section: "autism",
    text: "Have you ever been formally diagnosed with autism or Asperger's?",
    type: "single_select",
    options: ["Yes", "No", "Suspected but not diagnosed", "Prefer not to say"],
    required: false,
    instrument: null,
  },
  {
    id: "nd_other_diagnosis",
    section: "autism",
    text: "Have you ever been formally diagnosed with any other neurodivergent condition (e.g., dyslexia, dyscalculia, Tourette's)?",
    type: "single_select",
    options: ["Yes", "No", "Prefer not to say"],
    required: false,
    instrument: null,
  },
  {
    id: "nd_other_specify",
    section: "autism",
    text: "If yes, please specify:",
    type: "text",
    required: false,
    instrument: null,
    maxLength: 200,
    specifyIf: { questionId: "nd_other_diagnosis", value: "Yes" },
  },
];

// ============================================================
// Section 12: Dirty Dozen Dark Triad (12 items)
// ============================================================

const darkTriadQuestions: Question[] = [
  // Machiavellianism
  {
    id: "dd_m_1",
    section: "dark_triad",
    text: "I have used deceit or lied to get my way.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_m_2",
    section: "dark_triad",
    text: "I have used flattery to get my way.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_m_3",
    section: "dark_triad",
    text: "I tend to manipulate others to get my way.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_m_4",
    section: "dark_triad",
    text: "I tend to exploit others towards my own end.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  // Psychopathy
  {
    id: "dd_p_1",
    section: "dark_triad",
    text: "I tend to lack remorse.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_p_2",
    section: "dark_triad",
    text: "I tend to be unconcerned with the morality of my actions.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_p_3",
    section: "dark_triad",
    text: "I tend to be callous or insensitive.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_p_4",
    section: "dark_triad",
    text: "I tend to be cynical.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  // Narcissism
  {
    id: "dd_n_1",
    section: "dark_triad",
    text: "I tend to want others to admire me.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_n_2",
    section: "dark_triad",
    text: "I tend to want others to pay attention to me.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_n_3",
    section: "dark_triad",
    text: "I tend to seek prestige or status.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
  {
    id: "dd_n_4",
    section: "dark_triad",
    text: "I tend to expect special favors from others.",
    type: "likert5",
    options: AGREE_5,
    required: false,
    instrument: "DD",
  },
];

// ============================================================
// Section 13: Social Support & Connection (4 items)
// ============================================================

const socialSupportQuestions: Question[] = [
  {
    id: "ss_could_confide_work",
    section: "social_support",
    text: "How many people outside your company could you confide in about work struggles?",
    type: "number",
    required: false,
    instrument: null,
  },
  {
    id: "ss_could_confide_personal",
    section: "social_support",
    text: "How many people outside your company could you confide in about personal struggles?",
    type: "number",
    required: false,
    instrument: null,
  },
  {
    id: "ss_confide_work_freq",
    section: "social_support",
    text: "In the past month, how many times did you confide in someone outside your company about work struggles?",
    type: "number",
    required: false,
    instrument: null,
  },
  {
    id: "ss_confide_personal_freq",
    section: "social_support",
    text: "In the past month, how many times did you confide in someone outside your company about personal struggles?",
    type: "number",
    required: false,
    instrument: null,
  },
];

// ============================================================
// Section 14: Help-Seeking & Mental Health Support
// ============================================================

const therapyEver = (r: FlatResponses) => r["hs_therapy_ever"] === "Yes";
const therapyCurrent = (r: FlatResponses) =>
  therapyEver(r) && r["hs_therapy_current"] === "Yes";
const coachEver = (r: FlatResponses) => r["hs_coach_ever"] === "Yes";
const coachCurrent = (r: FlatResponses) =>
  coachEver(r) && r["hs_coach_current"] === "Yes";
const consideredButNot = (r: FlatResponses) =>
  r["hs_considered_no_go"] === "Yes";

const helpSeekingQuestions: Question[] = [
  // Therapy block
  {
    id: "hs_therapy_ever",
    section: "help_seeking",
    text: "Have you ever worked with a therapist or counselor?",
    type: "yes_no",
    options: ["Yes", "No"],
    required: false,
    instrument: null,
  },
  {
    id: "hs_therapy_count",
    section: "help_seeking",
    text: "How many therapists have you worked with in your lifetime?",
    type: "number_bounded",
    min: 0,
    max: 50,
    required: false,
    instrument: null,
    condition: therapyEver,
  },
  {
    id: "hs_therapy_current",
    section: "help_seeking",
    text: "Are you currently in therapy?",
    type: "yes_no",
    options: ["Yes", "No"],
    required: false,
    instrument: null,
    condition: therapyEver,
  },
  {
    id: "hs_therapy_duration",
    section: "help_seeking",
    text: "How long have you been with your current therapist?",
    type: "single_select",
    options: ["Under 3 months", "3-12 months", "1-3 years", "3+ years"],
    required: false,
    instrument: null,
    condition: therapyCurrent,
  },
  {
    id: "hs_therapy_impact",
    section: "help_seeking",
    text: "How would you rate the overall impact of therapy on your life?",
    type: "scale_0_10",
    anchors: { left: "Strongly negative", right: "Strongly positive" },
    required: false,
    instrument: null,
    condition: therapyEver,
  },
  // Coaching block
  {
    id: "hs_coach_ever",
    section: "help_seeking",
    text: "Have you ever worked with an executive, leadership, or other professional coach?",
    type: "yes_no",
    options: ["Yes", "No"],
    required: false,
    instrument: null,
  },
  {
    id: "hs_coach_count",
    section: "help_seeking",
    text: "How many coaches have you worked with in your lifetime?",
    type: "number_bounded",
    min: 0,
    max: 50,
    required: false,
    instrument: null,
    condition: coachEver,
  },
  {
    id: "hs_coach_current",
    section: "help_seeking",
    text: "Are you currently working with a coach?",
    type: "yes_no",
    options: ["Yes", "No"],
    required: false,
    instrument: null,
    condition: coachEver,
  },
  {
    id: "hs_coach_type",
    section: "help_seeking",
    text: "What kind of coach?",
    type: "single_select",
    options: [
      "Executive / leadership",
      "Cofounder or partnership",
      "Life",
      "Performance",
      "Other",
    ],
    required: false,
    instrument: null,
    condition: coachCurrent,
  },
  {
    id: "hs_coach_impact",
    section: "help_seeking",
    text: "How would you rate the overall impact of coaching on your life?",
    type: "scale_0_10",
    anchors: { left: "Strongly negative", right: "Strongly positive" },
    required: false,
    instrument: null,
    condition: coachEver,
  },
  // Barriers
  {
    id: "hs_considered_no_go",
    section: "help_seeking",
    text: "In the last 12 months, have you considered seeking mental health support but didn't?",
    type: "yes_no",
    options: ["Yes", "No"],
    required: false,
    instrument: null,
  },
  {
    id: "hs_barriers",
    section: "help_seeking",
    text: "What got in the way? (select all that apply)",
    type: "multi_select",
    options: [
      "Cost",
      "Time",
      "Didn't know where to start",
      "Concerned about stigma or what investors/employees would think",
      "Didn't think my issues were serious enough",
      "Previous bad experience with mental health care",
      "Couldn't find someone who understood founders",
      "Other",
    ],
    required: false,
    instrument: null,
    condition: consideredButNot,
  },
  {
    id: "hs_leave",
    section: "help_seeking",
    text: "In the last 12 months, have you taken a mental health leave or extended break from work?",
    type: "yes_no",
    options: ["Yes", "No"],
    required: false,
    instrument: null,
  },
];

// ============================================================
// Section 15: Medication (1 multi-select)
// ============================================================

const medicationQuestions: Question[] = [
  {
    id: "med_current",
    section: "medication",
    text: "Are you currently taking any of the following? Select all that apply. Responses are anonymous.",
    type: "multi_select",
    options: [
      "SSRI or SNRI antidepressant (e.g., Lexapro, Zoloft, Prozac, Wellbutrin, Effexor)",
      "Stimulant for ADHD (e.g., Adderall, Vyvanse, Concerta, Ritalin)",
      "Benzodiazepine (e.g., Xanax, Ativan, Klonopin)",
      "Prescription sleep medication (e.g., Ambien, Lunesta, trazodone)",
      "Beta blocker for performance or anxiety (e.g., propranolol)",
      "Mood stabilizer or antipsychotic (e.g., lithium, lamotrigine, quetiapine)",
      "Other psychiatric medication",
      "None of the above",
      "Prefer not to say",
    ],
    required: false,
    instrument: null,
  },
];

// ============================================================
// Section 16: Substance Use (10 items + AUDIT-C follow-ups)
// ============================================================

const SUBSTANCE_FREQ = [
  "Never",
  "Once or twice",
  "Monthly",
  "Weekly",
  "2-3 times per week",
  "Daily or near-daily",
];

// AUDIT-C shows if alcohol frequency is Monthly or more often.
const alcoholMonthlyPlus = (r: FlatResponses) => {
  const v = r["sub_alcohol"];
  return (
    v === "Monthly" ||
    v === "Weekly" ||
    v === "2-3 times per week" ||
    v === "Daily or near-daily"
  );
};

const substanceQuestions: Question[] = [
  {
    id: "sub_alcohol",
    section: "substance_use",
    text: "Alcohol",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_cannabis",
    section: "substance_use",
    text: "Cannabis / marijuana",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_nicotine",
    section: "substance_use",
    text: "Nicotine (cigarettes, vapes, pouches)",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_stimulants_no_rx",
    section: "substance_use",
    text: "Stimulants obtained without a prescription (e.g., Adderall, cocaine)",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_mdma",
    section: "substance_use",
    text: "MDMA",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_psilocybin",
    section: "substance_use",
    text: "Psilocybin (\"magic mushrooms\")",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_ayahuasca",
    section: "substance_use",
    text: "Ayahuasca or DMT",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_lsd",
    section: "substance_use",
    text: "LSD or other psychedelics",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_ketamine",
    section: "substance_use",
    text: "Ketamine (recreational, not prescribed)",
    type: "likert6_freq",
    options: SUBSTANCE_FREQ,
    required: false,
    instrument: null,
  },
  {
    id: "sub_other",
    section: "substance_use",
    text: "Other substances (optional):",
    type: "text",
    required: false,
    instrument: null,
    maxLength: 200,
  },
  // AUDIT-C follow-ups — alcohol frequency ≥ Monthly
  {
    id: "auditc_drinks_per_day",
    section: "substance_use",
    text: "How many drinks containing alcohol do you have on a typical day when drinking?",
    type: "single_select",
    options: ["1-2", "3-4", "5-6", "7-9", "10+"],
    required: false,
    instrument: "AUDIT-C",
    condition: alcoholMonthlyPlus,
  },
  {
    id: "auditc_binge_freq",
    section: "substance_use",
    text: "How often do you have 5 or more drinks on one occasion?",
    type: "single_select",
    options: [
      "Never",
      "Less than monthly",
      "Monthly",
      "Weekly",
      "Daily or near-daily",
    ],
    required: false,
    instrument: "AUDIT-C",
    condition: alcoholMonthlyPlus,
  },
];

// ============================================================
// Section 17: Open-ended (optional)
// ============================================================

const openEndedQuestions: Question[] = [
  {
    id: "open_reflection",
    section: "open_ended",
    text: "Is there anything else about your mental health, wellbeing, or life as a founder that you'd like to share? (Optional)",
    type: "text_long",
    required: false,
    instrument: null,
    maxLength: 1000,
  },
];

// ============================================================
// Section 4 legacy alias — founder_stress column still exists but is
// no longer populated by the survey. (Kept in SECTION_ORDER as an
// internal no-op to avoid breaking migrations that reference the
// column; the section itself is hidden via condition: () => false.)
// ============================================================

const founderStressQuestions: Question[] = [];

// ============================================================
// Sections metadata (order matters — this is the canonical survey flow)
// ============================================================

const isSoloFounder = (r: FlatResponses) => r["company_role"] === "Solo Founder";

export const SECTIONS: SectionMeta[] = [
  {
    id: "company",
    label: "About You & Your Company",
    intro: "Tell us a bit about yourself and your startup.",
  },
  {
    id: "founder_challenges",
    label: "Founder-Specific Challenges",
    intro:
      "For each statement, rate how much of a challenge this is for you right now.",
  },
  {
    id: "cofounder",
    label: "Cofounder Relationship",
    intro:
      "These questions are about your primary cofounder relationship. If you have multiple cofounders, answer about the one you work most closely with.",
    condition: (r) => !isSoloFounder(r),
  },
  {
    id: "life_outlook",
    label: "Outlook",
    intro:
      "How life is going from where you sit — overall well-being, key life domains, and the felt experience of running this company. All items use a 0–10 scale.",
  },
  {
    id: "ambition",
    label: "Ambition",
    intro:
      "Reflect on what you're driving toward — how hard, what kind of success matters most to you, and what's motivating the work day-to-day.",
  },
  {
    id: "macro_outlook",
    label: "Outlook on AI and the Economy (legacy)",
    intro: "",
    // Merged into life_outlook. Section hidden; column preserved.
    condition: () => false,
  },
  {
    id: "depression",
    label: "How You've Been Feeling",
    intro: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    postSection: "crisis_resources",
  },
  {
    id: "anxiety",
    label: "Worry & Anxiety",
    intro: "Over the last 2 weeks, how often have you been bothered by the following problems?",
  },
  {
    id: "burnout",
    label: "Burnout",
    intro: "For each statement, indicate how often it applies to your work.",
  },
  {
    id: "adhd",
    label: "Focus & Attention",
    intro: "How often do you experience the following?",
  },
  {
    id: "autism",
    label: "Perception & Social Processing",
    intro: "To what extent do you agree with the following statements?",
  },
  {
    id: "dark_triad",
    label: "Personality",
    intro: "Please indicate how much you agree with each statement.",
  },
  {
    id: "social_support",
    label: "Social Support & Connection",
    intro: "A few questions about the people in your life.",
  },
  {
    id: "help_seeking",
    label: "Help-Seeking & Mental Health Support",
    intro: "Your experience with therapy, coaching, and mental health support.",
  },
  {
    id: "medication",
    label: "Medication",
    intro: "",
  },
  {
    id: "substance_use",
    label: "Substance Use",
    intro: "In the past 12 months, how often have you used each of the following?",
  },
  {
    id: "open_ended",
    label: "Anything Else?",
    intro: "Optional — one last place to share anything on your mind.",
  },
  // founder_stress legacy column: always hidden, never populated. Kept
  // only so that existing SECTION_ORDER-based code doesn't trip over a
  // missing id if anything in the codebase references it.
  {
    id: "founder_stress",
    label: "Founder Stress (legacy)",
    intro: "",
    condition: () => false,
  },
];

export const SECTION_ORDER: SectionId[] = SECTIONS.map((s) => s.id);

// ============================================================
// All Questions & Helpers
// ============================================================

export const ALL_QUESTIONS: Question[] = [
  ...companyQuestions,
  ...lifeOutlookQuestions,
  ...ambitionQuestions,
  ...founderChallengeQuestions,
  ...macroOutlookQuestions,
  ...cofounderQuestions,
  ...depressionQuestions,
  ...anxietyQuestions,
  ...burnoutQuestions,
  ...adhdQuestions,
  ...autismQuestions,
  ...darkTriadQuestions,
  ...socialSupportQuestions,
  ...helpSeekingQuestions,
  ...medicationQuestions,
  ...substanceQuestions,
  ...openEndedQuestions,
  ...founderStressQuestions,
];

export function getQuestionsBySection(sectionId: SectionId): Question[] {
  return ALL_QUESTIONS.filter((q) => q.section === sectionId);
}
