"use client";

import { Nav, Footer, Section, Container } from "@/components/Shell";
import { useState, useMemo } from "react";

type Subject = {
  id: string;
  label: "ASD" | "TD";
  x: number; y: number;
  prob_asd: number;
  age?: number; sex?: "M" | "F";
};

// Demo cohort — in production, replace with POST /api/cortex/embed on uploaded npz
const DEMO_SUBJECTS: Subject[] = (() => {
  const out: Subject[] = [];
  const seed = (s: number) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };
  for (let i = 0; i < 80; i++) {
    const asd = i % 2 === 0;
    const cluster = asd ? (i < 40 ? 1 : 2) : 0;
    const cx = cluster === 0 ? -0.4 : cluster === 1 ? 0.3 : 0.5;
    const cy = cluster === 0 ? 0.1 : cluster === 1 ? 0.4 : -0.4;
    out.push({
      id: `S${String(i + 1).padStart(3, "0")}`,
      label: asd ? "ASD" : "TD",
      x: cx + (seed(i * 7) - 0.5) * 0.35,
      y: cy + (seed(i * 13) - 0.5) * 0.35,
      prob_asd: asd ? 0.5 + seed(i * 3) * 0.5 : seed(i * 5) * 0.5,
      age: Math.round(6 + seed(i * 11) * 40),
      sex: seed(i * 17) > 0.4 ? "M" : "F",
    });
  }
  return out;
})();

