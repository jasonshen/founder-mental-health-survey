import type { AllScores } from "../types";

interface Args {
  token: string;
  resultsUrl: string;
  scores: AllScores;
  interests: {
    report: boolean;
    coaching: boolean;
    retreat: boolean;
    plantMedicine: boolean;
    updates: boolean;
  };
}

const PHQ9_LABELS: Record<string, string> = {
  none: "None / Minimal",
  mild: "Mild",
  moderate: "Moderate",
  moderately_severe: "Moderately Severe",
  severe: "Severe",
};

const GAD7_LABELS: Record<string, string> = {
  none: "None / Minimal",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

function interestList(i: Args["interests"]): string[] {
  const list: string[] = [];
  if (i.report) list.push("Full report");
  if (i.coaching) list.push("Coaching resources");
  if (i.retreat) list.push("In-person retreat");
  if (i.plantMedicine) list.push("Plant medicine / psychedelic-assisted therapy");
  if (i.updates) list.push("Research updates");
  return list;
}

export function confirmationEmailSubject(): string {
  return "Your Founder Mental Health Survey results";
}

export function confirmationEmailHtml({
  token,
  resultsUrl,
  scores,
  interests,
}: Args): string {
  const crisis = scores.phq9.suicidal_ideation_flagged;
  const interestsL = interestList(interests);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Founder Mental Health Survey results</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;max-width:560px;">
<tr><td>

<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111;">Your results</h1>
<p style="margin:0 0 24px 0;color:#525252;font-size:14px;">Thanks for taking the Founder Mental Health Survey. Here's your raw scores.</p>

${
  crisis
    ? `
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:8px;margin-bottom:24px;">
  <p style="margin:0 0 8px 0;font-weight:600;color:#78350f;">If you're having thoughts of self-harm, please reach out:</p>
  <p style="margin:0;color:#78350f;font-size:14px;">
    <strong>988 Suicide &amp; Crisis Lifeline</strong> — call or text <strong>988</strong><br>
    <strong>Crisis Text Line</strong> — text <strong>HOME</strong> to <strong>741741</strong>
  </p>
</div>`
    : ""
}

<h2 style="margin:24px 0 12px 0;font-size:15px;font-weight:600;color:#111;border-bottom:1px solid #e5e5e5;padding-bottom:8px;">Depression (PHQ-9)</h2>
<p style="margin:0 0 4px 0;font-size:14px;color:#111;"><strong>Score:</strong> ${scores.phq9.score} / 27</p>
<p style="margin:0;font-size:14px;color:#525252;"><strong>Severity:</strong> ${PHQ9_LABELS[scores.phq9.severity] ?? scores.phq9.severity}</p>

<h2 style="margin:24px 0 12px 0;font-size:15px;font-weight:600;color:#111;border-bottom:1px solid #e5e5e5;padding-bottom:8px;">Anxiety (GAD-7)</h2>
<p style="margin:0 0 4px 0;font-size:14px;color:#111;"><strong>Score:</strong> ${scores.gad7.score} / 21</p>
<p style="margin:0;font-size:14px;color:#525252;"><strong>Severity:</strong> ${GAD7_LABELS[scores.gad7.severity] ?? scores.gad7.severity}</p>

<h2 style="margin:24px 0 12px 0;font-size:15px;font-weight:600;color:#111;border-bottom:1px solid #e5e5e5;padding-bottom:8px;">ADHD (ASRS-v1.1 Part A)</h2>
<p style="margin:0 0 4px 0;font-size:14px;color:#111;"><strong>Items flagged:</strong> ${scores.asrs.items_flagged} / 6</p>
<p style="margin:0;font-size:14px;color:#525252;"><strong>Threshold:</strong> ${scores.asrs.above_threshold ? "Above (4+ items) — further evaluation may be worthwhile" : "Below"}</p>

<div style="margin:32px 0;padding:20px;background:#f5f5f4;border-radius:8px;text-align:center;">
  <a href="${resultsUrl}" style="display:inline-block;background:#111;color:#ffffff;text-decoration:none;font-weight:500;padding:12px 24px;border-radius:8px;font-size:14px;">View your full results</a>
  <p style="margin:12px 0 0 0;font-size:12px;color:#737373;">Your code: <code style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${token}</code></p>
</div>

${
  interestsL.length > 0
    ? `
<p style="margin:0 0 8px 0;font-size:13px;color:#525252;">You asked about:</p>
<ul style="margin:0 0 24px 0;padding-left:20px;font-size:13px;color:#525252;">
${interestsL.map((i) => `<li>${i}</li>`).join("")}
</ul>
<p style="margin:0 0 24px 0;font-size:13px;color:#737373;">We'll be in touch about these separately.</p>`
    : ""
}

<p style="margin:24px 0 0 0;padding-top:16px;border-top:1px solid #e5e5e5;font-size:11px;color:#a3a3a3;line-height:1.6;">
This survey is a screening tool for informational purposes only. It does not constitute a medical diagnosis. If you're concerned about your mental health, please consult a licensed clinician.
</p>

</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function confirmationEmailText({
  token,
  resultsUrl,
  scores,
}: Args): string {
  const crisis = scores.phq9.suicidal_ideation_flagged
    ? `\nIF YOU'RE IN CRISIS:\n988 Suicide & Crisis Lifeline — call or text 988\nCrisis Text Line — text HOME to 741741\n\n`
    : "";

  return `Your Founder Mental Health Survey results
${crisis}
Depression (PHQ-9): ${scores.phq9.score} / 27 — ${PHQ9_LABELS[scores.phq9.severity] ?? scores.phq9.severity}
Anxiety (GAD-7): ${scores.gad7.score} / 21 — ${GAD7_LABELS[scores.gad7.severity] ?? scores.gad7.severity}
ADHD (ASRS): ${scores.asrs.items_flagged} / 6 items flagged — ${scores.asrs.above_threshold ? "Above threshold" : "Below threshold"}

View your full results: ${resultsUrl}

Your code: ${token}

---
This survey is a screening tool, not a medical diagnosis.
`;
}
