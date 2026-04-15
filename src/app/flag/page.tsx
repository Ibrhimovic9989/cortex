"use client";

import { Nav, Footer, Section, Container } from "@/components/Shell";
import { useState, useMemo } from "react";

type ScanQC = {
  id: string;
  reconMSE: number;
  zScore: number;
  flagLevel: "clean" | "borderline" | "outlier";
  site?: string;
  notes: string[];
};

const DEMO_SCANS: ScanQC[] = (() => {
  const sites = ["NYU", "UM", "USM", "Stanford", "KKI", "UCLA", "Trinity"];
  const seed = (s: number) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
  const out: ScanQC[] = [];
  for (let i = 0; i < 40; i++) {
    const r = seed(i + 1);
    const mse = 0.02 + r * 0.15 + (i > 35 ? 0.2 : 0) + (i > 38 ? 0.3 : 0);
    const z = (mse - 0.08) / 0.03;
    const level: ScanQC["flagLevel"] = z > 2.5 ? "outlier" : z > 1.5 ? "borderline" : "clean";
    const notes: string[] = [];
    if (z > 2.5) notes.push("Connectivity pattern deviates >2.5σ from cohort norm");
    if (z > 1.5) notes.push("Consider manual review of preprocessing");
    if (seed(i * 5) > 0.8 && z > 1) notes.push("Possible motion artifact");
    if (seed(i * 7) > 0.9) notes.push("Atypical variance in default-mode regions");
    out.push({
      id: `sub-${String(1001 + i).padStart(5, "0")}`,
      reconMSE: parseFloat(mse.toFixed(4)),
      zScore: parseFloat(z.toFixed(2)),
      flagLevel: level,
      site: sites[i % sites.length],
      notes,
    });
  }
  return out.sort((a, b) => b.zScore - a.zScore);
})();