export default function StratifyPage() {
  const [selected, setSelected] = useState<Subject | null>(null);
  const [mode, setMode] = useState<"embedding" | "clusters">("embedding");
  const [k, setK] = useState(3);

  const clusters = useMemo(() => {
    // Simple 2D k-means for demo — production would send to /api/cortex/cluster
    const centroids: [number, number][] = [];
    for (let i = 0; i < k; i++) {
      const s = DEMO_SUBJECTS[Math.floor((i * DEMO_SUBJECTS.length) / k)];
      centroids.push([s.x, s.y]);
    }
    for (let iter = 0; iter < 8; iter++) {
      const sums: number[][] = Array(k).fill(0).map(() => [0, 0, 0]);
      DEMO_SUBJECTS.forEach((s) => {
        let best = 0, bd = Infinity;
        centroids.forEach(([cx, cy], ci) => {
          const d = (s.x - cx) ** 2 + (s.y - cy) ** 2;
          if (d < bd) { bd = d; best = ci; }
        });
        sums[best][0] += s.x; sums[best][1] += s.y; sums[best][2] += 1;
      });
      sums.forEach((sum, ci) => {
        if (sum[2] > 0) { centroids[ci] = [sum[0] / sum[2], sum[1] / sum[2]]; }
      });
    }
    const assignments = DEMO_SUBJECTS.map((s) => {
      let best = 0, bd = Infinity;
      centroids.forEach(([cx, cy], ci) => {
        const d = (s.x - cx) ** 2 + (s.y - cy) ** 2;
        if (d < bd) { bd = d; best = ci; }
      });
      return best;
    });
    return { centroids, assignments };
  }, [k]);

  const summary = useMemo(() => {
    const out = Array(k).fill(0).map((_, i) => ({
      cluster: i, n: 0, asd: 0, td: 0, meanAge: 0, femalePct: 0,
    }));
    DEMO_SUBJECTS.forEach((s, i) => {
      const c = clusters.assignments[i];
      out[c].n += 1;
      if (s.label === "ASD") out[c].asd += 1; else out[c].td += 1;
      out[c].meanAge += s.age || 0;
      if (s.sex === "F") out[c].femalePct += 1;
    });
    return out.map((x) => ({
      ...x,
      meanAge: x.n > 0 ? x.meanAge / x.n : 0,
      femalePct: x.n > 0 ? (x.femalePct / x.n) * 100 : 0,
      asdPct: x.n > 0 ? (x.asd / x.n) * 100 : 0,
    }));
  }, [k, clusters]);

  const clusterColors = ["var(--accent)", "var(--accent2)", "#a78bfa", "#fb923c", "#f472b6"];

  return (
    <main>
      <Nav />
      <Section className="pt-28">
        <Container>
          <div className="mb-8">
            <div className="chip chip-accent mb-4">Tool 01 — Cohort Stratifier</div>
            <h1 className="text-4xl md:text-5xl tracking-tight mb-3">Discover autism subtypes.</h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl">
              Every subject gets a 256-dim Cortex embedding. Project to 2D (UMAP). Cluster to reveal neural subgroups. This demo uses precomputed embeddings; upload your own <code className="text-xs">.npz</code> to stratify your cohort.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button onClick={() => setMode("embedding")} className={`px-3 py-1.5 text-xs rounded-md transition ${mode === "embedding" ? "bg-[var(--hover-bg-strong)] text-[var(--heading)]" : "text-[var(--muted)] hover:bg-[var(--hover-bg)]"}`}>By label</button>
                  <button onClick={() => setMode("clusters")} className={`px-3 py-1.5 text-xs rounded-md transition ${mode === "clusters" ? "bg-[var(--hover-bg-strong)] text-[var(--heading)]" : "text-[var(--muted)] hover:bg-[var(--hover-bg)]"}`}>By cluster</button>
                </div>
                {mode === "clusters" && (
                  <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                    k =
                    <input type="range" min={2} max={5} value={k} onChange={(e) => setK(parseInt(e.target.value))} className="w-20" />
                    <span className="text-[var(--text)] w-4">{k}</span>
                  </div>
                )}
              </div>

              <svg viewBox="-1 -1 2 2" className="w-full aspect-square">
                <line x1="-1" y1="0" x2="1" y2="0" stroke="var(--border)" strokeWidth="0.002" />
                <line x1="0" y1="-1" x2="0" y2="1" stroke="var(--border)" strokeWidth="0.002" />
                {DEMO_SUBJECTS.map((s, i) => {
                  const color = mode === "clusters"
                    ? clusterColors[clusters.assignments[i] % clusterColors.length]
                    : s.label === "ASD" ? "var(--accent)" : "var(--muted)";
                  const isSel = selected?.id === s.id;
                  return (
                    <circle
                      key={s.id} cx={s.x} cy={s.y} r={isSel ? 0.035 : 0.02}
                      fill={color} opacity={isSel ? 1 : 0.8}
                      stroke={isSel ? "var(--heading)" : "none"} strokeWidth="0.005"
                      style={{ cursor: "pointer", transition: "r 0.15s" }}
                      onClick={() => setSelected(s)}
                    />
                  );
                })}
                {mode === "clusters" && clusters.centroids.map(([cx, cy], i) => (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="0.04" fill="none" stroke={clusterColors[i]} strokeWidth="0.008" />
                    <text x={cx} y={cy + 0.005} fontSize="0.05" fill={clusterColors[i]} textAnchor="middle" dominantBaseline="middle" style={{ fontWeight: 600 }}>{i}</text>
                  </g>
                ))}
              </svg>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--muted)]">
                {mode === "embedding" ? (
                  <>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent)" }}></span>ASD ({DEMO_SUBJECTS.filter(s => s.label === "ASD").length})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--muted)" }}></span>TD ({DEMO_SUBJECTS.filter(s => s.label === "TD").length})</span>
                  </>
                ) : summary.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: clusterColors[i] }}></span>
                    Cluster {i} (n={c.n})
                  </span>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-sm text-[var(--heading)] mb-4">{selected ? "Subject detail" : "Click a point"}</h3>
              {selected ? (
                <div className="space-y-3 text-sm">
                  <div><span className="text-[var(--muted)]">ID: </span><code className="text-[var(--text)]">{selected.id}</code></div>
                  <div><span className="text-[var(--muted)]">Label: </span><span className="chip" style={{ color: selected.label === "ASD" ? "var(--accent)" : "var(--muted)" }}>{selected.label}</span></div>
                  <div><span className="text-[var(--muted)]">P(ASD): </span><span className="text-[var(--text)]">{(selected.prob_asd * 100).toFixed(1)}%</span></div>
                  <div><span className="text-[var(--muted)]">Age: </span><span className="text-[var(--text)]">{selected.age}y</span></div>
                  <div><span className="text-[var(--muted)]">Sex: </span><span className="text-[var(--text)]">{selected.sex}</span></div>
                  {mode === "clusters" && (
                    <div><span className="text-[var(--muted)]">Cluster: </span><span style={{ color: clusterColors[clusters.assignments[DEMO_SUBJECTS.findIndex(s => s.id === selected.id)]] }}>
                      {clusters.assignments[DEMO_SUBJECTS.findIndex(s => s.id === selected.id)]}
                    </span></div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Each dot is one subject positioned by their Cortex embedding (UMAP to 2D). Closer dots = more similar neural connectivity.
                </p>
              )}
            </div>
          </div>

          {mode === "clusters" && (
            <div className="card p-6 mt-6">
              <h3 className="text-sm text-[var(--heading)] mb-4">Cluster composition</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-[var(--muted)] border-b border-[var(--border)]">
                    <tr>
                      <th className="text-left py-2">Cluster</th>
                      <th className="text-right py-2">n</th>
                      <th className="text-right py-2">% ASD</th>
                      <th className="text-right py-2">Mean age</th>
                      <th className="text-right py-2">% Female</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((c, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-3"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: clusterColors[i] }}></span>{i}</span></td>
                        <td className="text-right text-[var(--text)]">{c.n}</td>
                        <td className="text-right text-[var(--text)]">{c.asdPct.toFixed(0)}%</td>
                        <td className="text-right text-[var(--text)]">{c.meanAge.toFixed(1)}y</td>
                        <td className="text-right text-[var(--text)]">{c.femalePct.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
                Clusters with high ASD-purity reveal autism-enriched subtypes. Age and sex composition help interpret whether clusters reflect developmental stage vs. neural phenotype.
              </p>
            </div>
          )}

          <div className="card p-6 mt-6">
            <h3 className="text-sm text-[var(--heading)] mb-3">How to use this on your data</h3>
            <ol className="text-sm text-[var(--muted)] space-y-2 leading-relaxed list-decimal ml-5">
              <li>Extract connectivity features (4950-dim Fisher-z from Schaefer 100 atlas)</li>
              <li>Upload as <code className="text-xs">.npz</code> via the API (endpoint coming soon)</li>
              <li>Cortex returns per-subject 256-dim embedding</li>
              <li>UMAP to 2D, k-means to cluster, examine composition</li>
            </ol>
          </div>
        </Container>
      </Section>
      <Footer />
    </main>
  );
}
