
import { useState, type FormEvent } from "react";
import { forgotPassword, confirmPassword } from "./auth";
import type { Page } from "./App";

type Props = {
  setPage: (page: Page) => void;
};

export default function ForgotPasswordPage({ setPage }: Props) {
  const [step, setStep] = useState<"email" | "reset">("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setBusy(true);

    try {
      await forgotPassword(email);

      setStep("reset");
      setMessage(
        "If the account is eligible for password recovery, a verification code has been sent to your registered email."
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "";

      if (errorMessage.includes("LimitExceeded")) {
        setError("Too many requests. Please try again later.");
      } else if (errorMessage.includes("InvalidParameter")) {
        setError("Password recovery is not configured correctly. Please contact support.");
      } else if (errorMessage.includes("Network")) {
        setError("Network error. Please check your connection.");
      } else {
        setError(
          "Unable to process your request. Please check your email or try again later."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setBusy(true);

    try {
      await confirmPassword(email, code, password);

      setMessage("Your password has been successfully reset.");

      setTimeout(() => {
        setPage("login");
      }, 1500);

    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "";

      if (errorMessage.includes("CodeMismatch")) {
        setError("Invalid verification code. Please try again.");
      } else if (errorMessage.includes("ExpiredCode")) {
        setError("Verification code has expired. Please request a new code.");
      } else if (errorMessage.includes("InvalidPassword")) {
        setError("Password does not meet your Cognito password policy.");
      } else if (errorMessage.includes("LimitExceeded")) {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Password reset failed. Please check your details and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setMessage("");
    setBusy(true);

    try {
      await forgotPassword(email);
      setMessage("A new verification code has been requested.");
    } catch {
      setError("Unable to resend the verification code. Please try again later.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-5rem)] place-items-center bg-slate-50 px-5 py-16">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

        {step === "email" ? (
          <>
            <h1 className="text-2xl font-bold text-slate-950">
              Forgot Password?
            </h1>

            <p className="text-sm leading-6 text-slate-500">
              Enter your registered email address. We will send you
              a verification code to reset your password.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {error && (
                <p className="text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {busy ? "Sending..." : "Send Verification Code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-950">
              Reset Password
            </h1>

            <p className="text-sm leading-6 text-slate-500">
              Enter the verification code sent to your registered
              email address and create your new password.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Verification Code
                </label>

                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter verification code"
                  required
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  New Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              {error && (
                <p className="text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}

              {message && (
                <p className="text-sm font-semibold text-green-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                {busy ? "Updating..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={busy}
                className="block w-full text-center text-sm font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-50"
              >
                Resend Verification Code
              </button>
            </form>
          </>
        )}

        <button
          type="button"
          onClick={() => setPage("login")}
          className="block w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          Back to Login
        </button>

      </div>
    </main>
  );
}
