import { useState, type FormEvent } from "react";
import { Field } from "./components/Fields";
import { Button } from "./components/ui";
import { signIn, signOut } from "./auth";
import { apiFetch } from "./api";
import type { Page } from "./App";

export type Me = {
  user_id: string;
  email: string;
  full_name: string;
  role: "ALUMNI" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export default function LoginPage({ setPage, onLoggedIn }: { setPage: (p: Page) => void; onLoggedIn: (me: Me) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    setBusy(true);
    try {
      await signIn(email, password);                 // step 1: Cognito
      const res = await apiFetch("/me");             // step 2: our API
      if (!res.ok) {
        signOut();
        setError(res.status === 404
          ? "Your profile was not found. Please contact the InnoSCI team."
          : "Could not load your profile. Please try again.");
        return;
      }
      const me: Me = await res.json();
      if (me.status !== "APPROVED") {
        signOut();
        setError(me.status === "REJECTED"
          ? "Your registration was not approved."
          : "Your profile is still awaiting approval.");
        return;
      }
      onLoggedIn(me);
      setPage(me.role === "ADMIN" ? "admin" : "dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(message.includes("disabled")
        ? "Your profile is still awaiting approval."
        : message.includes("Incorrect")
        ? "Incorrect email or password."
        : "Could not sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-5rem)] place-items-center bg-slate-50 px-5 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Welcome back</h1>
        <Field label="Email Address" name="email" type="email" placeholder="you@email.com" required />
        <Field label="Password" name="password" type="password" placeholder="Your password" required />
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in..." : "Login"}</Button>
        <div className="text-right">
        <button
          type="button"
          onClick={() => setPage("forgot-password")}
          className="text-sm font-semibold text-teal-700 hover:text-teal-900"
        >
          Forgot password?
        </button>
      </div>
        <button type="button" onClick={() => setPage("register")} className="block w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-900">
          New here? Join the network
        </button>
      </form>
    </main>
  );
}