"use client";

import { Nav, Footer, Section, Container } from "@/components/Shell";
import { UploadPanel } from "@/components/UploadPanel";
import { BiomarkerInterpretation } from "@/components/Interpreter";
import { useState, useMemo } from "react";
import { biomarkers, type Biomarker } from "@/lib/api";

type ROIPair = {
  roi1Name: string; roi2Name: string;
  roi1Idx: number; roi2Idx: number;
  network1: string; network2: string;
  importance: number;
  direction: "ASD↑" | "ASD↓";
  featureIdx?: number;
};

// Schaefer 100-parcel network assignment (simplified 7-network partition).
// Parcel index 0-99 → network name. Based on standard Schaefer 2018 7Networks_100Parcels ordering.
const SCHAEFER_NETWORKS: string[] = [
  // Left hemisphere (0-49)
  ...Array(7).fill("Vis"),
  ...Array(6).fill("SomMot"),
  ...Array(7).fill("DAN"),
  ...Array(5).fill("VAN"),
  ...Array(3).fill("Limbic"),
  ...Array(10).fill("Control"),
  ...Array(12).fill("DMN"),
  // Right hemisphere (50-99)
  ...Array(7).fill("Vis"),
  ...Array(6).fill("SomMot"),
  ...Array(7).fill("DAN"),
  ...Array(5).fill("VAN"),
  ...Array(3).fill("Limbic"),
  ...Array(10).fill("Control"),
  ...Array(12).fill("DMN"),
];
const NETWORKS = ["DMN", "SomMot", "Vis", "Limbic", "Control", "DAN", "VAN"];
const NETWORK_COLORS: Record<string, string> = {
  DMN: "#a78bfa", SomMot: "#38bdf8", Vis: "#fb923c",
  Limbic: "#f472b6", Control: "#00d9a3", DAN: "#fbbf24", VAN: "#60a5fa",
};

function hemi(i: number): "L" | "R" {
  return i < 50 ? "L" : "R";
}

function roiName(idx: number): string {
  const net = SCHAEFER_NETWORKS[idx] || "Unk";
  return `${hemi(idx)}_${net}_${idx}`;
}

const DEMO_BIOMARKERS: ROIPair[] = [
  { roi1Idx: 45, roi2Idx: 95, roi1Name: "L_DMN_45", roi2Name: "R_DMN_95", network1: "DMN", network2: "DMN", importance: 0.92, direction: "ASD↑" },
  { roi1Idx: 28, roi2Idx: 78, roi1Name: "L_Limbic_28", roi2Name: "R_Limbic_78", network1: "Limbic", network2: "Limbic", importance: 0.87, direction: "ASD↓" },
  { roi1Idx: 42, roi2Idx: 92, roi1Name: "L_DMN_42", roi2Name: "R_DMN_92", network1: "DMN", network2: "DMN", importance: 0.84, direction: "ASD↑" },
  { roi1Idx: 48, roi2Idx: 5, roi1Name: "L_DMN_48", roi2Name: "L_Vis_5", network1: "DMN", network2: "Vis", importance: 0.78, direction: "ASD↓" },
  { roi1Idx: 28, roi2Idx: 20, roi1Name: "L_Limbic_28", roi2Name: "L_DAN_20", network1: "Limbic", network2: "DAN", importance: 0.76, direction: "ASD↑" },
  { roi1Idx: 25, roi2Idx: 75, roi1Name: "L_VAN_25", roi2Name: "R_VAN_75", network1: "VAN", network2: "VAN", importance: 0.73, direction: "ASD↓" },
  { roi1Idx: 0, roi2Idx: 3, roi1Name: "L_Vis_0", roi2Name: "L_Vis_3", network1: "Vis", network2: "Vis", importance: 0.69, direction: "ASD↑" },
  { roi1Idx: 10, roi2Idx: 60, roi1Name: "L_SomMot_10", roi2Name: "R_SomMot_60", network1: "SomMot", network2: "SomMot", importance: 0.66, direction: "ASD↓" },
  { roi1Idx: 30, roi2Idx: 80, roi1Name: "L_Control_30", roi2Name: "R_Control_80", network1: "Control", network2: "Control", importance: 0.63, direction: "ASD↓" },
  { roi1Idx: 28, roi2Idx: 78, roi1Name: "L_Limbic_28", roi2Name: "R_Limbic_78", network1: "Limbic", network2: "Limbic", importance: 0.60, direction: "ASD↑" },
  { roi1Idx: 42, roi2Idx: 28, roi1Name: "L_DMN_42", roi2Name: "L_Limbic_28", network1: "DMN", network2: "Limbic", importance: 0.58, direction: "ASD↓" },
  { roi1Idx: 8, roi2Idx: 12, roi1Name: "L_SomMot_8", roi2Name: "L_SomMot_12", network1: "SomMot", network2: "SomMot", importance: 0.54, direction: "ASD↑" },
  { roi1Idx: 72, roi2Idx: 55, roi1Name: "R_VAN_72", roi2Name: "R_Vis_55", network1: "VAN", network2: "Vis", importance: 0.51, direction: "ASD↓" },
  { roi1Idx: 20, roi2Idx: 70, roi1Name: "L_DAN_20", roi2Name: "R_DAN_70", network1: "DAN", network2: "DAN", importance: 0.48, direction: "ASD↓" },
  { roi1Idx: 28, roi2Idx: 45, roi1Name: "L_Limbic_28", roi2Name: "L_DMN_45", network1: "Limbic", network2: "DMN", importance: 0.45, direction: "ASD↑" },
];

