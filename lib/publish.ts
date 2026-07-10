import { getSupabase } from "@/lib/supabase";

export interface ThreadsAccount {
  threads_user_id: string;
  access_token: string;
}

interface PostMedia {
  url: string;
  mediaType: "IMAGE" | "VIDEO";
}

export interface PublishResult {
  success: boolean;
  post_ids: string[];
  error?: string;
  details?: unknown;
  published_count: number;
}

export async function publishToThreads(
  posts: string[],
  media?: (PostMedia | null)[]
): Promise<PublishResult> {
  const { data: account, error: queryError } = await getSupabase()
    .from("threads_accounts")
    .select("threads_user_id, access_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (queryError || !account) {
    return {
      success: false,
      post_ids: [],
      error: "No connected Threads account found. Connect at /connect",
      published_count: 0,
    };
  }

  return publishAsAccount(posts, media, account);
}

export async function publishAsAccount(
  posts: string[],
  media: (PostMedia | null)[] | undefined,
  account: ThreadsAccount
): Promise<PublishResult> {
  const base = "https://graph.threads.net/v1.0";
  const userId = account.threads_user_id;
  const token = account.access_token;
  const publishedIds: string[] = [];

  for (let i = 0; i < posts.length; i++) {
    const text = posts[i].trim();
    const postMedia: PostMedia | null = media?.[i] ?? null;

    if (i > 0 && publishedIds[i - 1]) {
      await new Promise((resolve) => setTimeout(resolve, 3_000));
    }

    const body: Record<string, string> = {
      media_type: postMedia ? postMedia.mediaType : "TEXT",
      access_token: token,
    };

    if (postMedia) {
      const urlKey =
        postMedia.mediaType === "IMAGE" ? "image_url" : "video_url";
      body[urlKey] = postMedia.url;
      body.text = text;
    } else {
      body.text = text;
    }

    if (i > 0 && publishedIds[i - 1]) {
      body.reply_to_id = publishedIds[i - 1];
    }

    let containerData: { id?: string };
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const containerRes = await fetch(`${base}/${userId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      containerData = await containerRes.json();

      if (containerRes.ok) break;

      attempts++;
      if (attempts >= maxAttempts) {
        return {
          success: false,
          post_ids: publishedIds,
          error: `Failed to create container for post ${i + 1}`,
          details: containerData,
          published_count: publishedIds.length,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 2_000 * attempts));
    }

    const { id: creation_id } = containerData!;

    const publishRes = await fetch(`${base}/${userId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id,
        access_token: token,
      }),
    });

    const publishData = await publishRes.json();

    if (!publishRes.ok) {
      return {
        success: false,
        post_ids: publishedIds,
        error: `Failed to publish post ${i + 1}`,
        details: publishData,
        published_count: publishedIds.length,
      };
    }

    publishedIds.push(publishData.id);
  }

  return { success: true, post_ids: publishedIds, published_count: publishedIds.length };
}
