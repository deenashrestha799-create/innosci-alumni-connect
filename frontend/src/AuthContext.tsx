import { createContext, useContext } from "react";

export type Me = {
  user_id: string;
  email: string;
  full_name: string;
  role: "ALUMNI" | "ADMIN";
  status: "PENDING" | "APPROVED" | "REJECTED";
  phone?: string | null;
  program?: string | null;
  graduation_year?: number | null;
  bio?: string | null;
  skills?: string | null;
  interests?: string | null;
  job_title?: string | null;
  company?: string | null;
  linkedin_url?: string | null;
  location?: string | null;
  profile_picture_url?: string | null;
};

type AuthValue = { me: Me | null; logout: () => void; refreshMe: () => Promise<void> };

export const AuthContext = createContext<AuthValue>({ me: null, logout: () => {}, refreshMe: async () => {} });
export const useAuth = () => useContext(AuthContext);