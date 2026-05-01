# Survey Design Rationale — Life Outlook, Ambition, Burnout

**Last updated:** 2026-05-01
**Sections affected:** `life_outlook`, `ambition`, `burnout`
**Theoretical backbone:** Self-Determination Theory (Deci & Ryan, 1985–2017); Aspiration Index (Kasser & Ryan, 1996); Hirschi/Spurk Career Ambition (2014); Maslach Burnout Inventory — General Survey (Schaufeli, Leiter, Maslach & Jackson, 1996).

---

## Why these three sections were redesigned together

The survey's earlier design treated `life_outlook`, `ambition`, and `burnout` as three independent measurement blocks. In practice, they are best understood as one integrated instrument with three layers:

- **Life Outlook = current experience.** How the founder feels and how their life is going right now (hedonic + eudaimonic well-being + key life domains + role-specific need frustration).
- **Ambition = values & motivation.** How hard the founder is driving, *what* they are driving toward (intrinsic vs. extrinsic goal content), and *why* (regulation type from external coercion through integrated self-expression).
- **Burnout (MBI-GS) = dysphoria endpoint.** The validated clinical-psychometric outcome that the upstream variables in the other two sections predict.

Read as one instrument, the trio supports a *typology* of founders (Default Ambition / Deep Ambition / Quiet Purpose / Drifting), an *attribution analysis* of burnout (which need is being thwarted to produce the exhaustion?), and a *content × regulation* split that mirrors the central empirical finding of the Self-Determination Theory literature (Niemiec, Ryan & Deci 2009: intrinsic-aspiration attainment β = .77, extrinsic-aspiration attainment β = .00 on well-being).

The redesign is theoretically grounded in the most replicated motivation framework in social psychology and is calibrated specifically to the questions the Deep Ambition research project needs to answer.

---

## What changed at a glance

| Section | Before | After | Δ |
|---|---|---|---|
| Life Outlook | 10 items (8 well-being + 2 AI sentiment) | 9 items (7 well-being + 2 founder-role frustration) | –1 |
| Ambition | 12 items (5 Hirschi/Spurk + 7 custom breadth) | 16 items (3 drive + 2 breadth/identity + 4 aspirations + 7 regulation) | +4 |
| Burnout (MBI-GS) | 10 items + 1 attention check | unchanged | 0 |
| **Total** | **33** | **36** | **+3** |

Three additional items in exchange for: a validated regulation continuum, a validated aspiration content split, two founder-specific need-frustration anchors, and a typology the previous instrument simply could not produce.

---

## Section A: Life Outlook (9 items)

The redesigned Life Outlook section captures three distinct facets of current experience. All items use a 0–10 scale for cross-comparability.

### Block A1 — Hedonic & eudaimonic well-being (4 items)

These four items together cover the standard distinction between *feeling good* (hedonic) and *life going well* (eudaimonic) — a contrast central to the post-Ryff well-being literature (Ryff 1989; Waterman 1993).

- **`life_satisfaction`** — Cantril ladder. Cross-comparable to Gallup, ONS, World Happiness Report data.
- **`life_happy`** — Affective baseline. Distinct from satisfaction; captures emotional tone vs. cognitive evaluation.
- **`life_worthwhile`** — ONS-4 worthwhile item. The single best one-item proxy for meaning. Should be more strongly predicted by intrinsic-aspiration content than `life_happy` is — that contrast itself is diagnostic.
- **`life_purpose`** — Purpose clarity. Distinct from `life_worthwhile` (which is appraisal); this is *epistemic certainty* about purpose. Founders can have high meaning + low clarity (the "I'm doing important work but I don't know why I'm doing it" state).

### Block A2 — Domain satisfaction (3 items)

Three global self-ratings of life domains that interact strongly with founder mental health.

- **`life_relationships_satisfying`** — Retained as the single relatedness anchor in the section. Avoids the cost of a full BPNSFS battery while still anchoring the SDT relatedness construct.
- **`life_physical_health`** — Predicts vitality, MBI exhaustion, and is the "ambition-broke-the-body" signal when paired with high drive items.
- **`life_mental_health`** — Self-rated mental health. Useful as an anchor against PHQ-9 / GAD-7 — large mismatches (e.g., high PHQ-9 score paired with high self-rated mental health) are themselves diagnostic of denial or normalization.

### Block A3 — Founder-specific need frustration (2 items, NEW)

These two items capture the autonomy- and relatedness-frustration pathways that lead directly into the burnout section. They are deliberately founder-specific (not general SDT items) because the construct of interest is the founder role.

