/**
 * Cortex API client. Wraps calls to /api/cortex/* on the neuro-app backend.
 */

// Same-origin: calls go to the Cortex Next.js app's own /api/cortex/* route,
// which proxies server-side to the actual backend. This avoids CORS and
// removes browser-side env-var dependency.
// To override for local dev, set NEXT_PUBLIC_CORTEX_API=http://localhost:8000 etc.
const API_BASE = process.env.NEXT_PUBLIC_CORTEX_API ?? "";

export type SubjectMeta = {
  version: string;
  model_family: string;
  val_acc?: number;
  trained_on?: string;
  uses?: string[];
  disclaimer?: string;
};

export type Prediction = { idx: number; prob_asd: number };
export type EmbeddingRow = {
  idx: number;
  embedding: number[];
  prob_asd: number;
  recon_mse: number;
};
export type QCRow = {
  idx: number;
  recon_mse: number;
  z_score: number;
  flag: "clean" | "borderline" | "outlier";
  prob_asd: number;
};
export type Biomarker = {
  feature_idx: number;
  roi1: number;
  roi2: number;
  importance: number;
  direction: "ASD↑" | "ASD↓";
};

async function postFile<T>(endpoint: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}${endpoint}`, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Cortex API ${endpoint} failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function getCortexInfo(): Promise<SubjectMeta | { error: string; available: false }> {
  const res = await fetch(`${API_BASE}/api/cortex/info`);
  if (!res.ok) throw new Error(`Cortex info: ${res.status}`);
  return res.json();
}

export async function classify(file: File) {
  return postFile<{ n_subjects: number; predictions: Prediction[]; meta: SubjectMeta }>("/api/cortex/classify", file);
}

export async function embed(file: File) {
  return postFile<{ n_subjects: number; d_embed: number; subjects: EmbeddingRow[]; meta: SubjectMeta }>("/api/cortex/embed", file);
}

export async function qc(file: File) {
  return postFile<{
    n_subjects: number;
    cohort_stats: { mean_mse: number; std_mse: number };
    scans: QCRow[];
    meta: SubjectMeta;
  }>("/api/cortex/qc", file);
}

export async function biomarkers(file: File, topK = 25) {
  return postFile<{
    n_subjects: number;
    top_k: number;
    biomarkers: Biomarker[];
    meta: SubjectMeta;
    method: string;
  }>(`/api/cortex/biomarkers?top_k=${topK}`, file);
}

/** UMAP-style projection to 2D via PCA fallback (client-side). */
export function project2D(embeddings: number[][]): [number, number][] {
  if (embeddings.length === 0) return [];
  const d = embeddings[0].length;
  const n = embeddings.length;
  // Mean-center
  const mean = new Array(d).fill(0);
  embeddings.forEach((e) => e.forEach((v, i) => (mean[i] += v / n)));
  const centered = embeddings.map((e) => e.map((v, i) => v - mean[i]));

  // Power-iterate for top 2 principal components
  function topPC(matrix: number[][], skipV?: number[]): number[] {
    let v = new Array(d).fill(0).map(() => Math.random() - 0.5);
    for (let iter = 0; iter < 40; iter++) {
      if (skipV) {
        // Deflate: v -= (v · skipV) * skipV
        const dot = v.reduce((s, x, i) => s + x * skipV[i], 0);
        v = v.map((x, i) => x - dot * skipV[i]);
      }
      const Av = new Array(d).fill(0);
      matrix.forEach((row) => {
        const dot = row.reduce((s, x, i) => s + x * v[i], 0);
        row.forEach((x, i) => (Av[i] += x * dot));
      });
      const norm = Math.sqrt(Av.reduce((s, x) => s + x * x, 0)) || 1;
      v = Av.map((x) => x / norm);
    }
    return v;
  }

  const pc1 = topPC(centered);
  const pc2 = topPC(centered, pc1);

  const projected: [number, number][] = centered.map((e) => [
    e.reduce((s, x, i) => s + x * pc1[i], 0),
    e.reduce((s, x, i) => s + x * pc2[i], 0),
  ]);

  // Normalize to [-1, 1]
  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const maxAbsX = Math.max(...xs.map(Math.abs)) || 1;
  const maxAbsY = Math.max(...ys.map(Math.abs)) || 1;
  return projected.map(([x, y]) => [x / maxAbsX, y / maxAbsY]);
}
