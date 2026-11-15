import type { Page } from "./App";

export function Avatar({ src, name, className = "size-11" }: { src?: string | null; name: string; className?: string }) {
  if (!src) {
    const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
    return <span className={`${className} grid shrink-0 place-items-center rounded-full bg-teal-100 text-sm font-bold text-teal-800 ring-2 ring-white`}>{initials}</span>;
  }
  return <img src={src} alt={`${name} profile`} className={`${className} shrink-0 rounded-full object-cover ring-2 ring-white`} />;
}

export function Logo({
  compact = false,
  setPage,
}: {
  compact?: boolean;
  setPage?: (page: Page) => void;
}) {
  return (
    <button
      onClick={() => {
        setPage?.("home");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="flex items-center rounded-lg bg-white px-2 py-1.5 text-left"
      aria-label="InnoSCI Alumni Connect home"
    >
      <img
        src="/src/assets/innoSciLogo.png"
        alt="InnoSCI School of Programming"
        className={compact ? "h-9 w-auto" : "h-11 w-auto"}
      />
    </button>
  );
}