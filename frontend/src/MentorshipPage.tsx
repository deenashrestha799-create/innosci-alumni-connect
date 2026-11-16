import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Cloud,
  Code2,
  HeartHandshake,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "./AppShell";
import { Avatar } from "./Picture";
import { Button, Pill } from "./components/ui";
import { apiFetch } from "./api";
import type { Page } from "./App";

interface Mentor {
  mentor_id: number;
  user_id: string;
  full_name: string;
  job_title?: string | null;
  company?: string | null;
  location?: string | null;
  program?: string | null;
  graduation_year?: number | null;
  profile_picture_url?: string | null;
  expertise: string[];
  monthly_availability: number;
  bio?: string | null;
  is_active: boolean;
  match_reasons?: string[];
}

const expertiseOptions = [
  "Cloud Computing",
  "Software Development",
  "Data Analytics",
  "Artificial Intelligence",
  "Salesforce",
  "Cybersecurity",
  "Project Management",
  "Leadership",
  "Career Development",
];

const iconComponents = [
  Cloud,
  Code2,
  TrendingUp,
  Target,
  ShieldCheck,
];

export function MentorshipPage({
  setPage,
}: {
  setPage: (page: Page) => void;
}) {
  const [tab, setTab] = useState("Find a mentor");

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myProfile, setMyProfile] = useState<Mentor | null>(null);

  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [monthlyAvailability, setMonthlyAvailability] = useState("4");
  const [bio, setBio] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function readError(response: Response) {
  try {
      const data = await response.json();
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail)) return data.detail[0]?.msg ?? "Invalid input.";
    } catch {}
    return "Something went wrong. Please try again.";
  }

  async function loadMentors() {
  setLoading(true);
  setError("");

  try {
    const response = await apiFetch("/mentors");

    if (!response.ok) {
      throw new Error(await readError(response));
    }

    const data = await response.json();

    // Backend returns { mentors: [...] }
    setMentors(
      Array.isArray(data.mentors) ? data.mentors : []
    );

  } catch (err) {
    setMentors([]);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to load mentors."
    );
  } finally {
    setLoading(false);
  }
}

  async function loadMyProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/mentors/me");

      if (response.status === 404) {
        setMyProfile(null);
        return;
      }

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const profile: Mentor = await response.json();

      setMyProfile(profile);
      setSelectedExpertise(profile.expertise || []);
      setMonthlyAvailability(String(profile.monthly_availability));
      setBio(profile.bio || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your mentor profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "Find a mentor") {
      loadMentors();
    }

    if (tab === "Become a mentor") {
      loadMyProfile();
    }
  }, [tab]);

  function toggleExpertise(value: string) {
    setSelectedExpertise((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  }

  async function saveMentorProfile() {
    setError("");
    setSuccess("");

    if (selectedExpertise.length === 0) {
      setError("Please select at least one mentorship area.");
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch("/mentors/me", {
        method: "POST",
        body: JSON.stringify({
          expertise: selectedExpertise,
          monthly_availability: Number(monthlyAvailability),
          bio: bio.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const profile: Mentor = await response.json();

      setMyProfile(profile);
      setSuccess("Your mentor profile has been saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your mentor profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivateMentorProfile() {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate your mentor profile?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await apiFetch("/mentors/me", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      setMyProfile(null);
      setSelectedExpertise([]);
      setMonthlyAvailability("4");
      setBio("");
      setSuccess("Your mentor profile has been deactivated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to deactivate your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell page="mentorship" setPage={setPage}>
      <div className="mx-auto max-w-7xl">
        {/* Hero section */}
        <div className="overflow-hidden rounded-3xl bg-navy-950 p-7 text-white md:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
                <HeartHandshake className="size-4" />
                Mentorship hub
              </div>

              <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight">
                Experience shared is potential unlocked.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Learn from someone who has navigated the path—or be the
                person who helps another alum take their next confident step.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="bg-white text-navy-950 hover:bg-slate-100"
                onClick={() => setTab("Find a mentor")}
              >
                <Search className="size-4" />
                Find a mentor
              </Button>

              <Button
                variant="secondary"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => setTab("Become a mentor")}
              >
                <HeartHandshake className="size-4" />
                Become a mentor
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-7 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {["Find a mentor", "My requests", "Become a mentor"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setError("");
                setSuccess("");
                setTab(item);
              }}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
                tab === item
                  ? "bg-navy-950 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-700">
            {success}
          </div>
        )}

        {/* Find a mentor */}
        {tab === "Find a mentor" && (
          <>
            <div className="mt-7">
              <h2 className="text-xl font-bold text-slate-950">
                Recommended mentors
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Mentors matched to your interests and professional goals.
              </p>
            </div>

            {loading ? (
              <p className="mt-8 text-center text-sm text-slate-500">
                Loading mentors...
              </p>
            ) : mentors.length === 0 ? (
              <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <HeartHandshake className="mx-auto size-10 text-slate-300" />
                <h3 className="mt-4 font-bold text-slate-900">
                  No mentors available yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Be the first to share your experience and help other alumni.
                </p>
                <Button
                  className="mt-5"
                  onClick={() => setTab("Become a mentor")}
                >
                  Become a mentor
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {mentors.map((mentor, index) => {
                  const ExpertiseIcon =
                    iconComponents[index % iconComponents.length];

                  return (
                    <div
                      key={mentor.mentor_id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <Avatar
                          src={mentor.profile_picture_url || ""}
                          name={mentor.full_name}
                          className="size-16"
                        />

                        <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-600">
                          <ExpertiseIcon className="size-5" />
                        </span>
                      </div>

                      <div className="mt-4 text-lg font-bold text-slate-950">
                        {mentor.full_name}
                      </div>

                      <div className="mt-1 text-sm font-semibold text-teal-700">
                        {mentor.program || "InnoSCI Alumni"}
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        {[mentor.job_title, mentor.company]
                          .filter(Boolean)
                          .join(" at ") || "Alumni mentor"}
                      </div>

                      {mentor.location && (
                        <p className="mt-1 text-xs text-slate-400">
                          {mentor.location}
                        </p>
                      )}

                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        {mentor.bio ||
                          `Available to guide alumni in ${mentor.expertise.join(", ")}.`}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {mentor.expertise.map((skill) => (
                          <Pill key={skill} tone="slate">
                            {skill}
                          </Pill>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                        <Clock3 className="size-4" />
                        {mentor.monthly_availability} hours per month
                      </div>

                      {mentor.match_reasons &&
                        mentor.match_reasons.length > 0 && (
                          <p className="mt-3 text-xs text-teal-700">
                            Match: {mentor.match_reasons.join(", ")}
                          </p>
                        )}

                      <Button className="mt-5 w-full" disabled>
                        <HeartHandshake className="size-4" />
                        Request mentorship
                      </Button>
                      <p className="mt-2 text-center text-xs text-slate-400">
                        Mentorship requests will be enabled when request
                        management is connected.
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* My requests */}
        {tab === "My requests" && (
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <Clock3 className="mx-auto size-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-950">
              No request history available
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your mentorship requests and their statuses will appear here
              once request management is connected.
            </p>
          </div>
        )}

        {/* Become a mentor */}
        {tab === "Become a mentor" && (
          <div className="mx-auto mt-7 max-w-2xl rounded-3xl border border-slate-200 bg-white p-8">
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal-50 text-teal-600">
                <HeartHandshake className="size-8" />
              </span>

              <h2 className="mt-6 text-2xl font-bold text-slate-950">
                Your experience can change a career.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Choose the areas you can support, set your availability and
                introduce yourself to alumni ready to learn.
              </p>
            </div>

            <div className="mt-7">
              <label className="text-sm font-semibold text-slate-700">
                Mentorship areas
              </label>

              <p className="mt-1 text-xs text-slate-400">
                Select one or more areas where you can provide guidance.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {expertiseOptions.map((expertise) => (
                  <label
                    key={expertise}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedExpertise.includes(expertise)}
                      onChange={() => toggleExpertise(expertise)}
                      className="size-4 accent-teal-600"
                    />
                    {expertise}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-slate-700">
                Monthly availability
              </label>

              <select
                value={monthlyAvailability}
                onChange={(event) =>
                  setMonthlyAvailability(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              >
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
                <option value="6">6 hours</option>
                <option value="8">8 hours</option>
                <option value="10">10 hours</option>
                <option value="12">12 hours</option>
              </select>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-slate-700">
                About your mentorship
              </label>

              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Describe your experience and how you can support other alumni..."
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {bio.length}/1000
              </p>
            </div>

            <Button
              className="mt-6 w-full"
              onClick={saveMentorProfile}
              disabled={saving || loading}
            >
              {saving
                ? "Saving..."
                : myProfile
                  ? "Update mentor profile"
                  : "Create mentor profile"}
              <ArrowRight className="size-4" />
            </Button>

            {myProfile && (
              <div className="mt-5 rounded-xl bg-teal-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-teal-800">
                      Your mentor profile is active
                    </p>
                    <p className="mt-1 text-xs text-teal-700">
                      You can update your details or deactivate your profile.
                    </p>
                  </div>
                  <Pill tone="teal">Active</Pill>
                </div>

                <Button
                  variant="secondary"
                  className="mt-4 w-full"
                  onClick={deactivateMentorProfile}
                  disabled={saving}
                >
                  Deactivate mentor profile
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}