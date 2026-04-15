# Cortex

Brain pattern recognition for neuroscience research. A standalone transformer model family trained on 1,545 resting-state fMRI scans to identify autism-associated connectivity patterns.

**This is not AQAL.** AQAL (at [mind.new](https://mind.new)) predicts how autistic brains *experience* stimuli. Cortex does the inverse — characterizes neural patterns in scans already taken.

## Three research tools

| Tool | Purpose | Route |
|---|---|---|
| **Stratifier** | Discover autism subtypes via embedding clustering | `/stratify` |
| **Flagger** | QC large neuroimaging cohorts via reconstruction-error scoring | `/flag` |
| **Explorer** | Identify ROI-pair biomarkers via integrated gradients | `/biomarkers` |

## Model

- **Architecture**: 227M-parameter transformer encoder + 3 joint heads (classifier, subject encoder, connectivity reconstructor)
- **Training data**: ABIDE I + II, 1,545 subjects (693 ASD, 852 TD), Schaefer 100-parcel atlas, Fisher-z connectivity, site-harmonized
- **Weights**: [Ibrahim9989/neurobrain-nd-transform/cortex_v1.pt](https://huggingface.co/Ibrahim9989/neurobrain-nd-transform)
- **Val accuracy**: ~58% (research tool — below diagnostic grade)

## Important

**Cortex is not for clinical diagnosis.** ADOS-2 / ADI-R remain the clinical standard. Cortex exists to help researchers stratify cohorts, flag atypical scans, and generate biomarker hypotheses — tasks where ~58% accuracy is informative.

## Development

```bash
npm install       # or pnpm install
npm run dev       # http://localhost:3000
npm run build
```

Stack: Next.js 15, React 19, Tailwind CSS 4, TypeScript 5.7.

## API

Cortex frontend calls `/api/cortex/*` on the `neuro-app` backend:

| Endpoint | Purpose |
|---|---|
| `GET /api/cortex/info` | Model version + metadata |
| `POST /api/cortex/classify` | ASD probability from connectivity |
| `POST /api/cortex/embed` | 256-dim subject embeddings |
| `POST /api/cortex/qc` | Reconstruction MSE + atypicality flags |
| `POST /api/cortex/biomarkers` | ROI-pair importance (integrated gradients) |

Configure backend URL via `NEXT_PUBLIC_CORTEX_API` env var. Default: `https://neuro.mind.new`.

## Methodology

See [`/methods`](/methods) in the app, or [FULL_FT_PLAN.md](https://github.com/Ibrahim9989/aqal/blob/main/neuro-app/FULL_FT_PLAN.md) in the main AQAL repo.

## License

Research preview. Not for clinical use.
