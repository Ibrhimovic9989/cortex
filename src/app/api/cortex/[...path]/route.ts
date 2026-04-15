/**
 * Catch-all proxy route for /api/cortex/*
 *
 * Browser calls same-origin /api/cortex/{classify,embed,qc,biomarkers,info}
 * Next.js forwards server-side to the Azure-hosted FastAPI backend.
 * This avoids cross-origin CORS issues and removes browser-side dependency
 * on env vars.
 *
 * Backend URL can be overridden via CORTEX_BACKEND env var in Vercel
 * (server-side only — does NOT need NEXT_PUBLIC_ prefix).
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes — biomarker gradients can be slow

const BACKEND = process.env.CORTEX_BACKEND ?? "https://neurobrain-api.eastus.cloudapp.azure.com";

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const upstream = new URL(req.url);
  const target = `${BACKEND}/api/cortex/${path.join("/")}${upstream.search}`;

  // Copy method, headers, body
  const headers = new Headers();
  req.headers.forEach((v, k) => {
    // Drop headers Next.js / fetch shouldn't forward
    if (!["host", "connection", "content-length"].includes(k.toLowerCase())) {
      headers.set(k, v);
    }
  });

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    // Stream the body through (handles large file uploads)
    init.body = req.body;
    // Required for fetch with ReadableStream body
    // @ts-expect-error — duplex is a valid init field in Node fetch
    init.duplex = "half";
  }

  try {
    const res = await fetch(target, init);
    const respHeaders = new Headers();
    res.headers.forEach((v, k) => {
      // Drop headers the browser shouldn't re-interpret
      if (!["content-encoding", "content-length", "transfer-encoding"].includes(k.toLowerCase())) {
        respHeaders.set(k, v);
      }
    });
    return new NextResponse(res.body, { status: res.status, headers: respHeaders });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Upstream Cortex backend unreachable: ${msg}`, backend: BACKEND },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
