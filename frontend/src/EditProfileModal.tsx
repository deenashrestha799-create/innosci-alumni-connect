import { useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./components/ui";
import { useAuth } from "./AuthContext";
import { apiFetch } from "./api";

const PROGRAMS = ["Cloud Computing", "Software Development", "Data Analytics", "Project Management", "Cybersecurity"];
const YEARS = ["2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018"];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function Row({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function EditProfileModal({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const { me, refreshMe } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!me) return null;

  const years = Array.from(new Set([...(me.graduation_year ? [String(me.graduation_year)] : []), ...YEARS])).sort().reverse();
  const programs = Array.from(new Set([...(me.program ? [me.program] : []), ...PROGRAMS]));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "").trim();

    const graduationYear = Number(text("graduationYear"));
    if (text("fullName").length < 2) return setError("Please enter your full name.");
    if (text("phone").length < 5) return setError("Please enter your contact number.");
    if (text("location").length < 2) return setError("Please enter your location.");
    if (!graduationYear) return setError("Please select your graduation year.");
    if (!text("program")) return setError("Please select your programme.");

    const body = {
      full_name: text("fullName"),
      phone: text("phone"),
      location: text("location"),
      graduation_year: graduationYear,
      program: text("program"),
      job_title: text("jobTitle"),
      company: text("company"),
      linkedin_url: text("linkedinUrl"),
      skills: text("skills"),
      interests: text("interests"),
      bio: text("bio"),
    };

    setSaving(true);
    try {
      const res = await apiFetch("/me", { method: "PUT", body: JSON.stringify(body) });
      if (!res.ok) {
        const info = await res.json().catch(() => null);
        console.log("Profile update error:", res.status, JSON.stringify(info));
        setError("Could not save your profile. Please check your details and try again.");
        return;
      }
      await refreshMe();
      onSaved?.();
      onClose();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/50 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="my-8 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Edit my profile</h2>
            <p className="mt-1 text-xs text-slate-400">Signed in as {me.email}. Your email can’t be changed here.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Row label="Full name"><input name="fullName" defaultValue={me.full_name} className={inputClass} /></Row>
          <Row label="Contact number"><input name="phone" defaultValue={me.phone ?? ""} className={inputClass} /></Row>
          <Row label="Location"><input name="location" defaultValue={me.location ?? ""} placeholder="City, Country" className={inputClass} /></Row>
          <Row label="Graduation year / cohort">
            <select name="graduationYear" defaultValue={me.graduation_year ? String(me.graduation_year) : ""} className={inputClass}>
              <option value="">Select your cohort</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Row>
          <Row label="Programme completed">
            <select name="program" defaultValue={me.program ?? ""} className={inputClass}>
              <option value="">Select programme</option>
              {programs.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Row>
          <Row label="Current job title"><input name="jobTitle" defaultValue={me.job_title ?? ""} className={inputClass} /></Row>
          <Row label="Company"><input name="company" defaultValue={me.company ?? ""} className={inputClass} /></Row>
          <Row label="LinkedIn profile URL"><input name="linkedinUrl" defaultValue={me.linkedin_url ?? ""} className={inputClass} /></Row>
          <Row label="Skills and expertise" wide><input name="skills" defaultValue={me.skills ?? ""} placeholder="AWS, Leadership, Data..." className={inputClass} /></Row>
          <Row label="Areas of interest" wide><input name="interests" defaultValue={me.interests ?? ""} placeholder="Mentorship, networking..." className={inputClass} /></Row>
          <Row label="Short bio (optional)" wide><textarea name="bio" rows={3} defaultValue={me.bio ?? ""} className={inputClass} /></Row>
        </div>

        {error && <p className="mt-5 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}