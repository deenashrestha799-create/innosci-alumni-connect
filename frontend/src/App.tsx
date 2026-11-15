import { useEffect, useMemo, useState } from "react";
import LoginPage from "./LoginPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import { AuthContext, type Me } from "./AuthContext";
import { getToken, signOut } from "./auth";
import { apiFetch } from "./api";

export type Page =
  | "home"
  | "register"
  | "login"
  | "forgot-password"
  | "dashboard"
  | "directory"
  | "edit-profile"
  | "mentorship"
  | "alumniCards"
  | "admin";
export type DirectoryScope = "all" | "program" | "cohort";
export type Alumni = {
  name: string;
  year: string;
  role: string;
  company: string;
  location: string;
  skills: string[];
  image: string;
  program: string;
};

import RegistrationPage from "./Registration";
import { Logo} from "./Picture";
import { DashboardPage } from "./DashBoardPage";
import { AdminPage } from "./Admin";
import { MentorshipPage } from "./MentorshipPage";
import { HomePage } from "./HomePage";
import { PublicHeader } from "./PublicHeader";
import { DirectoryPage } from "./DirectoryPage";

function Footer({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <footer className="bg-navy-950 px-5 py-12 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-center">
        <div>
          <Logo setPage={setPage} />
          <p className="mt-4 max-w-sm text-xs leading-5">Connecting InnoSCI graduates to people, ideas and possibilities that last a lifetime.</p></div><div className="flex flex-wrap gap-6 text-xs font-semibold"><span>Community guidelines</span><span>Privacy</span><span>Help centre</span><span>© 2025 InnoSCI</span></div></div></footer>);
}

export default function App() {
  const [page, setPageState] = useState<Page>("home");
  const [me, setMe] = useState<Me | null>(null);
  const [checking, setChecking] = useState(true);

  const [directoryScope, setDirectoryScope] = useState<DirectoryScope>("all");

  const setPage = (next: Page) => {
    setDirectoryScope("all");
    setPageState(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDirectory = (scope: DirectoryScope) => {
    setDirectoryScope(scope);
    setPageState("directory");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // Restore the session after a refresh
  useEffect(() => {
    (async () => {
      try {
        if (await getToken()) {
          const res = await apiFetch("/me");
          if (res.ok) {
            const profile: Me = await res.json();
            if (profile.status === "APPROVED") {
              setMe(profile);
              setPageState(
                profile.role === "ADMIN" ? "admin" : "dashboard"
              );
            }
          }
        }
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const logout = () => {
    signOut();
    setMe(null);
    setPage("home");
  };

  const refreshMe = async () => {
    const res = await apiFetch("/me");
    if (res.ok) setMe(await res.json());
  };

  // Pages that need a login, and admin-only pages
  const needsLogin: Page[] = ["dashboard", "edit-profile", "directory", "mentorship", "admin"];
  let current: Page = page;
  if (needsLogin.includes(page) && !me) {
    current = "login";
  }

  if (page === "admin" && me) {
    current = me.role === "ADMIN" ? "admin" : "dashboard";
  }

  const publicPage = useMemo(() => ["home", "register", "login", "forgot-password"].includes(current),[current]);

  if (checking) return <div className="min-h-screen bg-white" />;

  return (
    <AuthContext.Provider value={{ me, logout, refreshMe }}>
      <div className="min-h-screen bg-white">
        {publicPage && (
          <PublicHeader
            page={current}
            setPage={setPage}
            signedInPage={me ? (me.role === "ADMIN" ? "admin" : "dashboard") : undefined}
          />
        )}
        {current === "home" && <><HomePage setPage={setPage} /><Footer setPage={setPage} /></>}
        {current === "register" && <RegistrationPage setPage={setPage} />}
        {current === "login" && (
          <LoginPage
            setPage={setPage}
            onLoggedIn={(profile) => {
              setMe(profile);

              if (profile.role === "ADMIN") {
                setPage("admin");
              } else {
                setPage("dashboard");
              }
            }}
          />
        )}
        {current === "forgot-password" && (<ForgotPasswordPage setPage={setPage} />)}
        {current === "dashboard" && <DashboardPage setPage={setPage} openDirectory={openDirectory} />}
        {current === "directory" && <DirectoryPage setPage={setPage} initialScope={directoryScope} />}
        {current === "mentorship" && <MentorshipPage setPage={setPage} />}
        {current === "admin" && <AdminPage setPage={setPage} />}
      </div>
    </AuthContext.Provider>
  );
}