- **`life_have_to`** *("Most of what I do as a founder feels like 'I have to' rather than 'I want to.'")* — Single-item proxy for autonomy frustration, the construct Van den Broeck et al. (2016) identified as the dominant burnout pathway (autonomy → burnout corrected ρ = –.60, accounting for 70% of the explained variance in workplace burnout). Pairs with MBI exhaustion to *attribute* exhaustion to autonomy-thwarting, not just measure it.
- **`life_alone`** *("I feel alone carrying the weight of this company.")* — Founder-specific relatedness frustration. Distinct from general relationship satisfaction (`life_relationships_satisfying`) and from the cofounder battery (which measures dyadic quality). Tracks the entrepreneurial loneliness construct (Cardon et al. 2024, *Personnel Psychology*: founders rated loneliness 7.6/10; loneliness predicts exhaustion, anxiety, depression, suicidal ideation).

### Items removed

- **`life_money_worry`** — Redundant with `fc_runway_worry` in the founder challenges section.
- **`macro_ai_business`, `macro_ai_society`** — These are industry sentiment items, not well-being. They don't belong in Life Outlook conceptually. Removed entirely; the legacy `macro_outlook` JSONB column is preserved for data continuity but no longer populated.

---

## Section B: Ambition (16 items)

The redesigned Ambition section is organized into four blocks, each measuring a distinct construct that the previous design either omitted or proxied weakly.

### Block B1 — Drive intensity (3 items, trimmed Hirschi/Spurk)

The Hirschi/Spurk Career Ambition Scale (2014) is the standard validated measure of ambition intensity. The full 5-item scale has α ≈ .89; the 3-item subset retained here gives α ≈ .85 in published samples — sufficient for a directional composite without spending five items.

- **`amb_ambitious`** — Self-identification with ambition. Face-valid anchor.
- **`amb_strive`** — Behavioral striving. Captures effort/persistence orientation, distinct from self-identification.
- **`amb_challenging_goals`** — Goal difficulty preference. The Locke-Latham anchor.

### Block B2 — Ambition breadth & identity (2 items)

These two items measure what the Deep Ambition framework treats as protective factors against the Default Ambition pathology.

- **`amb_multi_domain`** — The cleanest behavioral discriminator the survey can produce. The 1-domain vs. multi-domain founder is a key Deep Ambition dimension.
- **`amb_identity_professional`** *(reverse coded)* — Identity-work entanglement. High scorers are most vulnerable to identity collapse if the company fails; predicts the worst PHQ-9 outcomes during downturns and pivots.

### Block B3 — Aspiration content (4 items, importance-only Aspiration Index)

The Aspiration Index (Kasser & Ryan, 1996) is the instrument behind Niemiec et al. 2009's headline finding that intrinsic-aspiration attainment predicts well-being (β = .77) while extrinsic-aspiration attainment does not (β = .00). Including aspiration *content* lets the survey distinguish between founders pursuing the same outcome metrics for radically different reasons.

The full Aspiration Index has 35 items across 7 aspirations × 5 ratings (importance, attainment, likelihood). For survey-economy reasons we use **importance only** with **2 items per pole** — a 4-item form that loses the Niemiec mediation design but preserves the intrinsic/extrinsic *ratio*, which is the core deep ambition signal. Aspirations that overlapped with existing survey items (intimate relationships, physical health, image) were excluded to avoid duplicate measurement.

Stem: *"How important to you is each of the following?"* (1–5 importance scale)

- **`asp_helping`** *("Helping others improve their lives.")* — Intrinsic, community contribution.
- **`asp_self_knowledge`** *("Knowing and accepting who I really am.")* — Intrinsic, personal growth. The aspiration most strongly tied to integrated regulation in Kasser/Ryan datasets.
- **`asp_financial`** *("Being financially successful.")* — Extrinsic, wealth. The headline extrinsic aspiration in Kasser & Ryan 1993.
- **`asp_admiration`** *("Being admired and recognized by many people.")* — Extrinsic, fame/image. Captures status-seeking distinct from wealth.

**Composites:**
- `intrinsic_score = mean(asp_helping, asp_self_knowledge)`
- `extrinsic_score = mean(asp_financial, asp_admiration)`
- `aspiration_ratio = intrinsic_score – extrinsic_score`

### Block B4 — Regulation type (7 items, founder-adapted PLOC continuum)

