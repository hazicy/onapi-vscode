import fs from "node:fs";

const log = fs.readFileSync(process.argv[2], "utf8");
const failures = [
  ...log.matchAll(
    /^not ok[^\n]*(?:\n(?!not ok|ok |# Subtest:|1\.\.)[^\n]*)*/gm,
  ),
].map(([block]) => block.trim());
const escape = (value) =>
  value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");

if (failures.length) {
  for (const failure of failures) {
    console.log(`::error::${escape(failure)}`);
  }
} else {
  console.log(`::error::${escape(log.slice(-12000))}`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const details = failures.length ? failures.join("\n\n") : log.slice(-12000);
  // Escape HTML so arbitrary test output cannot create markup in the summary.
  const safe = details
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Failed unit tests\n\n<pre>${safe}</pre>\n`,
  );
}
