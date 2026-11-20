import { useEffect, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";
import { apiFetch } from "./api";
import { Button, Pill } from "./components/ui";
import { LocationSelect } from "./LocationSelect";
import { PhoneInput } from "./PhoneInput";

const thisYear = new Date().getFullYear();
const cohortYears = Array.from({ length: thisYear - 2009 }, (_, i) => String(thisYear - i));
const programmes = ["Cloud Computing", "Software Development", "Data Analytics", "Project Management", "Cybersecurity"];
interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  program?: string | null;
  graduation_year?: number | null;
  role: string;
  status: string;
}

const empty = {
  full_name: "", email: "", role: "ALUMNI", password: "",
  contact_number: "", location: "", graduation_year: "",
  program: "", job_title: "", company: "",
};

export function AdminRecords() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const res = await apiFetch("/admin/users");
      if (res.ok) setUsers((await res.json()).users);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function create() {
    setError("");
    if (form.full_name.trim().length < 2) return setError("Enter the full name.");
    if (!form.email.includes("@")) return setError("Enter a valid email.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setSaving(true);
    const res = await apiFetch("/admin/users", {
      method: "POST",
      body: JSON.stringify({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        role: form.role,
        password: form.password,
        contact_number: phone || null,
        location: location || null,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        program: form.program || null,
        job_title: form.job_title || null,
        company: form.company || null,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        typeof data.detail === "string"
          ? data.detail
          : data.detail?.[0]?.msg ?? "Could not create the user."
      );
      return;
    }

    setOpen(false);
    setForm(empty);
    setNotice("User created. Share the email and password with them securely.");
    load();
  }

  const input = "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="font-bold text-slate-950">Alumni records</h2>
          <p className="mt-1 text-xs text-slate-400">{users.length} registered users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load} disabled={refreshing}>
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={() => { setError(""); setPhone(""); setLocation(""); setOpen(true); }}>
            <Plus className="size-4" /> Add user
          </Button>
        </div>
      </div>

      {notice && <p className="bg-teal-50 px-5 py-3 text-sm text-teal-700">{notice}</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-[0.65rem] uppercase tracking-wider text-slate-400">
              {["Name", "Programme", "Cohort", "Role", "Status"].map((h) => (
                <th key={h} className="p-4 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-t border-slate-100">
                <td className="p-4">
                  <div className="font-bold text-slate-900">{u.full_name}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="p-4 text-slate-500">{u.program || "—"}</td>
                <td className="p-4 text-slate-500">{u.graduation_year || "—"}</td>
                <td className="p-4"><Pill tone={u.role === "ADMIN" ? "teal" : "slate"}>{u.role}</Pill></td>
                <td className="p-4">
                  <Pill tone={u.status === "APPROVED" ? "teal" : u.status === "PENDING" ? "amber" : "slate"}>
                    {u.status}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-navy-950/50 p-5">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-950">Add user</h2>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></button>
            </div>
            <p className="mt-1 text-sm text-slate-500">The account is approved immediately.</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <select value={form.role} onChange={(e) => set("role", e.target.value)} className={`${input} sm:col-span-2`}>
                <option value="ALUMNI">Alumni</option>
                <option value="ADMIN">Admin</option>
              </select>
              <input className={input} placeholder="Full name *" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              <input className={input} placeholder="Email *" value={form.email} onChange={(e) => set("email", e.target.value)} />
              <input className={`${input} sm:col-span-2`} type="password" placeholder="Initial password * (min 8)" value={form.password} onChange={(e) => set("password", e.target.value)} />
              <div className="sm:col-span-2">
                <PhoneInput onChange={setPhone} />
              </div>
              <LocationSelect onChange={setLocation} />
              <select className={input} value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)}>
                <option value="">Graduation year</option>
                {cohortYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <select className={input} value={form.program} onChange={(e) => set("program", e.target.value)}>
                <option value="">Programme</option>
                {programmes.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input className={input} placeholder="Job title" value={form.job_title} onChange={(e) => set("job_title", e.target.value)} />
              <input className={input} placeholder="Company" value={form.company} onChange={(e) => set("company", e.target.value)} />
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={create} disabled={saving}>{saving ? "Creating..." : "Create user"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}