The Perceived Locus of Causality framework (Ryan & Connell 1989) is the standard instrument for placing a respondent on the SDT regulation continuum. The 7-item block here covers the full Deci-Ryan continuum from amotivation through intrinsic motivation, with external regulation split into its two canonical sub-types (approach vs. avoidance).

Stem (presented to respondent in each item): *"I am working on my company because…"*

- **`reg_external_avoid`** *("…other people expect me to, and there would be real consequences if I quit.")* — External regulation, avoidance pole. Predicts anxiety symptomatology and the "trapped" pattern.
- **`reg_external_approach`** *("…of the rewards it can bring me — money, status, recognition.")* — External regulation, approach pole. Predicts post-exit "now what?" crash; high scorers are vulnerable to hedonic adaptation once rewards arrive. Compare to `asp_financial` + `asp_admiration` for content-vs-regulation divergence.
- **`reg_introjected`** *("…I would feel guilty or like a failure if I quit.")* — The Default Ambition signature. Janus-faced per Van den Broeck et al. 2021: predicts both engagement *and* burnout/distress. The single most diagnostic item for the "crushing it but feel terrible" pattern.
- **`reg_identified`** *("…I genuinely value what we're building, regardless of how it turns out.")* — Identified regulation. The first authentically self-determined position; founder consciously endorses the work's importance.
- **`reg_integrated`** *("…it's an expression of who I am at my core — coherent with my other values and the rest of my life.")* — The Deep Ambition signature proper. The shift from `reg_identified` to `reg_integrated` is the move from "I value this" to "this is me."
- **`reg_intrinsic`** *("…I find the work itself genuinely enjoyable.")* — Pure interest. Protected from extrinsic-reward decay; vulnerable when the work itself stops being fun (post-PMF, post-scale).
- **`reg_amotivation`** *("…honestly, I'm not sure why anymore.")* — The most damaging motivational state per Van den Broeck et al. 2021 (~34% of burnout variance, more than external regulation). High score paired with high MBI is a flashing red light.

**Empirical caveat on identified vs. integrated.** Most current SDT scales (including the Multidimensional Work Motivation Scale, Gagné et al. 2015) drop integrated regulation because respondents cannot reliably distinguish it from identified in self-report. The two items are kept separate here for descriptive richness — the integrated→identified distinction is theoretically central to Deep Ambition — but for predictive modeling they should be combined into a single autonomous-regulation composite.

**Composites:**
- `controlled_regulation = mean(reg_external_avoid, reg_external_approach, reg_introjected)`
- `autonomous_regulation = mean(reg_identified, reg_integrated, reg_intrinsic)`
- `RAI = –3·external_avoid – 3·external_approach – 2·introjected + 1·identified + 2·integrated + 3·intrinsic` (amotivation excluded; report separately)

### Items removed

- **`amb_outstanding_results`, `amb_great_things`** — Both correlate r > .7 with the retained Hirschi/Spurk items in published samples; redundant.
- **`amb_one_vs_many`** — Covered by `amb_multi_domain` reversed.
- **`amb_beyond_company`, `amb_outside_career`** — Both proxied better by the new aspiration content items.
- **`amb_sacrifices`** — Correlates near-perfectly with `amb_identity_professional`.
- **`amb_worth_it`** — Measures motivated reasoning ("the sacrifices will be worth it"), not values or ambition.

---

## Section C: Burnout (MBI-GS, unchanged)

The Maslach Burnout Inventory — General Survey is the gold-standard burnout instrument. It is retained intact. Its analytical role in the redesigned trio:

- **Exhaustion** items become the dependent variable that `life_have_to` (autonomy frustration), `reg_introjected`, and `reg_amotivation` items are predicting. The new design lets you do an attribution analysis: among exhausted founders, who is exhausted because of autonomy thwarting, who because of amotivation, who because of introjected pressure?
- **Cynicism** items pair with `reg_amotivation` and `life_alone` — cynicism is the social/meaning withdrawal that emerges when relatedness is frustrated and the "why" has gone hollow.
- **Efficacy** items (reverse-coded) double as a competence-satisfaction proxy — which is why the redesign does not add separate competence items.

---

## The typology this enables

Cross-tabulating the Hirschi/Spurk drive composite × the Relative Autonomy Index produces four founder archetypes:

