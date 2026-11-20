import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Users, HeartHandshake, UserRoundPlus, ChevronRight,UserCheck } from "lucide-react";

import { Avatar } from "./Picture";
import { Button, } from "./components/ui";

import type { Page } from "./App";
import data from "../../content/alumni.json";
import { apiFetch } from "./api";
import { useAuth } from "./AuthContext";

const { pics } = data;
const photos = pics;

interface SpotlightAlumni {
  user_id: string;
  full_name: string;
  job_title?: string | null;
  company?: string | null;
  program?: string | null;
  graduation_year?: number | null;
  location?: string | null;
  bio?: string | null;
  profile_picture_url?: string | null;
}

interface HomeData {
  stats: { alumni: number; countries: number; mentors: number; programmes: number };
  spotlight: SpotlightAlumni[];
  latest_member: string | null;
}


export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-teal-600">{eyebrow}</div>
      <div className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">{title}</div>
      <p className="mt-4 text-base leading-7 text-slate-500">{description}</p>
    </div>
  );
}

export function HomePage({ setPage }: { setPage: (page: Page) => void }) {
  const [slide, setSlide] = useState(0);
  const touchStart = useRef(0);
  const [home, setHome] = useState<HomeData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/public/home");
        if (res.ok) setHome(await res.json());
      } catch (error) {
        console.error("Home data error:", error);
      }
    })();
  }, []);

  const slides = home?.spotlight ?? [];
  const stats = home?.stats;
  const previous = () => slides.length && setSlide((slide - 1 + slides.length) % slides.length);
  const next = () => slides.length && setSlide((slide + 1) % slides.length);
  const current = slides[slide];
  const { me } = useAuth();
  const signedIn = !!me;
  const isAdmin = me?.role === "ADMIN";
  const firstName = me?.full_name?.split(" ")[0] ?? "";

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementError, setAnnouncementError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await apiFetch("/announcements");
        if (!response.ok) throw new Error("Could not load announcements.");
        const result = await response.json();
        if (!cancelled) {
          setAnnouncements(Array.isArray(result.announcements) ? result.announcements : []);
        }
      } catch (error) {
        if (!cancelled) {
          setAnnouncementError(
            error instanceof Error ? error.message : "Could not load announcements."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
//   const [announcements, setAnnouncements] = useState<any[]>([]);
//   const [announcementError, setAnnouncementError] = useState("");
//   useEffect(() => {
//     const loadAnnouncements = async () => {
//       try {
//         const res = await apiFetch("/announcements");

//         if (!res.ok) {
//           throw new Error("Failed to load announcements");
//         }

//         const data = await res.json();
//         setAnnouncements(data.announcements ?? []);

//       } catch (error) {
//         console.error("Announcement loading error:", error);
//         setAnnouncementError("Could not load announcements.");
//       }
//     };

//     loadAnnouncements();
//   }, []);
//   useEffect(() => {
//     let cancelled = false;

//     async function loadAnnouncements() {
//       try {
//         const response = await apiFetch("/announcements");

//         if (!response.ok) {
//           throw new Error("Could not load announcements.");
//         }

//         const data = await response.json();

//         if (!cancelled) {
//           setAnnouncements(
//             Array.isArray(data.announcements)
//               ? data.announcements
//               : []
//           );
//         }
//       } catch (error) {
//         if (!cancelled) {
//           setAnnouncementError(
//             error instanceof Error
//               ? error.message
//               : "Could not load announcements."
//           );
//         }
//       }
//     }

//     loadAnnouncements();

//     return () => {
//       cancelled = true;
//     };
//     }, []);

//   {announcements.map((announcement) => (
//   <div
//     key={announcement.announcement_id}
//     className="rounded-2xl border border-slate-200 bg-white p-5"
//   >
//     <h3 className="font-bold text-slate-900">
//       {announcement.title}
//     </h3>

//     <p className="mt-2 text-sm text-slate-600">
//       {announcement.message}
//     </p>
//     <p className="mt-3 text-xs text-slate-400">
//       {new Date(announcement.created_at).toLocaleDateString()}
//     </p>
//   </div>
// ))}

  return (
    <main>
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="absolute -right-40 -top-40 size-[38rem] rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-16 px-5 py-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-teal-200 backdrop-blur">
              <Sparkles className="size-4" /> Built for every chapter after graduation
            </div>
                        <h1 className="text-5xl font-bold leading-[1.06] tracking-[-0.045em] md:text-7xl">
              {signedIn ? (
                <>
                  Welcome back, <span className="text-teal-300">{firstName}.</span>
                </>
              ) : (
                <>
                  Once an InnoSCI Graduate,{" "}
                  <span className="text-teal-300">always part of the InnoSCI community.</span>
                </>
              )}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              {isAdmin
                ? "Review new registrations, publish announcements and keep the InnoSCI community thriving."
                : signedIn
                  ? "Pick up where you left off: reconnect with alumni, find a mentor and keep growing."
                  : "Reconnect, collaborate, mentor and grow with the InnoSCI alumni community."}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {!signedIn && (
                <>
                  <Button className="px-6 py-3.5" onClick={() => setPage("register")}>
                    Join Alumni Network <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    className="border-white/15 bg-white/5 px-6 py-3.5 text-white hover:bg-white/10 hover:text-white"
                    variant="secondary"
                    onClick={() => setPage("directory")}
                  >
                    Explore our community
                  </Button>
                </>
              )}
              {signedIn && !isAdmin && (
                <>
                  <Button className="px-6 py-3.5" onClick={() => setPage("dashboard")}>
                    Go to my dashboard <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    className="border-white/15 bg-white/5 px-6 py-3.5 text-white hover:bg-white/10 hover:text-white"
                    variant="secondary"
                    onClick={() => setPage("directory")}
                  >
                    Explore directory
                  </Button>
                </>
              )}
              {isAdmin && (
                <>
                  <Button className="px-6 py-3.5" onClick={() => setPage("admin")}>
                    Open admin dashboard <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    className="border-white/15 bg-white/5 px-6 py-3.5 text-white hover:bg-white/10 hover:text-white"
                    variant="secondary"
                    onClick={() =>
                      document.getElementById("community-updates")?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    View announcements
                  </Button>
                </>
              )}
            </div>
            <div className="mt-12 flex items-center gap-6 border-t border-white/10 pt-7">
              <div className="flex -space-x-2.5">
                {slides.slice(0, 4).map((p) => (
                  <Avatar key={p.user_id} src={p.profile_picture_url} name={p.full_name} className="size-10" />
                ))}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{(stats?.alumni ?? 0).toLocaleString()} alumni</div>
                <div className="mt-0.5 text-xs text-slate-400">Learning, leading and giving back</div>
              </div>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -left-8 top-16 z-10 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-400 text-navy-950"><UserRoundPlus className="size-5" /></span>
                <span><strong className="block text-sm">New member</strong><span className="text-xs text-slate-300">{home?.latest_member ? `${home.latest_member} joined the network` : "Be the first to join"}</span></span>
              </div>
            </div>
            <div className="ml-auto w-[86%] rotate-2 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-2xl">
              <img src={photos[5 % photos.length]} alt="InnoSCI alumni working together" className="h-[470px] w-full rounded-[1.4rem] object-cover" />
            </div>
            <div className="absolute -bottom-7 right-0 w-64 -rotate-2 rounded-2xl bg-white p-5 text-slate-950 shadow-2xl">
              <div className="mt-4 text-3xl font-bold">{stats?.mentors ?? 0}</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">alumni are currently offering mentorship.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 text-center md:grid-cols-4">
         {[
            [(stats?.alumni ?? 0).toLocaleString(), "Alumni worldwide"],
            [String(stats?.countries ?? 0), "Countries represented"],
            [String(stats?.mentors ?? 0), "Active mentors"],
            [String(stats?.programmes ?? 0), "Programmes"],
          ].map(([value, label]) => (
            <div key={label}><div className="text-2xl font-extrabold text-slate-950">{value}</div><div className="mt-1 text-xs font-semibold text-slate-400">{label}</div></div>
          ))}
        </div>
      </section>

            {current && (
        <section className="bg-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHeading eyebrow="Alumni spotlight" title="Stories that move us forward" description="Meet graduates using their InnoSCI foundation to shape industries, build communities and create lasting impact." />
            <div
              className="relative overflow-hidden rounded-[2rem] bg-navy-950 text-white shadow-xl shadow-slate-900/10"
              onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
              onTouchEnd={(event) => { const distance = touchStart.current - event.changedTouches[0].clientX; if (Math.abs(distance) > 50) distance > 0 ? next() : previous(); }}
            >
              <div key={current.user_id} className="spotlight-in grid min-h-[480px] lg:grid-cols-[0.84fr_1.16fr]">
                <div className="relative min-h-80 overflow-hidden">
                  {current.profile_picture_url ? (
                    <img src={current.profile_picture_url} alt={current.full_name} className="absolute inset-0 size-full object-cover object-top" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-navy-900 text-7xl font-bold text-teal-300">
                      {current.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-navy-950/20" />
                  {current.graduation_year && (
                    <div className="absolute bottom-6 left-6 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur-lg">Class of {current.graduation_year}</div>
                  )}
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
                  <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-teal-300">Spotlight {String(slide + 1).padStart(2, "0")}</div>
                  <div className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{current.full_name}</div>
                  <div className="mt-2 font-semibold text-teal-300">
                    {[current.job_title, current.company].filter(Boolean).join(" · ") || current.program || "InnoSCI alumni"}
                  </div>
                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                    {current.bio ||
                      `${current.full_name}${current.program ? ` studied ${current.program}` : " is part of the InnoSCI community"}${current.location ? ` and is based in ${current.location}` : ""}.`}
                  </p>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-5">
                    <Button variant="secondary" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={() => setPage("directory")}>View profile <ArrowRight className="size-4" /></Button>
                    <div className="flex items-center gap-2">
                      <button onClick={previous} className="grid size-10 place-items-center rounded-full border border-white/15 transition hover:bg-white/10" aria-label="Previous story"><ArrowLeft className="size-4" /></button>
                      <button onClick={next} className="grid size-10 place-items-center rounded-full bg-teal-400 text-navy-950 transition hover:bg-teal-300" aria-label="Next story"><ArrowRight className="size-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {slides.map((profile, index) => (
                <button key={profile.user_id} onClick={() => setSlide(index)} aria-label={`View ${profile.full_name}`} className={`h-2 rounded-full transition-all ${slide === index ? "w-8 bg-teal-500" : "w-2 bg-slate-300 hover:bg-slate-400"}`} />
              ))}
            </div>
          </div>
        </section>
      )}
      
      <section id="community-updates" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHeading
          eyebrow="Community updates"
          title="Featured Stories"
          description="Stay updated with announcements, events, opportunities and news from the InnoSCI community."
        />
        {isAdmin && (
          <div className="mb-6 flex justify-center">
            <Button onClick={() => setPage("admin")}>Manage announcements</Button>
          </div>
        )}
        {announcementError && (
          <p className="text-sm text-red-600">
            {announcementError}
          </p>
        )}
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h3 className="font-bold text-slate-900">
              No announcements yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Check back soon for updates from the InnoSCI community.
            </p>
          </div>
          ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement) => (
              <article
                key={announcement.announcement_id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                  InnoSCI Announcement
                </span>

                <h3 className="mt-3 text-xl font-bold text-slate-950">
                  {announcement.title}
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {announcement.message}
                </p>

                <p className="mt-5 text-xs text-slate-400">
                  {announcement.created_at
                    ? new Date(announcement.created_at).toLocaleDateString()
                    : ""}
                </p>
              </article>
            ))}
          </div>
          )
        }
        </div>
      </section>
      
            <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading
            eyebrow={isAdmin ? "Administration" : "One community, many possibilities"}
            title={isAdmin ? "Keep the community running smoothly" : "Your network for what comes next"}
            description={
              isAdmin
                ? "Approve new alumni, publish updates and keep an eye on mentorship activity."
                : "Find the people, guidance and opportunities to move your ambitions forward."
            }
          />
          <div className="grid gap-5 md:grid-cols-3">
            {(isAdmin
              ? [
                  { icon: UserCheck, title: "Approve alumni", text: "Review pending registrations and give new members access.", action: "Open approvals", page: "admin" as Page },
                  { icon: Sparkles, title: "Featured stories", text: "Publish announcements and news for the whole community.", action: "Manage stories", page: "admin" as Page },
                ]
              : [
                  { icon: Users, title: "Reconnect", text: "Find former classmates and discover graduates across industries and locations.", action: "Explore directory", page: "directory" as Page },
                  { icon: HeartHandshake, title: "Grow together", text: "Share experience, find a mentor or help the next generation navigate their path.", action: "Visit mentorship", page: "mentorship" as Page },
                ]
            ).map(({ icon: Icon, title, text, action, page }) => (
              <button key={title} onClick={() => setPage(page)} className="group rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5">
                <span className="grid size-12 place-items-center rounded-xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-500 group-hover:text-white"><Icon className="size-6" /></span>
                <span className="mt-6 block text-xl font-bold text-slate-950">{title}</span>
                <span className="mt-3 block text-sm leading-6 text-slate-500">{text}</span>
                <span className="mt-6 flex items-center gap-2 text-sm font-bold text-teal-700">{action}<ChevronRight className="size-4 transition group-hover:translate-x-1" /></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {!signedIn && (
        <section className="bg-teal-400 px-5 py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-7 md:flex-row">
            <div><div className="text-3xl font-bold tracking-tight text-navy-950">Your InnoSCI story continues here.</div><p className="mt-2 text-sm font-medium text-teal-950/70">Join a growing community that wants to see you thrive.</p></div>
            <Button className="bg-navy-950 px-6 py-3.5 text-white hover:bg-navy-900" onClick={() => setPage("register")}>Create your alumni profile <ArrowRight className="size-4" /></Button>
          </div>
        </section>
      )}
    </main>
  );
}