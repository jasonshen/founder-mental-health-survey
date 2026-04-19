import { createServerClient } from "@/lib/supabase";
import { getAllFlags } from "@/lib/flags";
import { isAdminAuthed } from "@/lib/admin-auth";
import AdminLoginForm from "./AdminLoginForm";
import FlagToggle from "./FlagToggle";

export const dynamic = "force-dynamic";

async function loadStats() {
  const supabase = createServerClient();
  const { count: totalResponses } = await supabase
    .from("survey_responses")
    .select("*", { count: "exact", head: true })
    .eq("completed", true);

  const { count: totalEmails } = await supabase
    .from("email_contacts")
    .select("*", { count: "exact", head: true });

  const { data: recent } = await supabase
    .from("survey_responses")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(7);

  return {
    totalResponses: totalResponses ?? 0,
    totalEmails: totalEmails ?? 0,
    lastSubmission: recent?.[0]?.created_at ?? null,
  };
}

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const [flags, stats] = await Promise.all([getAllFlags(), loadStats()]);

  const COHORT_THRESHOLD = 100;
  const enoughData = stats.totalResponses >= COHORT_THRESHOLD;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin</h1>
      <p className="text-gray-500 text-sm mb-10">
        Internal dashboard — responses, feature flags, cohort status.
      </p>

      {/* Stats */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="text-sm text-gray-500 mb-1">Completed responses</div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats.totalResponses}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="text-sm text-gray-500 mb-1">Email captures</div>
            <div className="text-3xl font-semibold text-gray-900">
              {stats.totalEmails}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
            <div className="text-sm text-gray-500 mb-1">Last submission</div>
            <div className="text-sm font-medium text-gray-900">
              {stats.lastSubmission
                ? new Date(stats.lastSubmission).toLocaleString()
                : "—"}
            </div>
          </div>
        </div>
      </section>

      {/* Cohort threshold */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Founder cohort data
        </h2>
        <div
          className={`rounded-lg p-5 border ${
            enoughData
              ? "bg-green-50 border-green-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <p className="text-sm">
            {enoughData ? (
              <>
                <strong>Ready.</strong> You have{" "}
                <strong>{stats.totalResponses}</strong> completed responses
                (threshold {COHORT_THRESHOLD}). You can turn on the founder
                cohort percentile flag below.
              </>
            ) : (
              <>
                <strong>Not yet.</strong> You have{" "}
                <strong>{stats.totalResponses}</strong> of {COHORT_THRESHOLD}{" "}
                needed for meaningful cohort percentiles. Don&apos;t flip the
                flag yet — the percentiles will be misleading with too small a
                sample.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Flags */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Feature flags
        </h2>
        <div className="space-y-3">
          {flags.map((f) => (
            <FlagToggle
              key={f.key}
              flagKey={f.key}
              enabled={f.enabled}
              description={f.description}
              updatedAt={f.updated_at}
            />
          ))}
          {flags.length === 0 && (
            <p className="text-sm text-gray-500">
              No flags seeded yet. Run migration 004_feature_flags.sql.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
