type Cohort = "yc" | "general" | null | undefined;

interface Args {
  cohort: Cohort;
  interests: {
    coaching: boolean;
    retreat: boolean;
    plantMedicine: boolean;
    updates: boolean;
  };
}

// NULL cohort = pre-cohort-split respondent; treat as YC per migration 009.
function surveyName(cohort: Cohort): string {
  return cohort === "general"
    ? "Founder Mental Health Survey"
    : "YC Founder Mental Health Survey";
}

function interestList(i: Args["interests"]): string[] {
  const list: string[] = [];
  if (i.coaching) list.push("Coaching resources");
  if (i.retreat) list.push("In-person retreat");
  if (i.plantMedicine) list.push("Plant medicine / psychedelic-assisted therapy");
  if (i.updates) list.push("Research updates");
  return list;
}

export function confirmationEmailSubject(cohort: Cohort): string {
  return `Thanks for taking the ${surveyName(cohort)}`;
}

export function confirmationEmailHtml({ cohort, interests }: Args): string {
  const name = surveyName(cohort);
  const interestsL = interestList(interests);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Thanks for taking the ${name}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#111;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e5e5;border-radius:12px;padding:32px;max-width:560px;">
<tr><td>

<h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#111;">Thanks for taking the ${name}.</h1>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#262626;">
We'll send you a more detailed report in the next 2 weeks.
</p>

<div style="margin:24px 0;padding:16px 18px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
  <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#78350f;">Save your access code or bookmark your results page.</p>
  <p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;">
    Your responses are anonymous. Your email and your survey responses live in separate database tables with no join key, so we can't look up your results from this email address. The access code (and the results URL it unlocks) shown at the end of the survey is the only way back. If you didn't save it, please retake the survey.
  </p>
</div>

<p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#525252;">
When the detailed report is ready, we'll send a follow-up email letting you know it's live — that email won't contain your code either, so you'll need your saved access code or bookmark to view it.
</p>

${
  interestsL.length > 0
    ? `
<p style="margin:24px 0 8px 0;font-size:14px;color:#262626;">You also asked about:</p>
<ul style="margin:0 0 16px 0;padding-left:20px;font-size:14px;color:#262626;line-height:1.7;">
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

export function confirmationEmailText({ cohort, interests }: Args): string {
  const name = surveyName(cohort);
  const interestsL = interestList(interests);
  const interestsBlock =
    interestsL.length > 0
      ? `\nYou also asked about:\n${interestsL.map((i) => `- ${i}`).join("\n")}\n\nWe'll be in touch about these separately.\n`
      : "";

  return `Thanks for taking the ${name}.

We'll send you a more detailed report in the next 2 weeks.

SAVE YOUR ACCESS CODE OR BOOKMARK YOUR RESULTS PAGE
Your responses are anonymous. Your email and your survey responses live in separate database tables with no join key, so we can't look up your results from this email address. The access code (and the results URL it unlocks) shown at the end of the survey is the only way back. If you didn't save it, please retake the survey.

When the detailed report is ready, we'll send a follow-up email letting you know it's live — that email won't contain your code either, so you'll need your saved access code or bookmark to view it.
${interestsBlock}
---
This survey is a screening tool for informational purposes only. It does not constitute a medical diagnosis. If you're concerned about your mental health, please consult a licensed clinician.
`;
}