export default function FlagPage() {
  const [filter, setFilter] = useState<"all" | "outlier" | "borderline" | "clean">("all");
  const [selected, setSelected] = useState<ScanQC | null>(null);

  const filtered = useMemo(() =>
    filter === "all" ? DEMO_SCANS : DEMO_SCANS.filter((s) => s.flagLevel === filter),
    [filter]
  );

  const counts = useMemo(() => ({
    outlier: DEMO_SCANS.filter((s) => s.flagLevel === "outlier").length,
    borderline: DEMO_SCANS.filter((s) => s.flagLevel === "borderline").length,
    clean: DEMO_SCANS.filter((s) => s.flagLevel === "clean").length,
  }), []);

  const levelColor = {
    clean: "var(--accent)",
    borderline: "#fbbf24",
    outlier: "var(--accent2)",
  };

  return (
    <main>
      <Nav />
      <Section className="pt-28">
        <Container>
          <div className="mb-8">
            <div className="chip chip-accent mb-4">Tool 02 — Atypicality Flagger</div>
            <h1 className="text-4xl md:text-5xl tracking-tight mb-3">QC your neuroimaging cohort.</h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl">
              Cortex's reconstruction head scores how typical each subject's connectivity looks relative to the training distribution. High reconstruction error = atypical subject = probable preprocessing artifact, motion, or rare phenotype worth review.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Clean" value={counts.clean} color="var(--accent)" onClick={() => setFilter("clean")} active={filter === "clean"} />
            <StatCard label="Borderline (1.5-2.5σ)" value={counts.borderline} color="#fbbf24" onClick={() => setFilter("borderline")} active={filter === "borderline"} />
            <StatCard label="Outliers (>2.5σ)" value={counts.outlier} color="var(--accent2)" onClick={() => setFilter("outlier")} active={filter === "outlier"} />
          </div>

          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-[var(--heading)]">Reconstruction MSE distribution</h3>
              <button onClick={() => setFilter("all")} className={`text-xs px-2 py-1 rounded ${filter === "all" ? "bg-[var(--hover-bg-strong)]" : "text-[var(--muted)] hover:bg-[var(--hover-bg)]"}`}>All</button>
            </div>
            <div className="h-32 relative">
              <svg viewBox="0 0 400 100" className="w-full h-full">
                <line x1="0" y1="90" x2="400" y2="90" stroke="var(--border)" strokeWidth="0.5" />
                {DEMO_SCANS.map((s, i) => {
                  const x = (i / DEMO_SCANS.length) * 400;
                  const h = Math.min(85, s.reconMSE * 500);
                  return (
                    <rect key={s.id} x={x} y={90 - h} width={400 / DEMO_SCANS.length - 1} height={h}
                          fill={levelColor[s.flagLevel]} opacity="0.8"
                          onMouseEnter={() => setSelected(s)}
                          style={{ cursor: "pointer" }} />
                  );
                })}
              </svg>
              <div className="absolute left-0 right-0 top-0 flex justify-between text-[10px] text-[var(--muted)] font-mono">
                <span>Low MSE</span><span>High MSE (atypical)</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2">
              <h3 className="text-sm text-[var(--heading)] mb-4">
                {filter === "all" ? "All scans" : `${filter === "clean" ? "Clean" : filter === "borderline" ? "Borderline" : "Outlier"} scans`}
                <span className="text-[var(--muted)] ml-2">({filtered.length})</span>
              </h3>
              <div className="overflow-x-auto max-h-[480px] scroll-shadow overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-[var(--muted)] border-b border-[var(--border)] sticky top-0 bg-[var(--card)]">
                    <tr>
                      <th className="text-left py-2">Scan ID</th>
                      <th className="text-left py-2">Site</th>
                      <th className="text-right py-2">Recon MSE</th>
                      <th className="text-right py-2">z-score</th>
                      <th className="text-right py-2">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id} onClick={() => setSelected(s)} className={`border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-[var(--hover-bg)] ${selected?.id === s.id ? "bg-[var(--hover-bg-strong)]" : ""}`}>
                        <td className="py-3 font-mono text-xs">{s.id}</td>
                        <td className="py-3 text-[var(--muted)]">{s.site}</td>
                        <td className="py-3 text-right text-[var(--text)] font-mono">{s.reconMSE}</td>
                        <td className="py-3 text-right font-mono" style={{ color: s.zScore > 2.5 ? "var(--accent2)" : s.zScore > 1.5 ? "#fbbf24" : "var(--muted)" }}>
                          {s.zScore > 0 ? "+" : ""}{s.zScore}σ
                        </td>
                        <td className="py-3 text-right">
                          <span className="chip" style={{ color: levelColor[s.flagLevel] }}>
                            {s.flagLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-sm text-[var(--heading)] mb-4">{selected ? "Review panel" : "Select a scan"}</h3>
              {selected ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Scan</div>
                    <code className="text-[var(--text)]">{selected.id}</code>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Site</div>
                    <div className="text-[var(--text)]">{selected.site}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Reconstruction MSE</div>
                    <div className="text-[var(--text)] font-mono">{selected.reconMSE}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Flag level</div>
                    <span className="chip" style={{ color: levelColor[selected.flagLevel] }}>
                      {selected.flagLevel}
                    </span>
                  </div>
                  {selected.notes.length > 0 && (
                    <div>
                      <div className="text-xs text-[var(--muted)] mb-2">Auto-detected notes</div>
                      <ul className="space-y-2">
                        {selected.notes.map((n, i) => (
                          <li key={i} className="text-xs text-[var(--text)] leading-relaxed flex gap-2">
                            <span className="text-[var(--accent2)] font-mono">•</span>
                            {n}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <button className="w-full mt-4 px-4 py-2 text-xs border border-[var(--border-strong)] rounded-md hover:bg-[var(--hover-bg)] transition">
                    Mark for manual review
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Click any row or bar to inspect a scan. Outliers warrant review of raw BOLD, head motion, and preprocessing logs.
                </p>
              )}
            </div>
          </div>

          <div className="card p-6 mt-6">
            <h3 className="text-sm text-[var(--heading)] mb-3">How the QC signal works</h3>
            <div className="text-sm text-[var(--muted)] space-y-2 leading-relaxed">
              <p>Cortex's reconstructor head is trained to reproduce the 4,950-dim connectivity features from the 256-dim embedding. Low MSE = "connectivity looks like everything Cortex has seen before." High MSE = "this scan doesn't fit the learned distribution."</p>
              <p>Common causes of outlier MSE: <span className="text-[var(--text)]">(1) preprocessing errors</span>, <span className="text-[var(--text)]">(2) excessive head motion</span>, <span className="text-[var(--text)]">(3) novel site-specific artifacts</span>, <span className="text-[var(--text)]">(4) genuine rare phenotype worth investigating</span>. Cortex doesn't distinguish between these — manual review does.</p>
            </div>
          </div>
        </Container>
      </Section>
      <Footer />
    </main>
  );
}

function StatCard({ label, value, color, onClick, active }: { label: string; value: number; color: string; onClick: () => void; active: boolean }) {
  return (
    <button onClick={onClick} className={`card p-6 text-left hover:border-[var(--accent)] transition ${active ? "border-[var(--accent)]" : ""}`}>
      <div className="text-sm text-[var(--muted)] mb-1">{label}</div>
      <div className="text-3xl tracking-tight" style={{ color }}>{value}</div>
    </button>
  );
}
