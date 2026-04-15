"use client";

import { useState, useRef } from "react";

type Props = {
  onUpload: (file: File) => Promise<void>;
  onReset: () => void;
  helpText?: string;
  hasData: boolean;
  subjectCount?: number;
  sampleUrl?: string;
};

const DEFAULT_SAMPLE_URL = "/api/sample/csv";

export function UploadPanel({ onUpload, onReset, helpText, hasData, subjectCount, sampleUrl = DEFAULT_SAMPLE_URL }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setBusy(true);
    try {
      await onUpload(file);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-[var(--heading)] mb-1">Upload connectivity data</h3>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            {helpText || "Cortex parses CSV / TSV / TXT / Excel / .npz / .npy. Any 100-ROI atlas (Schaefer-100 recommended). Auto-detects headers, subject-ID columns, and delimiters."}
          </p>
          <div className="mt-2 text-xs text-[var(--muted)] space-y-1">
            <div><span className="text-[var(--text)]">Accepted shapes (any of):</span></div>
            <div>• <code className="text-[10px]">(N, 4950)</code> — N subjects, pre-extracted features</div>
            <div>• <code className="text-[10px]">(100, 100)</code> — single subject connectivity matrix</div>
            <div>• <code className="text-[10px]">(T, 100)</code> — single subject ROI time series (T ≥ 30) — we compute connectivity for you</div>
          </div>
          {sampleUrl && (
            <div className="mt-3 flex flex-wrap gap-3 items-center">
              <a
                href={sampleUrl}
                download
                className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Sample CSV — 30 subjects (1.4 MB)
              </a>
              <a
                href="/api/sample/hansen"
                download
                className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--accent)] hover:underline"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Hansen 2023 (HCP-group) .npy — 100×100 matrix
              </a>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".npz,.npy,.csv,.tsv,.txt,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="cta-primary disabled:opacity-50"
          >
            {busy ? "Running..." : hasData ? "Upload new file" : "Upload file"}
          </button>
          {hasData && (
            <button
              onClick={() => { setFileName(null); setError(null); onReset(); }}
              className="px-4 py-3 border border-[var(--border-strong)] rounded-lg hover:bg-[var(--hover-bg)] transition text-sm"
            >
              Reset to demo
            </button>
          )}
        </div>
      </div>

      {(fileName || error || hasData) && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-3 text-xs">
          {busy && (
            <>
              <span className="inline-block w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[var(--muted)]">Processing {fileName}...</span>
            </>
          )}
          {!busy && hasData && !error && (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[var(--muted)]">
                <span className="text-[var(--text)]">{fileName || "Data loaded"}</span>
                {subjectCount !== undefined && <> — <span className="text-[var(--text)]">{subjectCount}</span> subjects</>}
              </span>
            </>
          )}
          {error && (
            <>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--accent2)" }} />
              <span style={{ color: "var(--accent2)" }}>Error: {error}</span>
            </>
          )}
          {!busy && !hasData && !error && fileName && (
            <span className="text-[var(--muted)]">No data loaded — showing demo</span>
          )}
        </div>
      )}

      {!fileName && !hasData && !error && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
          Showing demo data. Upload your own .npz to get real Cortex predictions.
        </div>
      )}
    </div>
  );
}