export default function BiomarkersPage() {
  const [pairs, setPairs] = useState<ROIPair[]>(DEMO_BIOMARKERS);
  const [isReal, setIsReal] = useState(false);
  const [selected, setSelected] = useState<ROIPair | null>(DEMO_BIOMARKERS[0]);
  const [filter, setFilter] = useState<"all" | "up" | "down">("all");
  const [netFilter, setNetFilter] = useState<string | null>(null);
  const [subjectCount, setSubjectCount] = useState<number | undefined>(undefined);

  const handleUpload = async (file: File) => {
    const res = await biomarkers(file, 25);
    const real: ROIPair[] = res.biomarkers.map((b: Biomarker) => {
      const net1 = SCHAEFER_NETWORKS[b.roi1] || "Unk";
      const net2 = SCHAEFER_NETWORKS[b.roi2] || "Unk";
      return {
        roi1Idx: b.roi1, roi2Idx: b.roi2,
        roi1Name: roiName(b.roi1), roi2Name: roiName(b.roi2),
        network1: net1, network2: net2,
        importance: b.importance, direction: b.direction,
        featureIdx: b.feature_idx,
      };
    });
    // Normalize importance to [0, 1] for display
    const maxImp = Math.max(...real.map((r) => r.importance)) || 1;
    real.forEach((r) => { r.importance = r.importance / maxImp; });
    setPairs(real);
    setSubjectCount(res.n_subjects);
    setIsReal(true);
    setSelected(real[0] || null);
  };
  const resetToDemo = () => {
    setPairs(DEMO_BIOMARKERS);
    setIsReal(false);
    setSelected(DEMO_BIOMARKERS[0]);
    setSubjectCount(undefined);
  };

  const filtered = useMemo(() => {
    let arr = pairs;
    if (filter === "up") arr = arr.filter((b) => b.direction === "ASD↑");
    if (filter === "down") arr = arr.filter((b) => b.direction === "ASD↓");
    if (netFilter) arr = arr.filter((b) => b.network1 === netFilter || b.network2 === netFilter);
    return arr;
  }, [filter, netFilter, pairs]);

  const networkSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    NETWORKS.forEach((n) => { counts[n] = 0; });
    pairs.forEach((b) => {
      counts[b.network1] = (counts[b.network1] || 0) + b.importance;
      counts[b.network2] = (counts[b.network2] || 0) + b.importance;
    });
    const max = Math.max(...Object.values(counts)) || 1;
    return NETWORKS.map((n) => ({ network: n, weight: counts[n] / max }));
  }, [pairs]);

  return (
    <main>
      <Nav />
      <Section className="pt-28">
        <Container>
          <div className="mb-8">
            <div className="chip chip-accent mb-4">Tool 03 — Biomarker Explorer</div>
            <h1 className="text-4xl md:text-5xl tracking-tight mb-3">ROI-pair importance for autism classification.</h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl">
              Gradient-based analysis on Cortex reveals which connectivity edges drive ASD predictions. Each ROI-pair ranked by mean gradient magnitude across your cohort, with directionality (ASD&uarr; = stronger in autism, ASD&darr; = weaker).
            </p>
          </div>

          <UploadPanel
            onUpload={handleUpload}
            onReset={resetToDemo}
            hasData={isReal}
            subjectCount={subjectCount}
            helpText="CSV, Excel, or .npz with per-subject connectivity rows (4,950 cols). Cortex computes the gradient of its ASD-logit w.r.t. each connectivity feature, averaged across your cohort. Top-25 edges returned, mapped to Schaefer 7-network labels."
          />

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

          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => setFilter("all")} className={`px-3 py-1.5 text-xs rounded transition ${filter === "all" ? "bg-[var(--hover-bg-strong)] text-[var(--heading)]" : "text-[var(--muted)] hover:bg-[var(--hover-bg)]"}`}>All ({pairs.length})</button>
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
                      <th className="text-right py-3 pr-6">Direction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b, i) => (
                      <tr key={`${b.roi1Idx}-${b.roi2Idx}-${i}`} onClick={() => setSelected(b)} className={`border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-[var(--hover-bg)] ${selected?.roi1Idx === b.roi1Idx && selected?.roi2Idx === b.roi2Idx ? "bg-[var(--hover-bg-strong)]" : ""}`}>
                        <td className="py-3 pl-6 text-[var(--muted)] font-mono text-xs">{i + 1}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-[var(--text)]">{b.roi1Name}</span>
                            <span className="text-[var(--muted)]">↔</span>
                            <span className="font-mono text-xs text-[var(--text)]">{b.roi2Name}</span>
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
                        <td className="py-3 pr-6 text-right">
                          <span style={{ color: b.direction === "ASD↑" ? "var(--accent2)" : "var(--accent)" }} className="text-xs font-mono">
                            {b.direction}
                          </span>
                        </td>
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
                      {selected.roi1Name}<br/>
                      <span className="text-[var(--muted)]">↔</span><br/>
                      {selected.roi2Name}
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
                    <div className="text-xs text-[var(--muted)] mb-1">Gradient importance (normalized)</div>
                    <div className="text-[var(--text)] font-mono">{selected.importance.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--muted)] mb-1">Direction</div>
                    <span className="chip" style={{ color: selected.direction === "ASD↑" ? "var(--accent2)" : "var(--accent)" }}>
                      {selected.direction === "ASD↑" ? "Hyper-connectivity in ASD" : "Hypo-connectivity in ASD"}
                    </span>
                  </div>
                  {selected.featureIdx !== undefined && (
                    <div>
                      <div className="text-xs text-[var(--muted)] mb-1">Feature index</div>
                      <div className="font-mono text-[var(--muted)] text-xs">{selected.featureIdx} / 4950</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <BiomarkerInterpretation
            total={pairs.length}
            upCount={pairs.filter((p) => p.direction === "ASD↑").length}
            downCount={pairs.filter((p) => p.direction === "ASD↓").length}
            topNetwork={networkSummary.slice().sort((a, b) => b.weight - a.weight)[0]?.network ?? "DMN"}
            topEdge={pairs[0] ? {
              roi1Name: pairs[0].roi1Name, roi2Name: pairs[0].roi2Name,
              network1: pairs[0].network1, network2: pairs[0].network2,
              direction: pairs[0].direction, importance: pairs[0].importance,
            } : null}
            isReal={isReal}
          />

          <div className="card p-6 mt-6">
            <h3 className="text-sm text-[var(--heading)] mb-3">Interpretation notes</h3>
            <div className="text-sm text-[var(--muted)] space-y-2 leading-relaxed">
              <p><strong className="text-[var(--text)]">Gradient-based importance</strong>: measures how much each input feature contributes to Cortex's classification. Averaged across your uploaded cohort, this yields stable ROI-pair rankings.</p>
              <p><strong className="text-[var(--text)]">Direction (ASD&uarr;/&darr;)</strong> is the sign of the mean gradient w.r.t. the ASD class. ASD&uarr; means Cortex expects stronger connectivity in autism; ASD&darr; means weaker.</p>
              <p><strong className="text-[var(--text)]">These are hypotheses, not facts.</strong> Cortex's biomarkers are candidates for follow-up in targeted imaging studies. Results consistent with published literature on DMN hyperconnectivity, fronto-parietal hypoconnectivity, and social-network weakening in ASD validate the approach, but your specific cohort may differ.</p>
              <p><strong className="text-[var(--text)]">ROI naming</strong> uses Schaefer 100-parcel 7-network ordering. First 50 indices = left hemisphere, next 50 = right. Networks: Vis, SomMot, DAN, VAN, Limbic, Control, DMN.</p>
            </div>
          </div>
        </Container>
      </Section>
      <Footer />
    </main>
  );
}
