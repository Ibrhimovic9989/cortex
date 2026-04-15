/**
 * Download-forcing proxy for sample files.
 *
 * HuggingFace serves CSV/NPY with content-type text/plain, which browsers
 * display inline. Users click the sample link and see raw text instead of
 * a downloaded file. This proxy sets Content-Disposition: attachment so
 * the browser always downloads.
 *
 * /api/sample/csv   → cortex_external_test.csv (30 subjects)
 * /api/sample/hansen → Hansen 2023 haemodynamic_connectivity.npy (group avg)
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour edge cache

const SAMPLES: Record<string, { url: string; filename: string; contentType: string }> = {
  csv: {
    url: "https://huggingface.co/Ibrahim9989/neurobrain-nd-transform/resolve/main/cortex_external_test.csv",
    filename: "cortex_external_test_30subjects.csv",
    contentType: "text/csv",
  },
  hansen: {
    url: "https://github.com/netneurolab/hansen_many_networks/raw/master/data/Schaefer100/haemodynamic_connectivity.npy",
    filename: "hansen_hcp_haemodynamic_connectivity_schaefer100.npy",
    contentType: "application/octet-stream",
  },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const sample = SAMPLES[file];
  if (!sample) {
    return NextResponse.json({ error: `Unknown sample: ${file}. Available: ${Object.keys(SAMPLES).join(", ")}` }, { status: 404 });
  }

  try {
    const res = await fetch(sample.url, { redirect: "follow" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${sample.url} returned ${res.status}` },
        { status: 502 },
      );
    }
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": sample.contentType,
        "Content-Disposition": `attachment; filename="${sample.filename}"`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Fetch failed: ${msg}` }, { status: 502 });
  }
}
