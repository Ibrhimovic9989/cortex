"use client";

import { Nav, Footer, Section, Container } from "@/components/Shell";
import { useState, useMemo } from "react";

type ROIPair = {
  roi1: string; roi2: string;
  network1: string; network2: string;
  importance: number;   // integrated gradient magnitude
  direction: "ASD↑" | "ASD↓"; // sign
  p_fdr: number;
};

const NETWORKS = ["DMN", "SomMot", "Vis", "Limbic", "Control", "DAN", "VAN"];
const NETWORK_COLORS: Record<string, string> = {
  DMN: "#a78bfa",
  SomMot: "#38bdf8",
  Vis: "#fb923c",
  Limbic: "#f472b6",
  Control: "#00d9a3",
  DAN: "#fbbf24",
  VAN: "#60a5fa",
};

// Demo biomarkers — realistic network names, integrated-gradient-style importance
const DEMO_BIOMARKERS: ROIPair[] = [
  { roi1: "L_Temp_DMN", roi2: "R_Temp_DMN", network1: "DMN", network2: "DMN", importance: 0.92, direction: "ASD↑", p_fdr: 0.001 },
  { roi1: "L_Insula", roi2: "R_Insula", network1: "Limbic", network2: "Limbic", importance: 0.87, direction: "ASD↓", p_fdr: 0.003 },
  { roi1: "L_PostCg_DMN", roi2: "R_PFC_DMN", network1: "DMN", network2: "DMN", importance: 0.84, direction: "ASD↑", p_fdr: 0.004 },
  { roi1: "L_STG_DMN", roi2: "R_STG_Vis", network1: "DMN", network2: "Vis", importance: 0.78, direction: "ASD↓", p_fdr: 0.008 },
  { roi1: "L_Amyg_Limbic", roi2: "L_IPS_DAN", network1: "Limbic", network2: "DAN", importance: 0.76, direction: "ASD↑", p_fdr: 0.011 },
  { roi1: "L_IFG_VAN", roi2: "R_TPJ_VAN", network1: "VAN", network2: "VAN", importance: 0.73, direction: "ASD↓", p_fdr: 0.014 },
  { roi1: "L_V1_Vis", roi2: "L_MT_Vis", network1: "Vis", network2: "Vis", importance: 0.69, direction: "ASD↑", p_fdr: 0.018 },
  { roi1: "L_S1_SomMot", roi2: "R_S1_SomMot", network1: "SomMot", network2: "SomMot", importance: 0.66, direction: "ASD↓", p_fdr: 0.022 },
  { roi1: "L_dlPFC_Control", roi2: "R_dlPFC_Control", network1: "Control", network2: "Control", importance: 0.63, direction: "ASD↓", p_fdr: 0.027 },
  { roi1: "L_Amyg_Limbic", roi2: "R_Amyg_Limbic", network1: "Limbic", network2: "Limbic", importance: 0.60, direction: "ASD↑", p_fdr: 0.031 },
  { roi1: "L_vmPFC_DMN", roi2: "L_Amyg_Limbic", network1: "DMN", network2: "Limbic", importance: 0.58, direction: "ASD↓", p_fdr: 0.036 },
  { roi1: "L_M1_SomMot", roi2: "L_S1_SomMot", network1: "SomMot", network2: "SomMot", importance: 0.54, direction: "ASD↑", p_fdr: 0.042 },
  { roi1: "R_pSTS_VAN", roi2: "L_FFA_Vis", network1: "VAN", network2: "Vis", importance: 0.51, direction: "ASD↓", p_fdr: 0.048 },
  { roi1: "L_IPS_DAN", roi2: "R_IPS_DAN", network1: "DAN", network2: "DAN", importance: 0.48, direction: "ASD↓", p_fdr: 0.055 },
  { roi1: "L_Hippo_Limbic", roi2: "L_PostCg_DMN", network1: "Limbic", network2: "DMN", importance: 0.45, direction: "ASD↑", p_fdr: 0.062 },
];

