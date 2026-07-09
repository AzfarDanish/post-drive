export interface OgData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
}

function normalizeHtml(html: string): string {
  return html
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .replace(/\n\s*/g, " ");
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`property=["']${property}["']\\s+content=["']([^"']+)["']`, "i"),
    new RegExp(`content=["']([^"']+)["']\\s+property=["']${property}["']`, "i"),
    new RegExp(`name=["']${property}["']\\s+content=["']([^"']+)["']`, "i"),
    new RegExp(`content=["']([^"']+)["']\\s+name=["']${property}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1]
        .replace(/&#x27;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
    }
  }

  return null;
}

function resolveUrl(base: string, maybeRelative: string | null): string | null {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, base).href;
  } catch {
    return maybeRelative;
  }
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

export async function getOgData(url: string): Promise<OgData> {
  const result: OgData = {
    url,
    title: null,
    description: null,
    image: null,
    siteName: null,
  };

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PostDrive/1.0; +https://postdrive.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8_000),
      redirect: "follow",
    });

    const html = normalizeHtml(await resp.text());

    result.image =
      resolveUrl(url, extractMeta(html, "og:image")) ||
      resolveUrl(url, extractMeta(html, "og:image:secure_url")) ||
      resolveUrl(url, extractMeta(html, "twitter:image"));

    result.title =
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      extractTitle(html);

    result.description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "twitter:description") ||
      extractMeta(html, "description");

    result.siteName =
      extractMeta(html, "og:site_name");

    return result;
  } catch {
    return result;
  }
}