| | High RAI (intrinsic / identified / integrated) | Low RAI (introjected / external) |
|---|---|---|
| **High drive** | **Deep Ambition** — high engagement, low burnout, high `life_worthwhile`. The book's protagonist. | **Default Ambition** — high engagement, *high* burnout, normal `life_satisfaction`, low `life_worthwhile`. The "crushing it but miserable" pattern. |
| **Low drive** | **Quiet Purpose** — moderate everything, high `life_worthwhile`, low PHQ-9. Founders who've already integrated and stopped performing ambition. | **Drifting** — low everything, high amotivation, high MBI cynicism. The pre-quit signature. |

Two overlays sub-classify each cell:

- **Aspiration ratio.** A Deep Ambition founder with extrinsic-heavy aspirations is "impressively pursuing the wrong scoreboard" — Niemiec's prediction is they will score high on `life_satisfaction` but low on `life_worthwhile` even when winning.
- **Multi-domain breadth + identity-work entanglement.** Mono-domain Default Ambition with high `amb_identity_professional` is the highest-risk profile in the dataset for catastrophic identity collapse on company failure.

These classifications are not directly observable from any single section in the previous design. The trio as redesigned makes them computable from a 36-item slice of the survey.

---

## Caveats

- **Identified vs. integrated regulation is empirically hard to distinguish.** Combine them in predictive models; report them separately only for descriptive purposes. (See Block B4 above.)
- **The 4-item Aspiration Index loses the Niemiec mediation design.** The `aspiration_ratio` composite captures the intrinsic/extrinsic balance but cannot replicate the importance × attainment × need-satisfaction mediation chain without attainment items. If a future expansion can afford 4 more items, add attainment ratings for the same 4 aspirations — that unlocks the Niemiec analysis.
- **The 3-item Hirschi/Spurk subset has lower α than the full 5-item scale.** Acceptable for directional composites; if the survey's psychometric standards demand α > .90, restore the two cut items.
- **Cross-cultural framing of autonomy.** Items are framed as *volitional self-endorsement*, not *independence from others* — consistent with Ryan & Deci (2017)'s explicit rejection of the autonomy-as-individualism reading and with Nalipay et al. (2019)'s cross-cultural validation across East/West samples.
- **Single-instrument cross-sectional findings should be reported with measurement-error attenuation in mind.** This applies to all SDT-related items. Longitudinal designs and meta-analytic effect sizes are more robust.

---

## References

- Chen, B., Vansteenkiste, M., et al. (2015). Basic psychological need satisfaction, need frustration, and need strength across four cultures. *Motivation and Emotion*, 39, 216–236.
- Deci, E. L., & Ryan, R. M. (1985, 2000, 2017). Foundational SDT publications.
- Gagné, M., et al. (2015). The Multidimensional Work Motivation Scale: Validation evidence in seven languages and nine countries. *European Journal of Work and Organizational Psychology*, 24(2), 178–196.
- Hirschi, A., & Spurk, D. (2014). The Career Ambition Scale.
- Johnston, M. M., & Finney, S. J. (2010). Measuring basic needs satisfaction: Evaluating previous research and conducting new psychometric evaluations of the Basic Needs Satisfaction in General Scale. *Contemporary Educational Psychology*, 35(4), 280–296.
- Kasser, T., & Ryan, R. M. (1996). Further examining the American dream: Differential correlates of intrinsic and extrinsic goals. *Personality and Social Psychology Bulletin*, 22(3), 280–287.
- Niemiec, C. P., Ryan, R. M., & Deci, E. L. (2009). The path taken: Consequences of attaining intrinsic and extrinsic aspirations in post-college life. *Journal of Research in Personality*, 43(3), 291–306.
- Ryan, R. M., & Connell, J. P. (1989). Perceived locus of causality and internalization. *Journal of Personality and Social Psychology*, 57(5), 749–761.
- Schaufeli, W. B., Leiter, M. P., Maslach, C., & Jackson, S. E. (1996). Maslach Burnout Inventory — General Survey.
- Van den Broeck, A., Ferris, D. L., Chang, C.-H., & Rosen, C. C. (2016). A review of self-determination theory's basic psychological needs at work. *Journal of Management*.
- Van den Broeck, A., Howard, J. L., Van Vaerenbergh, Y., Leroy, H., & Gagné, M. (2021). Beyond intrinsic and extrinsic motivation: A meta-analytic review and proposal. *Organizational Psychology Review*.

Companion wiki articles:
- `personal-knowledge-base/wiki/frameworks/self-determination-theory.md`
- `personal-knowledge-base/wiki/frameworks/sdt-measurement-and-psychometrics.md`
- `personal-knowledge-base/wiki/frameworks/founder-mental-health-research.md`
