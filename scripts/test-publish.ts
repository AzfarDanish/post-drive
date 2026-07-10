import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { publishAsAccount } from "../lib/publish";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const text = process.argv[2] || "This is a manual test post. Ignore it.";

  const { data: account } = await supabase
    .from("threads_accounts")
    .select("threads_user_id, access_token")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!account) {
    console.error("No connected Threads account found");
    process.exit(1);
  }

  console.log("Publishing:", text);
  console.log();

  const result = await publishAsAccount([text], undefined, account);

  console.log("Success:", result.success);
  console.log("Post IDs:", result.post_ids);
  if (result.error) {
    console.log("Error:", result.error);
    console.log("Details:", JSON.stringify(result.details, null, 2));
  }
}

main();
