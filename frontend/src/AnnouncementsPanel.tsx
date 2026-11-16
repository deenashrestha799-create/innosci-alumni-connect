import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { apiFetch } from "./api";

interface Announcement {
  announcement_id: number;
  title: string;
  message: string;
  created_at: string;
}

export function AnnouncementsPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await apiFetch("/announcements");
    if (res.ok) setItems((await res.json()).announcements);
  }

  useEffect(() => { load(); }, []);

  function reset() {
    setEditingId(null);
    setTitle("");
    setMessage("");
    setError("");
  }

  async function save() {
    setError("");
    if (title.trim().length < 3 || message.trim().length < 3) {
      setError("Title and message need at least 3 characters.");
      return;
    }
    setSaving(true);
    const res = await apiFetch(
      editingId ? `/admin/announcements/${editingId}` : "/admin/announcements",
      {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      }
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.detail === "string" ? data.detail : "Could not save.");
      return;
    }
    reset();
    load();
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this announcement?")) return;
    const res = await apiFetch(`/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-950">Announcements</h2>

      <div className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          maxLength={200}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          rows={3}
          maxLength={2000}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            {editingId ? "Update announcement" : "Publish announcement"}
          </button>
          {editingId && (
            <button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 && <p className="text-sm text-slate-500">No announcements yet.</p>}
        {items.map((a) => (
          <div key={a.announcement_id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900">{a.title}</div>
                <div className="mt-1 text-xs text-slate-400">{new Date(a.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditingId(a.announcement_id); setTitle(a.title); setMessage(a.message); }}
                  className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Edit"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => remove(a.announcement_id)}
                  className="grid size-9 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}