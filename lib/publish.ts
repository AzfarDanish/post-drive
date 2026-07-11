import { createClient } from "@/lib/supabase/server";

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
  post_id?: string;
  error?: string;
  details?: unknown;
}

export async function publishToThreads(
  post: string,
  media?: PostMedia | null,
  threadsAccountId?: string
): Promise<PublishResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  const query = supabase
    .from("threads_accounts")
    .select("threads_user_id, access_token")
    .eq("user_id", user.id);

  if (threadsAccountId) {
    query.eq("id", threadsAccountId);
  }

  const { data: account } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!account) {
    return {
      success: false,
      error: "No connected Threads account found. Connect at /connect",
    };
  }

  return publishAsAccount(post, media, account);
}

export async function publishAsAccount(
  post: string,
  media: PostMedia | null | undefined,
  account: ThreadsAccount
): Promise<PublishResult> {
  const base = "https://graph.threads.net/v1.0";
  const userId = account.threads_user_id;
  const token = account.access_token;

  const text = post.trim();

  const body: Record<string, string> = {
    media_type: media ? media.mediaType : "TEXT",
    access_token: token,
  };

  if (media) {
    const urlKey = media.mediaType === "IMAGE" ? "image_url" : "video_url";
    body[urlKey] = media.url;
    body.text = text;
  } else {
    body.text = text;
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
        error: "Failed to create media container",
        details: containerData,
      };
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000 * attempts));
  }

  const { id: creation_id } = containerData!;

  await new Promise((resolve) => setTimeout(resolve, 5_000));

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
      error: "Failed to publish post",
      details: publishData,
    };
  }

  return { success: true, post_id: publishData.id };
}
