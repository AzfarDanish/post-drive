import { config } from "dotenv";
config({ path: ".env.local" });
import { generatePost } from "../lib/ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const businessDescription = process.argv[2];

  if (businessDescription) {
    const post = await generatePost(businessDescription, undefined, "rage-bait", 240, 480);
    console.log(`--- Post (${post.length} chars) ---`);
    console.log(post);
    console.log();
    return;
  }

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prefs || !prefs.business_description) {
    console.error("No business description found in DB. Pass one as an argument or save it in the app first.");
    process.exit(1);
  }

  console.log(`Using saved preferences (tone: ${prefs.default_tone}, ${prefs.char_min}-${prefs.char_max} chars)`);
  if (prefs.website_url) console.log(`Website: ${prefs.website_url}`);
  console.log();

  const post = await generatePost(
    prefs.business_description,
    prefs.website_url || undefined,
    (prefs.default_tone as "rage-bait" | "hot-take" | "storytelling" | "educational") || "rage-bait",
    prefs.char_min || 240,
    prefs.char_max || 480,
    prefs.target_audience || undefined,
    prefs.main_problem || undefined,
    prefs.key_features || undefined
  );

  console.log(`--- Post (${post.length} chars) ---`);
  console.log(post);
  console.log();
}

main();
