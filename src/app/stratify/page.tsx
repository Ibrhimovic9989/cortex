"use client";

import { Nav, Footer, Section, Container } from "@/components/Shell";
import { UploadPanel } from "@/components/UploadPanel";
import { StratifyInterpretation } from "@/components/Interpreter";
import { useState, useMemo } from "react";
import { embed, project2D, type EmbeddingRow } from "@/lib/api";

type Subject = {
  id: string;
  label: "ASD" | "TD" | "?";
  x: number; y: number;
  prob_asd: number;
  reconMSE?: number;
};

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
    });
  }
  return out;
})();

export default function StratifyPage() {
  const [subjects, setSubjects] = useState<Subject[]>(DEMO_SUBJECTS);
  const [isReal, setIsReal] = useState(false);
  const [selected, setSelected] = useState<Subject | null>(null);
  const [mode, setMode] = useState<"label" | "clusters">("label");
  const [k, setK] = useState(3);

  const handleUpload = async (file: File) => {
    const res = await embed(file);
    const embeds = res.subjects.map((s: EmbeddingRow) => s.embedding);
    const coords = project2D(embeds);
    const realSubs: Subject[] = res.subjects.map((s, i) => ({
      id: `sub-${String(s.idx).padStart(4, "0")}`,
      label: s.prob_asd > 0.5 ? "ASD" : "TD",
      x: coords[i][0], y: coords[i][1],
      prob_asd: s.prob_asd,
      reconMSE: s.recon_mse,
    }));
    setSubjects(realSubs);
    setIsReal(true);
    setSelected(null);
  };

  const resetToDemo = () => { setSubjects(DEMO_SUBJECTS); setIsReal(false); setSelected(null); };

  const clusters = useMemo(() => {
    const centroids: [number, number][] = [];
    for (let i = 0; i < k; i++) {
      const s = subjects[Math.floor((i * subjects.length) / k)];
      if (s) centroids.push([s.x, s.y]);
    }
    while (centroids.length < k) centroids.push([0, 0]);
    for (let iter = 0; iter < 12; iter++) {
      const sums: number[][] = Array(k).fill(0).map(() => [0, 0, 0]);
      subjects.forEach((s) => {
        let best = 0, bd = Infinity;
        centroids.forEach(([cx, cy], ci) => {
          const d = (s.x - cx) ** 2 + (s.y - cy) ** 2;
          if (d < bd) { bd = d; best = ci; }
        });
        sums[best][0] += s.x; sums[best][1] += s.y; sums[best][2] += 1;
      });
      sums.forEach((sum, ci) => {
        if (sum[2] > 0) centroids[ci] = [sum[0] / sum[2], sum[1] / sum[2]];
      });
    }
    const assignments = subjects.map((s) => {
      let best = 0, bd = Infinity;
      centroids.forEach(([cx, cy], ci) => {
        const d = (s.x - cx) ** 2 + (s.y - cy) ** 2;
        if (d < bd) { bd = d; best = ci; }
      });
      return best;
    });
    return { centroids, assignments };
  }, [k, subjects]);

  const summary = useMemo(() => {
    const out = Array(k).fill(0).map((_, i) => ({ cluster: i, n: 0, asd: 0, td: 0, avgProb: 0 }));
    subjects.forEach((s, i) => {
      const c = clusters.assignments[i];
      out[c].n += 1;
      if (s.label === "ASD") out[c].asd += 1; else out[c].td += 1;
      out[c].avgProb += s.prob_asd;
    });
    return out.map((x) => ({
      ...x,
      avgProb: x.n > 0 ? x.avgProb / x.n : 0,
      asdPct: x.n > 0 ? (x.asd / x.n) * 100 : 0,
    }));
  }, [k, clusters, subjects]);

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
              Every subject gets a 256-dim Cortex embedding. Projected to 2D via PCA. Cluster to reveal neural subgroups.
            </p>
          </div>

          <UploadPanel
            onUpload={handleUpload}
            onReset={resetToDemo}
            hasData={isReal}
            subjectCount={isReal ? subjects.length : undefined}
            helpText="CSV, Excel, or .npz with per-subject connectivity rows (4,950 cols). Cortex embeds each into 256-dim latent space, PCA-projects to 2D. Color defaults to the classifier's P(ASD) ≷ 0.5."
          />

          {isReal && subjects.length < 10 && (
            <div className="card p-4 mb-6 border-l-4" style={{ borderLeftColor: "var(--accent2)" }}>
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent2)" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div className="text-sm">
                  <strong className="text-[var(--heading)]">Need more subjects for meaningful stratification.</strong>{" "}
                  <span className="text-[var(--muted)]">
                    You uploaded {subjects.length}{" "}
                    {subjects.length === 1 ? "subject" : "subjects"}. Stratification requires at least 10 subjects to reveal meaningful patterns —
                    with fewer, clusters just reflect noise. See the interpretation below for what to do next.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex gap-2">
                  <button onClick={() => setMode("label")} className={`px-3 py-1.5 text-xs rounded-md transition ${mode === "label" ? "bg-[var(--hover-bg-strong)] text-[var(--heading)]" : "text-[var(--muted)] hover:bg-[var(--hover-bg)]"}`}>By P(ASD)</button>
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

              <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full aspect-square">
                <line x1="-1" y1="0" x2="1" y2="0" stroke="var(--border)" strokeWidth="0.002" />
                <line x1="0" y1="-1" x2="0" y2="1" stroke="var(--border)" strokeWidth="0.002" />
                {subjects.map((s, i) => {
                  const color = mode === "clusters"
                    ? clusterColors[clusters.assignments[i] % clusterColors.length]
                    : s.label === "ASD" ? "var(--accent)" : s.label === "TD" ? "var(--muted)" : "#888";
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
                {mode === "label" ? (
                  <>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent)" }}></span>P(ASD) &gt; 0.5 ({subjects.filter(s => s.label === "ASD").length})</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--muted)" }}></span>P(ASD) ≤ 0.5 ({subjects.filter(s => s.label === "TD").length})</span>
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
                  <div><span className="text-[var(--muted)]">P(ASD): </span><span className="text-[var(--text)]">{(selected.prob_asd * 100).toFixed(1)}%</span></div>
                  <div><span className="text-[var(--muted)]">Classifier call: </span><span className="chip" style={{ color: selected.label === "ASD" ? "var(--accent)" : "var(--muted)" }}>{selected.label}</span></div>
                  {selected.reconMSE !== undefined && (
                    <div><span className="text-[var(--muted)]">Recon MSE: </span><span className="text-[var(--text)] font-mono text-xs">{selected.reconMSE.toFixed(4)}</span></div>
                  )}
                  {mode === "clusters" && (
                    <div><span className="text-[var(--muted)]">Cluster: </span><span style={{ color: clusterColors[clusters.assignments[subjects.findIndex(s => s.id === selected.id)]] }}>
                      {clusters.assignments[subjects.findIndex(s => s.id === selected.id)]}
                    </span></div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Each dot is a subject positioned by their 256-dim Cortex embedding (PCA to 2D). Closer dots = more similar neural connectivity signatures.
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
                      <th className="text-right py-2">% classified ASD</th>
                      <th className="text-right py-2">Mean P(ASD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((c, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-3"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: clusterColors[i] }}></span>{i}</span></td>
                        <td className="text-right text-[var(--text)]">{c.n}</td>
                        <td className="text-right text-[var(--text)]">{c.asdPct.toFixed(0)}%</td>
                        <td className="text-right text-[var(--text)]">{(c.avgProb * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--muted)] mt-4 leading-relaxed">
                Clusters with high classifier-ASD enrichment reveal autism-associated subtypes. Mean P(ASD) shows how confident Cortex is within each cluster.
              </p>
            </div>
          )}

          <StratifyInterpretation
            totalSubjects={subjects.length}
            asdCount={subjects.filter((s) => s.label === "ASD").length}
            tdCount={subjects.filter((s) => s.label === "TD").length}
            k={k}
            mode={mode === "label" ? "label" : "clusters"}
            clusters={summary}
          />

          <div className="card p-6 mt-6">
            <h3 className="text-sm text-[var(--heading)] mb-3">How to prepare your data</h3>
            <ol className="text-sm text-[var(--muted)] space-y-2 leading-relaxed list-decimal ml-5">
              <li>Preprocess rs-fMRI through CPAC or fmriprep. Bandpass 0.01–0.1 Hz, detrend, z-score.</li>
              <li>Extract time-series with Schaefer 100-parcel atlas.</li>
              <li>Compute ROI-to-ROI correlation, Fisher-z transform, take upper triangle → 4,950-dim vector per subject.</li>
              <li>Stack into matrix <code className="text-xs">X</code> of shape <code className="text-xs">(N_subjects, 4950)</code>, save as <code className="text-xs">np.savez(&quot;cohort.npz&quot;, X=X)</code>.</li>
              <li>Upload above. Cortex returns embeddings, predictions, and reconstruction errors.</li>
            </ol>
          </div>
        </Container>
      </Section>
      <Footer />
    </main>
  );
}
