import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { Pill } from "./components/ui";

interface AdminMentor {
  mentor_id: number;
  full_name: string;
  email: string;
  job_title?: string | null;
  company?: string | null;
  program?: string | null;
  expertise: string[];
  monthly_availability: number;
  created_at: string;
}

export function AdminMentors() {
  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/admin/mentors");
      if (!res.ok) {
        setError("Could not load mentors.");
        return;
      }
      setMentors((await res.json()).mentors);
    })();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-bold text-slate-950">Active mentors</h2>
        <p className="mt-1 text-xs text-slate-400">{mentors.length} alumni are currently offering mentorship.</p>
      </div>
      {error && <p className="p-5 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-[0.65rem] uppercase tracking-wider text-slate-400">
              {["Mentor", "Role", "Expertise", "Hours / month", "Joined"].map((h) => (
                <th key={h} className="p-4 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mentors.map((m) => (
              <tr key={m.mentor_id} className="border-t border-slate-100">
                <td className="p-4">
                  <div className="font-bold text-slate-900">{m.full_name}</div>
                  <div className="text-xs text-slate-400">{m.email}</div>
                </td>
                <td className="p-4 text-slate-500">
                  {[m.job_title, m.company].filter(Boolean).join(" at ") || "—"}
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {m.expertise.map((e) => <Pill key={e} tone="slate">{e}</Pill>)}
                  </div>
                </td>
                <td className="p-4 text-slate-500">{m.monthly_availability}</td>
                <td className="p-4 text-xs text-slate-500">{new Date(m.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {mentors.length === 0 && !error && (
          <p className="p-10 text-center text-sm text-slate-400">No active mentors yet.</p>
        )}
      </div>
    </div>
  );
}