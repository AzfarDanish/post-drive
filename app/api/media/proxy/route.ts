import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("url query parameter is required", { status: 400 });
  }

  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(5_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PostDrive/1.0; +https://postdrive.app)",
      },
    });

    if (!resp.ok) {
      return NextResponse.json({ error: "failed to fetch image" }, { status: resp.status });
    }

    const contentType = resp.headers.get("content-type") || "image/png";
    const buffer = await resp.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "failed to proxy image" }, { status: 502 });
  }
}
