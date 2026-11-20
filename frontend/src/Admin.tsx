import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileCheck2,
  HeartHandshake,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  RefreshCw,
} from "lucide-react";

import { apiFetch } from "./api";
import { Button, Pill } from "./components/ui";
import type { Page } from "./App";
import { AppShell } from "./AppShell";
import {PanelHeader} from "./PanelHeader";
import { AdminRecords } from "./AdminRecords";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { AnnouncementsPanel } from "./AnnouncementsPanel";
import { AdminMentors } from "./AdminMentors";

export function AdminPage({ setPage }: { setPage: (page: Page) => void }) {
  const [pending, setPending] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [notice, setNotice] = useState("");
  const [adminStats, setAdminStats] = useState<any>(null);
  const [section, setSection] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const loadAdminStats = async () => {
    try {
      const res = await apiFetch("/admin/stats");

      if (!res.ok) {
        throw new Error("Failed to load statistics");
      }

      const data = await res.json();

      setAdminStats(data);
      setRegistrationStats(data.registration_stats ?? []);

    } catch (error) {
      console.error(error);
      setNotice("Failed to load admin statistics.");
    }
  };
  const allSelected = pending.length > 0 && selected.length === pending.length;
  
  const approve = async () => {
  try {
    for (const userId of selected) {
      const res = await apiFetch(
        `/admin/users/${userId}/approve`,
        { method: "PUT" }
      );

      if (!res.ok) {
        throw new Error(`Could not approve user ${userId}`);
      }
    }

    setPending((prev) =>
      prev.filter((person) => !selected.includes(person.user_id))
    );

    setNotice(
      `${selected.length} alumni profiles approved successfully.`
    );

    setSelected([]);
    setModal(false);

  } catch (error) {
    console.error(error);
    setNotice("Some approvals could not be completed.");
    await loadPendingUsers();
  }
  };
  
  useEffect(() => {
      loadPendingUsers();
      loadAdminStats();
    }, []);

  const loadPendingUsers = async () => {
    try {
      const res = await apiFetch("/admin/users/pending");

      if (!res.ok) {
        throw new Error("Failed to fetch pending users");
      }

      const result = await res.json();

      setPending(result.users);
    } catch (error) {
      console.error(error);
      setNotice("Could not load pending alumni.");
    }
  };
  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadPendingUsers(), loadAdminStats()]);
    setRefreshing(false);
  };
  const stats = [
    {
      label: "Total registered",
      value: adminStats?.total_users ?? 0,
      icon: Users,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Pending approvals",
      value: adminStats?.pending_users ?? 0,
      icon: Clock3,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Approved alumni",
      value: adminStats?.approved_users ?? 0,
      icon: UserCheck,
      tone: "bg-teal-50 text-teal-600",
    },
    {
      label: "Active mentors",
      value: adminStats?.active_mentors ?? 0,
      icon: HeartHandshake,
      tone: "bg-violet-50 text-violet-600",
    },
  ];
  const [registrationStats, setRegistrationStats] =
  useState<any[]>([]);

  const [announcementModal, setAnnouncementModal] =
  useState(false);

  const [announcementTitle, setAnnouncementTitle] =
    useState("");

  const [announcementMessage, setAnnouncementMessage] =
    useState("");

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);
  
    return (
    <AppShell
      page="admin"
      setPage={setPage}
      admin
      adminSection={section}
      onAdminSection={setSection}
    >
      <div className="mx-auto max-w-[90rem]">
        {notice && (
          <div className="fixed right-6 top-24 z-50 flex items-center gap-3 rounded-2xl bg-navy-950 px-5 py-4 text-sm font-semibold text-white shadow-2xl">
            <CheckCircle2 className="size-5 text-teal-400" />
            {notice}
          </div>
        )}

        {section === "stories" && <AnnouncementsPanel />}
        {section === "mentorship" && <AdminMentors />}
        {section === "records" && <AdminRecords />}
        {section === "jobs" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            This section is coming soon.
          </div>
        )}

        {section === "overview" && (
          <>
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="text-sm font-semibold text-teal-700">
                  {currentTime.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                  Admin Dashboard
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Welcome to your alumni community administration panel.
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <Clock3 className="size-4" />
                  {currentTime.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={refreshAll} disabled={refreshing}>
                  <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
                <Button onClick={() => setAnnouncementModal(true)}>
                  <Plus className="size-4" />
                  Create announcement
                </Button>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {stats.map(({ label, value, icon: Icon, tone }) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
                    <Icon className="size-5" />
                  </span>
                  <div className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
                    {value.toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_320px]">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">
                  <div>
                    <h2 className="font-bold text-slate-950">Pending alumni approvals</h2>
                    <p className="mt-1 text-xs text-slate-400">Review and verify new alumni registrations.</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="relative">
                      <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                      <input
                        placeholder="Search pending..."
                        className="w-44 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs outline-none focus:border-teal-500"
                      />
                    </label>
                    <Button disabled={!selected.length} onClick={() => setModal(true)}>
                      <Check className="size-4" /> Approve selected {selected.length > 0 && `(${selected.length})`}
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[0.65rem] uppercase tracking-wider text-slate-400">
                        <th className="p-4">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() =>
                              setSelected(allSelected ? [] : pending.map((person) => person.user_id))
                            }
                            className="size-4 accent-teal-600"
                          />
                        </th>
                        {["Alumni", "Cohort", "Programme", "Registered", "Status", "Actions"].map((heading) => (
                          <th key={heading} className="p-4 font-bold">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((person) => (
                        <tr key={person.user_id} className="border-t border-slate-100 text-sm">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selected.includes(person.user_id)}
                              onChange={() =>
                                setSelected(
                                  selected.includes(person.user_id)
                                    ? selected.filter((item) => item !== person.user_id)
                                    : [...selected, person.user_id]
                                )
                              }
                              className="size-4 accent-teal-600"
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{person.full_name}</div>
                            <div className="mt-0.5 text-xs text-slate-400">{person.email}</div>
                          </td>
                          <td className="p-4 text-slate-500">{person.graduation_year}</td>
                          <td className="p-4 text-slate-500">{person.program}</td>
                          <td className="p-4 text-xs text-slate-500">{person.date}</td>
                          <td className="p-4"><Pill tone="amber">Pending</Pill></td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              <button
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                                title="View details"
                              >
                                <CircleUserRound className="size-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelected([person.user_id]);
                                  setModal(true);
                                }}
                                className="rounded-lg p-2 text-teal-600 hover:bg-teal-50"
                                title="Approve"
                              >
                                <Check className="size-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await apiFetch(
                                      `/admin/users/${person.user_id}/reject`,
                                      { method: "PUT" }
                                    );
                                    if (!res.ok) throw new Error("Rejection failed");

                                    setPending((prev) =>
                                      prev.filter((item) => item.user_id !== person.user_id)
                                    );
                                    setSelected((prev) =>
                                      prev.filter((id) => id !== person.user_id)
                                    );
                                    setNotice(`${person.full_name}'s registration was rejected.`);
                                  } catch (error) {
                                    console.error(error);
                                    setNotice("Could not reject this registration.");
                                  }
                                }}
                                className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                                title="Reject"
                              >
                                <X className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {pending.length === 0 && (
                    <div className="p-12 text-center">
                      <CheckCircle2 className="mx-auto size-9 text-teal-500" />
                      <div className="mt-3 font-bold text-slate-900">All caught up</div>
                      <div className="mt-1 text-sm text-slate-400">
                        There are no alumni profiles awaiting approval.
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <aside className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <PanelHeader title="Community health" action="Last 30 days" />
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={registrationStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="#0D9488" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <PanelHeader title="Quick actions" action="" />
                  {[
                    { icon: Users, label: "Manage alumni records", target: "records" },
                    { icon: BriefcaseBusiness, label: "Review job postings", target: "jobs" },
                    { icon: Sparkles, label: "Update featured stories", target: "stories" },
                  ].map(({ icon: Icon, label, target }) => (
                    <button
                      key={label}
                      onClick={() => setSection(target)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    >
                      <span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500">
                        <Icon className="size-4" />
                      </span>
                      {label}
                      <ChevronRight className="ml-auto size-4 text-slate-300" />
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
      {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-600"><FileCheck2 className="size-6" /></span><h2 className="mt-5 text-xl font-bold text-slate-950">Approve {selected.length} alumni {selected.length === 1 ? "profile" : "profiles"}?</h2><p className="mt-3 text-sm leading-6 text-slate-500">Approved alumni will immediately receive access to the directory, mentorship hub and opportunities board. They’ll also receive a confirmation email.</p><div className="mt-7 grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={approve}><Check className="size-4" /> Confirm approval</Button></div></div></div>}

      {announcementModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-5">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <h2 className="text-xl font-bold">
              Create announcement
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Share important updates with your alumni community.
            </p>
            <input
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="Announcement title"
              className="mt-6 w-full rounded-xl border p-3 text-sm"
            />
            <textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              placeholder="Write your announcement..."
              rows={5}
              className="mt-4 w-full rounded-xl border p-3 text-sm"
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setAnnouncementModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={async () => {
                if (!announcementTitle.trim() ||
                    !announcementMessage.trim()) return;
                const res = await apiFetch(
                  "/admin/announcements",
                  {
                    method: "POST",
                    body: JSON.stringify({
                      title: announcementTitle,
                      message: announcementMessage
                    })
                  }
                );
                if (res.ok) {
                  setAnnouncementTitle("");
                  setAnnouncementMessage("");
                  setAnnouncementModal(false);
                  setNotice("Announcement published successfully.");
                }
              }}>
                Publish announcement
              </Button>

            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}