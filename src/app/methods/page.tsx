import { Nav, Footer, Section, Container } from "@/components/Shell";

export const metadata = { title: "Methods — Cortex" };

export default function MethodsPage() {
  return (
    <main>
      <Nav />
      <Section className="pt-28">
        <Container>
          <div className="mb-12">
            <div className="chip chip-accent mb-4">Methods</div>
            <h1 className="text-4xl md:text-5xl tracking-tight mb-4">How Cortex works.</h1>
            <p className="text-lg text-[var(--muted)] max-w-2xl">
              A condensed overview of training data, architecture, evaluation, and appropriate use. Read before applying to your own cohort.
            </p>
          </div>

          <div className="space-y-10">
            <Block title="1. Training data">
              <p>
                Combined ABIDE I + ABIDE II cohort. <strong className="text-[var(--text)]">1,545 subjects</strong> (693 autistic, 852 typically developing) from 36 clinical research sites spanning North America, Europe, and Asia. Ages 5.6–64 years. Sex distribution: ~91% male (known ABIDE limitation; generalization to female cohorts requires caution).
              </p>
              <p>
                fMRI preprocessing: standard CPAC pipeline (bandpass 0.01–0.1 Hz, detrending, z-scoring, global signal regression disabled). Connectivity extracted via Schaefer 100-parcel atlas. 4,950-dim upper triangle of ROI-to-ROI Fisher-z transformed correlation matrix.
              </p>
              <p>
                Site harmonization via residualization against site dummy variables. Retains within-site age/sex variance, removes between-site offsets.
              </p>
            </Block>

            <Block title="2. Architecture">
              <p>
                <strong className="text-[var(--text)]">Cortex is a 227M-parameter transformer encoder</strong> with three joint heads for multi-task learning:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li><span className="text-[var(--text)]">Classifier head:</span> 256 → 128 → 1, binary cross-entropy vs. ASD label</li>
                <li><span className="text-[var(--text)]">Subject encoder:</span> 1024 → 512 → 256, produces interpretable embeddings for clustering</li>
                <li><span className="text-[var(--text)]">Reconstructor head:</span> 256 → 1024 → 4950, MSE reconstruction of input connectivity (auxiliary regularizer + QC signal)</li>
              </ul>
              <p>
                Backbone: 16 × TransformerEncoderLayer with pre-LayerNorm, GELU activation, dropout 0.3, 16 attention heads, d_model=1024. Input (4950-dim) projected to single token then expanded to 32 × 1024 with learned positional embeddings.
              </p>
            </Block>

            <Block title="3. Training">
              <p>
                End-to-end joint training with separate learning rates: backbone at 5×10<sup>-6</sup>, heads at 5×10<sup>-4</sup>. AdamW optimizer, weight decay 10<sup>-4</sup>. Cosine-decay schedule with 5% warmup. Batch size 32. Trained to convergence on the best-val-acc checkpoint.
              </p>
              <p>
                Joint loss: <code className="text-xs">L = BCE(classifier, y) + 0.1 · MSE(reconstructor, x)</code>. The auxiliary MSE term was found to stabilize training on small cohorts and grants the reconstructor head credibility as a QC signal.
              </p>
            </Block>

            <Block title="4. Evaluation">
              <p>
                80/20 stratified split with fixed seed (random_state=42). Metrics computed on held-out 20% (309 subjects). Reported validation accuracy: <strong className="text-[var(--text)]">~63%</strong>. This is useful for research applications (cohort stratification, QC, hypothesis generation) but below diagnostic-grade thresholds.
              </p>
              <p>
                Cortex is <strong className="text-[var(--text)]">not</strong> intended for clinical diagnosis. ADOS-2 / ADI-R remain the clinical standard.
              </p>
            </Block>

            <Block title="5. Appropriate use">
              <ul className="list-disc ml-6 space-y-2">
                <li><span className="text-[var(--text)]">Research cohort stratification.</span> Use Cortex embeddings (256-dim) to cluster subjects into neural subtypes. Most principled when paired with behavioral phenotyping.</li>
                <li><span className="text-[var(--text)]">Dataset QC at scale.</span> Reconstruction-error scores flag preprocessing artifacts, motion, and site-specific oddities across cohorts of thousands.</li>
                <li><span className="text-[var(--text)]">Biomarker hypothesis generation.</span> Integrated gradients reveal ROI-pair importance patterns consistent with published autism connectivity literature. Candidates for targeted imaging studies, <em>not</em> standalone claims.</li>
              </ul>
            </Block>

            <Block title="6. Inappropriate use">
              <ul className="list-disc ml-6 space-y-2">
                <li>Individual clinical diagnosis (accuracy too low, false-positive/negative rates not suitable for clinical decisions)</li>
                <li>Treatment recommendation (no therapy-outcome data in training)</li>
                <li>Prediction of IQ, cognitive ability, or traits outside binary ASD/TD</li>
                <li>Application to non-rs-fMRI modalities (EEG, MEG, structural MRI) without retraining</li>
              </ul>
            </Block>

            <Block title="7. Reproducibility">
              <p>
                Training code: <code className="text-xs">neuro-app/train_cortex_v1.py</code>. Model weights on HuggingFace Hub at <code className="text-xs">Ibrahim9989/neurobrain-nd-transform/cortex_v1.pt</code>. Training metrics at <code className="text-xs">cortex_v1_metrics.json</code>.
              </p>
              <p>
                Source data: ABIDE I + II (publicly available, standard IRB-approved release). Preprocessing scripts: <code className="text-xs">neuro-app/export_training_data.py</code>.
              </p>
            </Block>
          </div>
        </Container>
      </Section>
      <Footer />
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-8">
      <h2 className="text-2xl mb-4">{title}</h2>
      <div className="text-[var(--muted)] leading-relaxed space-y-4 text-sm">
        {children}
      </div>
    </section>
  );
}