export default function BiomarkersPage() {
  const [selected, setSelected] = useState<ROIPair | null>(DEMO_BIOMARKERS[0]);
  const [filter, setFilter] = useState<"all" | "up" | "down">("all");
  const [netFilter, setNetFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let arr = DEMO_BIOMARKERS;
    if (filter === "up") arr = arr.filter((b) => b.direction === "ASD↑");
    if (filter === "down") arr = arr.filter((b) => b.direction === "ASD↓");
    if (netFilter) arr = arr.filter((b) => b.network1 === netFilter || b.network2 === netFilter);
    return arr;
  }, [filter, netFilter]);

  const networkSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    NETWORKS.forEach((n) => { counts[n] = 0; });
    DEMO_BIOMARKERS.forEach((b) => {
      counts[b.network1] = (counts[b.network1] || 0) + b.importance;
      counts[b.network2] = (counts[b.network2] || 0) + b.importance;
    });
    const max = Math.max(...Object.values(counts));
    return NETWORKS.map((n) => ({ network: n, weight: counts[n] / max }));
  }, []);

  return (
    <main>
      <Nav />
      <Section className="pt-28">
        <Container>
          <div className="mb-8">
            <div className="chip chip-accent mb-4">Tool 03 — Biomarker Explorer</div>
            <h1 className="text-4xl md:text-5xl tracking-tight mb-3">ROI-pair importance for autism classification.</h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl">
              Integrated-gradients analysis on Cortex reveals which connectivity edges drive ASD predictions. Each ROI-pair ranked by mean gradient magnitude across the cohort, with directionality (ASD&uarr; = stronger in autism, ASD&darr; = weaker).
            </p>
          </div>

          <div className="card p-6 mb-6">
            <h3 className="text-sm text-[var(--heading)] mb-4">Network-level importance</h3>
            <div className="space-y-2">
              {networkSummary.map((ns) => (
                <button
                  key={ns.network}
                  onClick={() => setNetFilter(netFilter === ns.network ? null : ns.network)}
                  className={`w-full flex items-center gap-3 py-1.5 px-2 rounded hover:bg-[var(--hover-bg)] transition ${netFilter === ns.network ? "bg-[var(--hover-bg-strong)]" : ""}`}
                >
                  <span className="text-xs text-[var(--muted)] w-20 text-left">{ns.network}</span>
                  <div className="flex-1 h-2 bg-[var(--border)] rounded overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${ns.weight * 100}%`, background: NETWORK_COLORS[ns.network] }}></div>
                  </div>
                  <span className="text-xs text-[var(--muted)] w-12 text-right font-mono">{(ns.weight * 100).toFixed(0)}%</span>
                </button>
              ))}
            </div>
            {netFilter && (
              <div className="mt-3 text-xs text-[var(--muted)]">
                Filtered by <span className="chip chip-accent">{netFilter}</span>
                <button onClick={() => setNetFilter(null)} className="ml-2 text-[var(--accent)] hover:underline">clear</button>
              </div>
            )}
          </div>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setFilter("all")} className={`px-3 py-1.5 text-xs rounded transition ${filter === "all" ? "bg-[var(--hover-bg-strong)] text-[var(--heading)]" : "text-[var(--muted)] hover:bg-[var(--hover-bg)]"}`}>All ({DEMO_BIOMARKERS.length})</button>
            <button onClick={() => setFilter("up")} className={`px-3 py-1.5 text-xs rounded transition ${filter === "up" ? "bg-[var(--hover-bg-strong)] text-[var(--heading)]" : "text-[var(--muted)] hover:bg-[var(--hover-bg)]"}`}>ASD&uarr; hyperconnectivity</button>
            <button onClick={() => setFilter("down")} className={`px-3 py-1.5 text-xs rounded transition ${filter === "down" ? "bg-[var(--hover-bg-strong)] text-[var(--heading)]" : "text-[var(--muted)] hover:bg-[var(--hover-bg)]"}`}>ASD&darr; hypoconnectivity</button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="card p-0 lg:col-span-2 overflow-hidden">
              <div className="overflow-y-auto max-h-[540px] scroll-shadow">
                <table className="w-full text-sm">
                  <thead className="text-xs text-[var(--muted)] border-b border-[var(--border)] sticky top-0 bg-[var(--card)]">
                    <tr>
                      <th className="text-left py-3 pl-6">#</th>
                      <th className="text-left py-3">ROI pair</th>
                      <th className="text-right py-3">Importance</th>
                      <th className="text-right py-3">Direction</th>
                      <th className="text-right py-3 pr-6">p(FDR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b, i) => (
                      <tr key={`${b.roi1}-${b.roi2}`} onClick={() => setSelected(b)} className={`border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-[var(--hover-bg)] ${selected?.roi1 === b.roi1 && selected?.roi2 === b.roi2 ? "bg-[var(--hover-bg-strong)]" : ""}`}>
                        <td className="py-3 pl-6 text-[var(--muted)] font-mono text-xs">{i + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[var(--text)]">{b.roi1}</span>
                            <span className="text-[var(--muted)]">↔</span>
                            <span className="font-mono text-xs text-[var(--text)]">{b.roi2}</span>
                          </div>
                          <div className="flex gap-1 mt-1">
                            <span className="chip" style={{ color: NETWORK_COLORS[b.network1], fontSize: "10px" }}>{b.network1}</span>
                            {b.network1 !== b.network2 && (
                              <span className="chip" style={{ color: NETWORK_COLORS[b.network2], fontSize: "10px" }}>{b.network2}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1 bg-[var(--border)] rounded overflow-hidden">
                              <div className="h-full bg-[var(--accent)]" style={{ width: `${b.importance * 100}%` }}></div>
                            </div>
                            <span className="font-mono text-xs text-[var(--text)]">{b.importance.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <span style={{ color: b.direction === "ASD↑" ? "var(--accent2)" : "var(--accent)" }} className="text-xs font-mono">
                            {b.direction}
                          </span>
                        </td>
                        <td className="py-3 pr-6 text-right font-mono text-xs text-[var(--muted)]">{b.p_fdr.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-sm text-[var(--heading)] mb-4">{selected ? "Biomarker detail" : "Select an edge"}</h3>
              {selected && (
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Edge</div>
                    <div className="font-mono text-xs text-[var(--text)] leading-relaxed">
                      {selected.roi1}<br/>
                      <span className="text-[var(--muted)]">↔</span><br/>
                      {selected.roi2}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Networks</div>
                    <div className="flex gap-1 flex-wrap">
                      <span className="chip" style={{ color: NETWORK_COLORS[selected.network1] }}>{selected.network1}</span>
                      {selected.network1 !== selected.network2 && (
                        <span className="chip" style={{ color: NETWORK_COLORS[selected.network2] }}>{selected.network2}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Integrated gradient importance</div>
                    <div className="text-[var(--text)] font-mono">{selected.importance.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Direction</div>
                    <span className="chip" style={{ color: selected.direction === "ASD↑" ? "var(--accent2)" : "var(--accent)" }}>
                      {selected.direction === "ASD↑" ? "Hyper-connectivity in ASD" : "Hypo-connectivity in ASD"}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">FDR-corrected p</div>
                    <div className="font-mono text-[var(--text)]">{selected.p_fdr.toFixed(4)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6 mt-6">
            <h3 className="text-sm text-[var(--heading)] mb-3">Interpretation notes</h3>
            <div className="text-sm text-[var(--muted)] space-y-2 leading-relaxed">
              <p><strong className="text-[var(--text)]">Integrated gradients</strong> measure how much each input feature contributes to Cortex's classification. Applied per-subject and averaged, this yields stable cohort-level importance scores.</p>
              <p><strong className="text-[var(--text)]">Direction (ASD&uarr;/&darr;)</strong> is the sign of the gradient w.r.t. ASD class. ASD&uarr; means stronger connectivity in autism; ASD&darr; means weaker.</p>
              <p><strong className="text-[var(--text)]">These are hypotheses, not facts.</strong> Cortex's biomarkers are candidates for follow-up in targeted imaging studies. They're consistent with published autism connectivity literature (DMN hyperconnectivity, fronto-parietal hypoconnectivity, social-network weakening) — but your specific dataset may differ.</p>
            </div>
          </div>
        </Container>
      </Section>
      <Footer />
    </main>
  );
}
