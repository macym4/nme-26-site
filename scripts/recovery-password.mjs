import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";

if (!process.stdin.isTTY) {
  console.error("Run npm run recovery-password in an interactive terminal.");
  process.exit(1);
}
let hidden = false;
const output = new Writable({ write(chunk, encoding, callback) { if (!hidden) process.stdout.write(chunk, encoding); callback(); } });
const prompt = createInterface({ input: process.stdin, output, terminal: true });
try {
  process.stdout.write("Choose your shared recovery password (hidden): ");
  hidden = true;
  const password = await prompt.question("");
  hidden = false;
  process.stdout.write("\nConfirm password (hidden): ");
  hidden = true;
  const confirmation = await prompt.question("");
  hidden = false;
  process.stdout.write("\n");
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) throw new Error("Use at least 8 characters and no more than 72 bytes.");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  console.log("\nPaste this value into Vercel's ACCOUNT_RECOVERY_PASSWORD_HASH environment variable:");
  console.log(await bcrypt.hash(password, 12));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { hidden = false; prompt.close(); }
