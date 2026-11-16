import { useState } from "react";
import type { KeyboardEvent } from "react";
import { getCareerGuidance } from "./careerApi";
import type { CareerRequest, CareerResponse } from "./careerApi";
import "./career.css";

function TagInput(props: {
  label: string;
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");

  const add = () => {
    const value = text.trim().replace(/,$/, "");
    if (value && !props.tags.includes(value)) props.onChange([...props.tags, value]);
    setText("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !text && props.tags.length) {
      props.onChange(props.tags.slice(0, -1));
    }
  };

  return (
    <div className="ca-field">
      <label>{props.label}</label>
      <div className="ca-tags">
        {props.tags.map((t) => (
          <span key={t} className="ca-chip">
            {t}
            <button type="button" onClick={() => props.onChange(props.tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
              ×
            </button>
          </span>
        ))}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={add} placeholder={props.placeholder} />
      </div>
    </div>
  );
}

type Tab = "skills" | "courses" | "roadmap" | "mentors";

export default function CareerAssistant({ setPage }: { setPage?: (p: "dashboard") => void }) {  
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState<CareerRequest["experience_level"]>("student");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CareerResponse | null>(null);
  const [tab, setTab] = useState<Tab>("skills");

  const canSubmit = education.trim().length > 1 && role.trim().length > 1 && !loading;

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCareerGuidance({
        education: education.trim(),
        skills,
        interests,
        experience_level: level,
        target_role: role.trim(),
      });
      setResult(data);
      setTab("skills");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "skills", label: "Skills to learn" },
    { id: "courses", label: "Courses" },
    { id: "roadmap", label: "Roadmap" },
    { id: "mentors", label: "Alumni mentors" },
  ];

  return (
    <div className="ca-page">
      <header className="ca-header">
        {setPage && (
          <button
            className="ca-back"
            onClick={() => setPage("dashboard")}
          >
            ← Back to dashboard
          </button>
        )}
        <div>
          <h1>Career Guidance Assistant</h1>
          <p>Personalised learning paths and alumni mentors, powered by AI</p>
        </div>
        <span className="ca-badge">InnoSCI Alumni Connect</span>
      </header>

      <main className="ca-grid">
        <section className="ca-card ca-form">
          <h2>Your profile</h2>

          <div className="ca-field">
            <label>Educational background</label>
            <input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="e.g. BSc Computer Engineering" />
          </div>

          <TagInput label="Technical skills" tags={skills} onChange={setSkills} placeholder="Type a skill, press Enter" />
          <TagInput label="Career interests" tags={interests} onChange={setInterests} placeholder="e.g. Cloud, AI, Security" />

          <div className="ca-field">
            <label>Experience level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as CareerRequest["experience_level"])}>
              <option value="student">Student</option>
              <option value="entry">Entry level (0–1 yrs)</option>
              <option value="junior">Junior (1–3 yrs)</option>
              <option value="mid">Mid-level (3–6 yrs)</option>
              <option value="senior">Senior (6+ yrs)</option>
            </select>
          </div>

          <div className="ca-field">
            <label>Target job role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Cloud Engineer" />
          </div>

          <button className="ca-btn" disabled={!canSubmit} onClick={submit}>
            {loading ? "Generating your plan…" : "Get career guidance"}
          </button>
          {error && <div className="ca-error">{error}</div>}
        </section>

        <section className="ca-card ca-results">
          {!result && !loading && (
            <div className="ca-empty">
              <div className="ca-empty-icon">🎯</div>
              <h2>Your personalised plan will appear here</h2>
              <p>Fill in your profile and we’ll suggest skills, courses, a roadmap and alumni mentors.</p>
            </div>
          )}

          {loading && (
            <div className="ca-empty">
              <div className="ca-spinner" />
              <p>Analysing your profile… this can take 10–20 seconds.</p>
            </div>
          )}

          {result && !loading && (
            <>
              <div className="ca-summary">{result.summary}</div>

              <nav className="ca-tabs">
                {tabs.map((t) => (
                  <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </nav>

              {tab === "skills" && (
                <div className="ca-list">
                  {result.skills_to_learn.map((s) => (
                    <div key={s.name} className="ca-item">
                      <div className="ca-item-head">
                        <strong>{s.name}</strong>
                        <span className={`ca-pill ${s.priority}`}>{s.priority}</span>
                      </div>
                      <p>{s.why}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === "courses" && (
                <div className="ca-list">
                  {result.courses.map((c) => (
                    <div key={c.title} className="ca-item">
                      <div className="ca-item-head">
                        <strong>{c.title}</strong>
                        <span className="ca-pill provider">{c.provider}</span>
                      </div>
                      <p>{c.why}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === "roadmap" && (
                <ol className="ca-roadmap">
                  {result.roadmap.map((r) => (
                    <li key={r.step}>
                      <div className="ca-step-num">{r.step}</div>
                      <div className="ca-step-body">
                        <div className="ca-item-head">
                          <strong>{r.title}</strong>
                          <span className="ca-pill provider">{r.duration}</span>
                        </div>
                        <ul>
                          {r.actions.map((a) => (
                            <li key={a}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {tab === "mentors" && (
                <div className="ca-list">
                  {result.mentors.length === 0 && <p className="ca-muted">No close mentor match found in the alumni list yet.</p>}
                  {result.mentors.map((m) => (
                    <div key={m.name} className="ca-item ca-mentor">
                      <div className="ca-avatar">
                        {m.name
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <strong>{m.name}</strong>
                        <div className="ca-muted">{[m.role, m.company].filter(Boolean).join(" · ")}</div>
                        <p>{m.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
