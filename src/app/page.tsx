"use client";

import { Nav, Footer, Section, Container } from "@/components/Shell";
import { useEffect, useRef } from "react";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.querySelectorAll(".reveal").forEach((c) => c.classList.add("visible"));
    }, { threshold: 0.1 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Divider />
      <Position />
      <Divider />
      <Tools />
      <Divider />
      <Architecture />
      <Divider />
      <Disclosure />
      <Divider />
      <CTA />
      <Footer />
    </main>
  );
}

function Divider() { return <div className="h-px bg-[var(--border)] max-w-[1024px] mx-auto" />; }

function Hero() {
  const ref = useReveal();
  return (
    <div ref={ref} className="pt-32 pb-24 px-6 relative">
      <div className="max-w-[1024px] mx-auto relative">
        <div className="reveal">
          <div className="chip chip-accent mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
            Cortex v1 — Research preview
          </div>
          <h1 className="text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
            Brain pattern<br/>
            <span className="gradient-text">recognition</span> for<br/>
            neuroscience research.
          </h1>
          <p className="text-xl text-[var(--muted)] max-w-2xl mb-10 leading-relaxed">
            Cortex reads resting-state brain connectivity and identifies patterns associated with autism. 227M-parameter transformer trained on 1,545 subjects. Three research tools. No clinical claims.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/stratify" className="cta-primary">Try Stratifier →</a>
            <a href="#tools" className="px-6 py-3 border border-[var(--border-strong)] rounded-lg hover:bg-[var(--hover-bg)] transition">
              See all tools
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Position() {
  const ref = useReveal();
  return (
    <section ref={ref} className="py-20 px-6">
      <Container>
        <div className="reveal grid md:grid-cols-2 gap-8">
          <div className="card p-8">
            <div className="chip mb-4">AQAL</div>
            <h3 className="text-2xl mb-3">Stimulus → Brain</h3>
            <p className="text-[var(--muted)] mb-4 leading-relaxed">
              Takes video, audio, or text. Predicts how a neurodiverse brain would respond. Used for designing spaces, therapy tailoring, sensory audits.
            </p>
            <a href="https://mind.new" className="text-sm text-[var(--accent)] hover:underline">mind.new →</a>
          </div>
          <div className="card p-8" style={{ borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)" }}>
            <div className="chip chip-accent mb-4">Cortex</div>
            <h3 className="text-2xl mb-3">Brain → Classification</h3>
            <p className="text-[var(--muted)] mb-4 leading-relaxed">
              Takes resting-state connectivity. Identifies autism-associated patterns. Used for research: cohort stratification, QC, biomarker discovery.
            </p>
            <a href="#tools" className="text-sm text-[var(--accent)] hover:underline">See tools →</a>
          </div>
        </div>
        <div className="reveal mt-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            Forward + inverse — <span className="text-[var(--text)]">AQAL predicts experience from stimulus, Cortex characterizes neural patterns from scans</span>. Complementary pieces of the same pipeline.
          </p>
        </div>
      </Container>
    </section>
  );
}

function Tools() {
  const ref = useReveal();
  const tools = [
    {
      slug: "/stratify",
      num: "01",
      title: "Cohort Stratifier",
      tagline: "Discover autism subtypes",
      body: "Embed each subject in a 256-dim latent space. Cluster across the cohort to find neural subgroups. Autism is a spectrum — Cortex quantifies where each subject sits on it.",
      useCase: "Research cohort stratification",
    },
    {
      slug: "/flag",
      num: "02",
      title: "Atypicality Flagger",
      tagline: "QC your neuroimaging data",
      body: "Reconstruction-error scoring flags subjects whose connectivity is atypical. Use for quality control on large datasets, outlier detection, and preprocessing validation.",
      useCase: "Atypicality / QC flagging",
    },
    {
      slug: "/biomarkers",
      num: "03",
      title: "Biomarker Explorer",
      tagline: "Find ROI-pair importance",
      body: "Integrated-gradient analysis on Cortex reveals which ROI-pair connections drive classification. Consolidates scattered autism connectivity literature into testable hypotheses.",
      useCase: "Biomarker discovery",
    },
  ];
  return (
    <section id="tools" ref={ref} className="py-20 px-6">
      <Container>
        <div className="reveal mb-12">
          <div className="chip mb-4">Research tools</div>
          <h2 className="text-4xl md:text-5xl tracking-tight mb-4">Three apps, one model.</h2>
          <p className="text-lg text-[var(--muted)] max-w-2xl">
            Each tool targets a specific research workflow. All powered by the same Cortex v1 backbone.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((t) => (
            <a key={t.slug} href={t.slug} className="reveal card p-8 hover:border-[var(--accent)] transition group">
              <div className="flex items-start justify-between mb-6">
                <span className="text-sm text-[var(--muted)] font-mono">{t.num}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[var(--muted)] group-hover:text-[var(--accent)] transition">
                  <path d="M7 17L17 7M17 7H7m10 0v10" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-xl mb-1">{t.title}</h3>
              <div className="text-sm text-[var(--accent)] mb-4">{t.tagline}</div>
              <p className="text-sm text-[var(--muted)] leading-relaxed mb-6">{t.body}</p>
              <div className="chip">{t.useCase}</div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Architecture() {
  const ref = useReveal();
  return (
    <section ref={ref} className="py-20 px-6">
      <Container>
        <div className="reveal grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="chip mb-4">Architecture</div>
            <h2 className="text-4xl tracking-tight mb-6">227M parameters.<br/>Three joint heads.</h2>
            <p className="text-[var(--muted)] mb-6 leading-relaxed">
              Cortex ingests 4,950-dim Fisher-z connectivity features (100-ROI Schaefer atlas, upper triangle). Transformer encoder projects input into 32 × 1024 tokens, pools to a 256-dim subject embedding, and branches into three heads.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-[var(--accent)] font-mono">→</span>
                <span><span className="text-[var(--text)]">Classifier</span> — ASD probability (BCE loss)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[var(--accent)] font-mono">→</span>
                <span><span className="text-[var(--text)]">Subject encoder</span> — 256-dim embedding (stratification)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-[var(--accent)] font-mono">→</span>
                <span><span className="text-[var(--text)]">Reconstructor</span> — 4,950-dim connectivity (QC signal)</span>
              </div>
            </div>
          </div>
          <div className="card p-6 font-mono text-xs text-[var(--muted)]">
            <pre className="whitespace-pre-wrap">{`Cortex v1 architecture

Input: (B, 4950)                # Fisher-z connectivity
  ↓ Linear + GELU
  ↓ Projection
Tokens: (B, 32, 1024)           # 32 × d_model=1024
  ↓ 16 × TransformerEncoderLayer
  ↓ (dropout=0.4, pre-norm, 16 heads)
Pooled: (B, 1024)
  ↓ SubjectEncoder (LayerNorm)
Latent: (B, 256)
  ↓ branches
  ├─ Classifier → (B, 1)
  └─ Reconstructor → (B, 4950)

Trainable: 227.7M parameters
Trained: 1,545 ABIDE subjects
  693 ASD + 852 TD, 36 sites, harmonized`}</pre>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Disclosure() {
  const ref = useReveal();
  return (
    <section ref={ref} className="py-20 px-6">
      <Container>
        <div className="reveal card p-8 border-l-4" style={{ borderLeftColor: "var(--accent2)" }}>
          <h3 className="text-xl mb-4 text-[var(--heading)]">Honest disclosure</h3>
          <div className="space-y-3 text-sm text-[var(--muted)] leading-relaxed">
            <p><strong className="text-[var(--text)]">Not for clinical diagnosis.</strong> Cortex achieves ~63% validation accuracy on held-out ABIDE subjects. That's useful for research, not diagnosis. ADOS-2 / ADI-R remain the clinical standard.</p>
            <p><strong className="text-[var(--text)]">Training cohort is ABIDE I + II.</strong> Predominantly male (~91%), mostly North American/European sites, ages 5–64. Generalization to underrepresented populations not validated.</p>
            <p><strong className="text-[var(--text)]">Site effects are harmonized, not eliminated.</strong> Residual site bias may exist. Use caution when applying to new acquisition protocols.</p>
            <p><strong className="text-[var(--text)]">ASD vs TD is a binary simplification.</strong> Real neurodiversity is spectral. Cortex embeddings (256-dim) better reflect that than the classifier logit.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CTA() {
  const ref = useReveal();
  return (
    <section ref={ref} className="py-24 px-6">
      <Container>
        <div className="reveal text-center">
          <h2 className="text-4xl md:text-5xl tracking-tight mb-4">Start with your data.</h2>
          <p className="text-lg text-[var(--muted)] mb-8 max-w-xl mx-auto">
            Upload connectivity features. Explore subtypes. Flag outliers. Discover biomarkers. No signup.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/stratify" className="cta-primary">Open Stratifier</a>
            <a href="/flag" className="px-6 py-3 border border-[var(--border-strong)] rounded-lg hover:bg-[var(--hover-bg)] transition">Open Flagger</a>
            <a href="/biomarkers" className="px-6 py-3 border border-[var(--border-strong)] rounded-lg hover:bg-[var(--hover-bg)] transition">Open Explorer</a>
          </div>
        </div>
      </Container>
    </section>
  );
}
