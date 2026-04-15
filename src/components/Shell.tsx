"use client";

import { useEffect, useState, ReactNode } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const t = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };
  return (
    <button onClick={toggle} className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition text-[var(--muted)]" aria-label="Toggle theme">
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  const links = [
    { href: "/stratify", label: "Stratify" },
    { href: "/flag", label: "Flag" },
    { href: "/biomarkers", label: "Biomarkers" },
    { href: "/methods", label: "Methods" },
    { href: "https://mind.new", label: "AQAL" },
  ];
  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || open ? "nav-bg backdrop-blur-xl border-b border-[var(--border)]" : ""}`}>
        <div className="max-w-[1024px] mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <span className="text-[24px] tracking-tight leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontWeight: 500 }}>
              <span className="gradient-text">cortex</span>
            </span>
          </a>
          <div className="hidden md:flex items-center gap-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-[var(--muted)] hover:text-[var(--heading)] px-3 py-1.5 rounded-md hover:bg-[var(--hover-bg)] transition">
                {l.label}
              </a>
            ))}
            <ThemeToggle />
          </div>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setOpen(!open)} className="p-2 text-[var(--muted)]" aria-label="Menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? <path d="M18 6L6 18M6 6l12 12"/> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
              </svg>
            </button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t border-[var(--border)] nav-bg backdrop-blur-xl">
            <div className="max-w-[1024px] mx-auto px-6 py-4 flex flex-col gap-1">
              {links.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-[var(--muted)] hover:text-[var(--heading)] py-2">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-24 py-12 px-6">
      <div className="max-w-[1024px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="text-sm text-[var(--muted)]">
          <div className="text-[var(--heading)] mb-1">Cortex — Brain Pattern Recognition</div>
          Research tool by Leeza Care Foundation. Not for clinical diagnosis.
        </div>
        <div className="flex gap-6 text-sm text-[var(--muted)]">
          <a href="/methods" className="hover:text-[var(--heading)]">Methods</a>
          <a href="https://mind.new" className="hover:text-[var(--heading)]">AQAL</a>
          <a href="https://mind.new/privacy" className="hover:text-[var(--heading)]">Privacy</a>
        </div>
      </div>
    </footer>
  );
}

export function Section({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return <section id={id} className={`py-20 px-6 ${className}`}>{children}</section>;
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-[1024px] mx-auto ${className}`}>{children}</div>;
}
