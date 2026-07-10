import { generatePost } from "../lib/ai";

async function main() {
  const businessDescription = process.argv[2];
  if (!businessDescription) {
    console.error("Usage: npx tsx scripts/test-generate.ts '<business description>'");
    process.exit(1);
  }

  const posts = await generatePost(
    businessDescription,
    undefined,
    "rage-bait",
    240,
    480
  );

  posts.forEach((p, i) => {
    console.log(`--- Post ${i + 1} (${p.length} chars) ---`);
    console.log(p);
    console.log();
  });
}

main();
