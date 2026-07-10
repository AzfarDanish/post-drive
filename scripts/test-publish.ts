import { publishToThreads } from "../lib/publish";

async function main() {
  const text = process.argv[2] || "This is a manual test post. Ignore it.";

  console.log("Publishing:", text);
  console.log();

  const result = await publishToThreads([text]);

  console.log("Success:", result.success);
  console.log("Post IDs:", result.post_ids);
  if (result.error) {
    console.log("Error:", result.error);
    console.log("Details:", JSON.stringify(result.details, null, 2));
  }
}

main();
