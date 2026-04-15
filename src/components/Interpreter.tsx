"use client";

import { ReactNode } from "react";

/**
 * Interpretation components that turn Cortex's numerical outputs into
 * plain-language explanations a non-specialist can understand.
 *
 * Each interpreter is results-aware — the text updates based on the actual
 * data, not a fixed template. Works for both demo and real uploads.
 */

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="card mt-6 p-0 overflow-hidden border-l-4" style={{ borderLeftColor: "var(--accent)" }}>
      <div className="px-6 py-4 border-b border-[var(--border)] bg-subtle">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
          <h3 className="text-sm text-[var(--heading)]">What does this mean?</h3>
        </div>
      </div>
      <div className="p-6 space-y-5 text-sm">{children}</div>
    </div>
  );
}

function Block({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">{heading}</h4>
      <div className="text-[var(--text)] leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "warn" | "bad" }) {
  const color = {
    muted: "var(--muted)",
    accent: "var(--accent)",
    warn: "#fbbf24",
    bad: "var(--accent2)",
  }[tone];
  return <span className="chip" style={{ color }}>{children}</span>;
}

/* ─────────── Stratifier interpretation ─────────── */

type StratifyData = {
  totalSubjects: number;
  asdCount: number;
  tdCount: number;
  k: number;
  mode: "label" | "clusters";
  clusters: { n: number; asdPct: number; avgProb: number }[];
};

export function StratifyInterpretation(d: StratifyData) {
  // ─── Too few subjects — the whole point of stratification is cross-subject comparison ───
  if (d.totalSubjects < 2) {
    const label = d.asdCount > 0 ? "autism-like" : "typical-like";
    const pct = d.asdCount > 0 ? "≥50%" : "<50%";
    return (
      <Shell>
        <Block heading="You uploaded a single subject">
          <p>
            The Stratifier is designed to compare <strong>many subjects</strong> to each other — you uploaded{" "}
            <strong>1</strong>. Clustering and 2D maps only make sense when you have multiple brains to compare.
          </p>
          <p>
            Cortex did still run on your one brain: its classifier says P(ASD) {pct} — labeling it{" "}
            <Pill tone="accent">{label}</Pill>. For a single subject, the <strong>Biomarker Explorer</strong> is more
            useful: it tells you which ROI-pairs Cortex paid attention to when making that call.
          </p>
        </Block>
        <Block heading="What to do next">
          <p>
            Use the <strong>&quot;Download sample CSV&quot;</strong> link in the upload panel above — that&apos;s a 30-subject
            file from an independent public dataset. Or upload your own cohort (≥10 subjects recommended). Each row
            should be one subject.
          </p>
        </Block>
      </Shell>
    );
  }

  if (d.totalSubjects < 10) {
    return (
      <Shell>
        <Block heading="Small cohort — results are unreliable">
          <p>
            You uploaded <strong>{d.totalSubjects}</strong> subjects. Cortex ran on all of them, but{" "}
            <strong>cluster structure isn&apos;t meaningful below ~10 subjects</strong>. With a handful of points, any
            clustering reflects noise more than real neural patterns.
          </p>
          <p>
            Classifier summary: <Pill tone="accent">{d.asdCount} autism-like</Pill>{" "}
            <Pill>{d.tdCount} typical-like</Pill>. Treat this as a preview, not a result.
          </p>
        </Block>
        <Block heading="What to do next">
          <p>
            Upload a larger cohort. The <strong>Flagger</strong> tool works for small-n (even single subjects) since
            it just scores each scan individually. The <strong>Biomarker Explorer</strong> also works with few
            subjects — it averages gradients across whatever you upload.
          </p>
        </Block>
      </Shell>
    );
  }

  // ─── Normal cohort (≥10) ───
  const asdPct = (d.asdCount / d.totalSubjects) * 100;
  const separable = d.clusters.some((c) => c.n >= 3 && (c.asdPct > 75 || c.asdPct < 25));

  return (
    <Shell>
      <Block heading="In plain English">
        <p>
          You uploaded <strong>{d.totalSubjects}</strong> brains. Cortex looked at each one&apos;s connectivity pattern —
          how strongly different brain regions talk to each other — and assigned every brain a position in a map where
          brains with similar patterns sit close together.
        </p>
        <p>
          Of those {d.totalSubjects}, Cortex&apos;s classifier labels <Pill tone="accent">{d.asdCount} as autism-like</Pill> and{" "}
          <Pill>{d.tdCount} as typical-like</Pill> ({asdPct.toFixed(0)}% / {(100 - asdPct).toFixed(0)}%).
        </p>
      </Block>

      {d.mode === "clusters" && (
        <Block heading={`Your ${d.k}-cluster breakdown`}>
          {d.clusters.map((c, i) => (
            <p key={i}>
              <strong>Cluster {i}</strong> has <strong>{c.n}</strong> subjects
              {c.n > 0 && <> — <strong>{c.asdPct.toFixed(0)}%</strong> are autism-classified</>}.{" "}
              {c.n === 0 ? "(empty)" :
                c.n < 3 ? "Too few members to interpret — merge or try smaller k."
                : c.asdPct > 75 ? "Highly autism-enriched subgroup — likely represents a consistent neural subtype."
                : c.asdPct > 55 ? "Moderately autism-leaning — mixed group worth examining further."
                : c.asdPct < 25 ? "Predominantly typical — probably a control-like subgroup."
                : "Mixed — contains both autism and typical brains, suggesting this cluster captures something other than autism (age, sex, site)."}
            </p>
          ))}
        </Block>
      )}

      <Block heading="What to look for">
        {separable ? (
          <p>
            Your cohort contains at least one cluster with strong autism/control separation.
            That&apos;s a <strong>useful signal</strong>: Cortex found a neural pattern that correlates with diagnosis.
            Next step: examine what else those cluster members share (age, sex, symptom severity) to characterize the subtype.
          </p>
        ) : (
          <p>
            Your clusters look <strong>mixed</strong> — each contains a similar proportion of autism and typical brains.
            That&apos;s common when your cohort is heterogeneous across age, sex, or scanning site, which can dominate
            over autism-specific signals. Consider stratifying by those factors first, or try more clusters (higher k).
          </p>
        )}
      </Block>

      <Block heading="Important caveats">
        <p>
          Cortex&apos;s validation accuracy is <strong>58%</strong> — above chance (50%) but well below clinical diagnostic
          standards. Treat these groupings as <em>hypothesis-generating</em>, not confirmatory. The 256-dimensional
          embedding carries much richer information than the binary autism/typical label, but the 2D projection you see
          discards most of it. This is a research tool for exploratory analysis.
        </p>
      </Block>
    </Shell>
  );
}

/* ─────────── Flagger interpretation ─────────── */

type FlagData = {
  total: number;
  clean: number;
  borderline: number;
  outlier: number;
  isReal: boolean;
};

export function FlagInterpretation(d: FlagData) {
  const outlierPct = (d.outlier / d.total) * 100;
  const borderlinePct = (d.borderline / d.total) * 100;
  const flaggedPct = outlierPct + borderlinePct;

  // Single subject — outlier detection needs a cohort reference
  if (d.total < 2) {
    return (
      <Shell>
        <Block heading="You uploaded a single subject">
          <p>
            The Flagger needs a <strong>cohort</strong> to work — it flags scans that look unusual{" "}
            <em>relative to other scans in your upload</em>. With one subject, there&apos;s nothing to compare against,
            so the z-score is trivially 0 and the flag is always &quot;clean&quot;.
          </p>
          <p>
            Cortex did compute a reconstruction MSE for your one brain, which tells you how well it matches the
            training distribution (1,545 ABIDE subjects). High MSE means &quot;unusual for Cortex&quot;; low MSE means
            &quot;looks like something I&apos;ve seen before&quot;. But without a cohort, you can&apos;t rank or flag.
          </p>
        </Block>
        <Block heading="What to do next">
          <p>
            Use the <strong>&quot;Download sample CSV&quot;</strong> link (30-subject file) to see how the Flagger
            actually works, or upload your own cohort (≥10 subjects recommended).
          </p>
        </Block>
      </Shell>
    );
  }

  if (d.total < 5) {
    return (
      <Shell>
        <Block heading="Small cohort — flag statistics are unstable">
          <p>
            You uploaded <strong>{d.total}</strong> scans. Flag categories (clean/borderline/outlier) are based on
            z-scores relative to your uploaded cohort — with &lt;5 subjects, the mean and standard deviation are
            unreliable, so flags can swing wildly with one more subject added or removed.
          </p>
          <p>
            Counts: <Pill tone="accent">{d.clean} clean</Pill>{" "}
            <Pill tone="warn">{d.borderline} borderline</Pill>{" "}
            <Pill tone="bad">{d.outlier} outlier</Pill>. Treat as directional only.
          </p>
        </Block>
        <Block heading="What to do next">
          <p>
            Add more scans — the Flagger becomes reliable above ~20 subjects. For single-subject assessment,{" "}
            just inspect the raw reconstruction MSE value instead of the flag category.
          </p>
        </Block>
      </Shell>
    );
  }

  return (
    <Shell>
      <Block heading="In plain English">
        <p>
          Cortex has seen 1,545 brain scans during training. For each of your <strong>{d.total}</strong> uploaded scans,
          it tried to recreate the scan from its learned understanding. If a scan matches what Cortex expects, it
          reconstructs accurately. If the scan is unusual, Cortex struggles — and that reconstruction error is your
          outlier signal.
        </p>
        <p>
          Think of it like a music teacher who has heard thousands of students play a piece. When a new student plays,
          the teacher can tell how &quot;typical&quot; the performance is. A wildly unusual performance doesn&apos;t mean bad —
          it might be brilliant, or it might be a technical mistake. But it warrants a closer listen.
        </p>
      </Block>

      <Block heading="Your cohort at a glance">
        <p>
          <Pill tone="accent">{d.clean} clean</Pill>{" "}
          <Pill tone="warn">{d.borderline} borderline</Pill>{" "}
          <Pill tone="bad">{d.outlier} outlier</Pill>{" "}
          — that&apos;s <strong>{flaggedPct.toFixed(0)}%</strong> flagged for review.
        </p>
        {outlierPct > 20 ? (
          <p>
            <strong>{outlierPct.toFixed(0)}% outliers is high.</strong> This usually indicates a systemic issue — check
            your preprocessing pipeline, motion correction settings, or confirm you used the same Schaefer-100 atlas
            (not 200 or 400). A well-preprocessed typical cohort usually has &lt;5% outliers.
          </p>
        ) : outlierPct > 10 ? (
          <p>
            <strong>{outlierPct.toFixed(0)}% outliers is moderate.</strong> Worth reviewing — flagged scans likely have
            motion artifacts, registration issues, or novel phenotypes. Spot-check 2-3 outliers first before assuming
            a pipeline bug.
          </p>
        ) : outlierPct > 0 ? (
          <p>
            <strong>{outlierPct.toFixed(0)}% outliers is normal.</strong> Review these flagged scans manually. Most will
            have minor issues (mild motion, short duration). A few may be genuine rare phenotypes worth investigating.
          </p>
        ) : (
          <p>
            <strong>No outliers.</strong> Your cohort looks clean relative to Cortex&apos;s training distribution. This is
            the typical result for well-preprocessed ABIDE-like data.
          </p>
        )}
      </Block>

      <Block heading="What to do with flagged scans">
        <p>
          For each outlier, check in order: <strong>(1)</strong> head motion logs — framewise displacement &gt; 0.3 mm
          is a red flag. <strong>(2)</strong> preprocessing — did registration complete? are there masking errors?
          <strong> (3)</strong> scan duration — too short (&lt;5 min) produces unreliable connectivity.
          <strong> (4)</strong> phenotype — if technical checks pass, the subject may have a genuinely unusual neural
          pattern worth separate analysis.
        </p>
      </Block>

      <Block heading="Important caveats">
        <p>
          Atypical does not equal &quot;bad&quot; — Cortex&apos;s training data was ABIDE (mixed autism/typical). A scan
          from a completely different population (e.g., stroke patients, children under 6) will look atypical because
          Cortex has never seen that phenotype. <strong>Outlier flags are not quality judgments</strong>; they flag
          differences from training distribution.
        </p>
      </Block>
    </Shell>
  );
}

/* ─────────── Biomarker interpretation ─────────── */

const NETWORK_DESCRIPTIONS: Record<string, string> = {
  DMN: "Default Mode Network — active when you're at rest, self-reflecting, or mind-wandering. Central to self-referential thinking.",
  SomMot: "Somatomotor Network — handles movement planning and body sensation.",
  Vis: "Visual Network — processes what you see.",
  Limbic: "Limbic Network — emotion regulation, memory, and motivation.",
  Control: "Frontoparietal Control Network — executive function, attention control, working memory.",
  DAN: "Dorsal Attention Network — directs attention to external targets (tasks, objects).",
  VAN: "Ventral Attention Network — social attention, orienting to salient events, theory-of-mind.",
};

type BiomarkerData = {
  total: number;
  upCount: number;
  downCount: number;
  topNetwork: string;
  topEdge: { roi1Name: string; roi2Name: string; network1: string; network2: string; direction: "ASD↑" | "ASD↓"; importance: number } | null;
  isReal: boolean;
};

export function BiomarkerInterpretation(d: BiomarkerData) {
  const topNetDesc = NETWORK_DESCRIPTIONS[d.topNetwork] || "";

  return (
    <Shell>
      <Block heading="In plain English">
        <p>
          Cortex learned to tell autism-like and typical-like connectivity apart. To understand <em>what</em> it learned,
          we ask Cortex: &quot;For each connection between brain regions, how much did this connection matter in your
          decision?&quot; The answer is an importance score per ROI-pair. Higher score = Cortex paid more attention to
          that connection.
        </p>
        <p>
          Of the <strong>{d.total}</strong> top ROI-pairs, <Pill tone="bad">{d.upCount}</Pill> show{" "}
          <strong>stronger connectivity in autism</strong> (hyperconnectivity) and{" "}
          <Pill tone="accent">{d.downCount}</Pill> show <strong>weaker connectivity</strong> (hypoconnectivity).
        </p>
      </Block>

      <Block heading={`Top network: ${d.topNetwork}`}>
        <p>
          <strong>{d.topNetwork}</strong> contributes the most importance across all top ROI-pairs.
          {topNetDesc && <> {topNetDesc}</>}
        </p>
        <p>
          This is consistent with a large body of autism neuroimaging literature, which has repeatedly identified
          atypical connectivity in DMN, social-attention networks (VAN), and frontoparietal control systems.
        </p>
      </Block>

      {d.topEdge && (
        <Block heading="Your top biomarker edge">
          <p>
            <code className="text-xs">{d.topEdge.roi1Name}</code> ↔ <code className="text-xs">{d.topEdge.roi2Name}</code>{" "}
            is Cortex&apos;s most important single connection (importance ={" "}
            <strong>{d.topEdge.importance.toFixed(2)}</strong>).
          </p>
          <p>
            It involves the <strong>{d.topEdge.network1}</strong>
            {d.topEdge.network1 !== d.topEdge.network2 && <> and <strong>{d.topEdge.network2}</strong></> } network
            {d.topEdge.network1 !== d.topEdge.network2 ? "s" : ""}.{" "}
            {d.topEdge.direction === "ASD↑"
              ? "Cortex expects this connection to be stronger in autistic brains than typical — a finding consistent with reported DMN hyperconnectivity patterns."
              : "Cortex expects this connection to be weaker in autistic brains than typical — consistent with underconnectivity findings in cross-regional integration."}
          </p>
        </Block>
      )}

      <Block heading="What to do with these results">
        <p>
          Treat these as <strong>targets for follow-up</strong>, not discoveries. Good next steps:
        </p>
        <p>
          <strong>(1) Cross-check literature</strong> — do the top edges match published autism connectivity findings?
          If yes, you&apos;ve corroborated your dataset and Cortex&apos;s learning. <strong>(2) Targeted testing</strong> — design a
          focused imaging study on the top 3-5 edges with a larger, stratified cohort. <strong>(3) Mechanism</strong> —
          what could cause this specific edge to differ? Tract-tracing, neurotransmitter mapping, genetics can answer
          that downstream.
        </p>
      </Block>

      <Block heading="Important caveats">
        <p>
          Gradient-based importance tells you what Cortex <em>used</em> to classify, not necessarily what causes autism.
          A feature can be highly predictive because it&apos;s an artifact (motion, age, sex confound) rather than a
          biological signal. Always check your results against known confounds, and prefer edges that appear robustly
          across multiple cohorts.
        </p>
      </Block>
    </Shell>
  );
}
