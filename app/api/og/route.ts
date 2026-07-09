import { NextRequest, NextResponse } from "next/server";
import { getOgData } from "@/lib/og";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url query parameter is required" }, { status: 400 });
  }

  try {
    const data = await getOgData(url);

    if (data.image && data.image.startsWith("http://")) {
      data.image = data.image.replace("http://", "https://");
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ url, title: null, description: null, image: null, siteName: null });
  }
}
